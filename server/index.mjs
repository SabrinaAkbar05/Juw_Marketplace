import { createStore } from './firestore-store.mjs';
import { createOrders } from './firestore-orders.mjs';
import { createProductRepository } from './firestore-products.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const directory = path.dirname(fileURLToPath(import.meta.url));

const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
const envOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);
const origins = new Set([...defaultOrigins, ...envOrigins]);
const allowedOrigin = envOrigins[0] || 'http://localhost:5173';

function isOriginAllowed(origin, host) {
  if (!origin) return true;
  if (origins.has(origin)) return true;
  if (origins.has('*')) return true;

  try {
    const originUrl = new URL(origin);
    // Allow Netlify production & deploy-preview domains
    if (originUrl.hostname.endsWith('.netlify.app')) return true;
    // Allow localhost/127.0.0.1 on any port in development
    if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') return true;
    // Allow same host (or matching Host/X-Forwarded-Host)
    if (host && (originUrl.host === host || originUrl.hostname === host.split(':')[0])) return true;
    // Allow configured Netlify deployment URLs
    const netlifyUrls = [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL].filter(Boolean);
    for (const nUrl of netlifyUrls) {
      if (new URL(nUrl).host === originUrl.host) return true;
    }
  } catch {
    return false;
  }
  return false;
}

let firebaseAuth;
let firestoreDB;
let productRepository;
let store;
let orderRepo;

async function initializeFirebase() {
  const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (getApps().length > 0) {
    firebaseAuth = getAuth();
    firestoreDB = getFirestore();
    productRepository = createProductRepository(firestoreDB);
    store = createStore(firestoreDB);
    orderRepo = createOrders(firestoreDB);
    return;
  }

  let credential = null;

  // 1. JSON string directly in environment variable (Netlify UI recommended)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      credential = cert(parsed);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e.message);
    }
  }

  // 2. Base64 encoded JSON string
  if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      credential = cert(JSON.parse(decoded));
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e.message);
    }
  }

  // 3. Individual environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
  if (!credential && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } catch (e) {
      console.error('Failed to initialize Firebase with individual env vars:', e.message);
    }
  }

  // 4. File path on disk (local development fallback)
  if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const fullPath = path.resolve(directory, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(fullPath)) {
      credential = cert(JSON.parse(fs.readFileSync(fullPath, 'utf8')));
    }
  }

  // 5. Default applicationDefault if GOOGLE_APPLICATION_CREDENTIALS exists
  if (!credential && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = applicationDefault();
  }

  if (!credential) {
    console.warn('⚠️ No Firebase service account credentials found. Auth & Firestore will be disabled.');
    return;
  }

  initializeApp({ credential });
  firebaseAuth = getAuth();
  firestoreDB = getFirestore();
  productRepository = createProductRepository(firestoreDB);
  store = createStore(firestoreDB);
  orderRepo = createOrders(firestoreDB);
}

let initPromise = null;
async function getOrInitApp() {
  if (!initPromise) {
    initPromise = (async () => {
      await initializeFirebase();
      await ensureDefaultCategories();
    })();
  }
  await initPromise;
  return { firebaseAuth, firestoreDB, productRepository, store, orderRepo };
}

function respond(res, status, body) {
  const reqOrigin = res.req?.headers?.origin;
  const host = res.req?.headers?.['x-forwarded-host'] || res.req?.headers?.host;
  const allowOrigin = reqOrigin && isOriginAllowed(reqOrigin, host) ? reqOrigin : (origins.has(reqOrigin) ? reqOrigin : allowedOrigin);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    Vary: 'Origin',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function failure(code, message) {
  return { status: code, message };
}

async function authenticate(req, admin = false) {
  if (!firebaseAuth) throw failure(503, 'Firebase authentication is not configured.');
  const match = /^Bearer (.+)$/i.exec(req.headers.authorization || '');
  if (!match) throw failure(401, 'Firebase ID token required');
  const user = await firebaseAuth.verifyIdToken(match[1], true).catch(() => {
    throw failure(401, 'Invalid or expired Firebase token');
  });

  // Check account suspension status in Firestore
  if (store) {
    const userDoc = await store.findUserByUid(user.uid).catch(() => null);
    const customerDoc = await store.findCustomerByUid(user.uid).catch(() => null);
    const accountStatus = userDoc?.status || customerDoc?.status || 'ACTIVE';
    if (accountStatus === 'SUSPENDED' || accountStatus === 'DISABLED') {
      throw failure(403, `Account has been ${accountStatus.toLowerCase()}. Access denied.`);
    }
  }

  if (admin) {
    const ids = (process.env.FIREBASE_ADMIN_UIDS || '').split(',').map(x => x.trim()).filter(Boolean);
    const hasAdminClaim = user.admin === true || user.super_admin === true || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    if (!ids.includes(user.uid) && !hasAdminClaim) throw failure(403, 'Admin access is not authorized');
  }
  return user;
}

async function body(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      throw failure(400, 'Invalid JSON payload');
    }
  }
  let raw = '';
  for await (const part of req) {
    raw += part;
    if (raw.length > (req.url?.includes('/images') || req.url?.includes('/upload-image') ? 2_800_000 : 1_000_000)) {
      throw failure(413, 'Request payload too large');
    }
  }
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw failure(400, 'Invalid JSON payload');
  }
}

const isText = (v, n = 250) => typeof v === 'string' && v.trim().length > 0 && v.length <= n;
const productStatuses = new Set(['ACTIVE', 'PENDING', 'NEEDS_CHANGES', 'REJECTED', 'OUT_OF_STOCK']);
const defaultSettings = {
  marketplaceName: 'JUW Marketplace',
  commissionRate: 5,
  enableGuestCheckout: false,
  campusPickupLocations: [
    'JUW Main Campus - Incubation Hub Counter (Block C)',
    'JUW Central Library Reception Desk (Ground Floor)',
    'Faculty Lounge - Administration Block',
    'Art & Design Department Gallery Kiosk (Block D)',
  ],
  bannerAnnouncement: '🎓 Welcome to the official JUW Student Entrepreneurial Marketplace! Support student innovation.',
  maintenanceMode: false,
};

function isSuperAdmin(user) {
  if (!user) return false;
  const adminIds = (process.env.FIREBASE_ADMIN_UIDS || '').split(',').map(x => x.trim()).filter(Boolean);
  if (user.uid === 'AiBU3zLcpXWPM4osYn2kFnpPt7l2' || (adminIds.length > 0 && user.uid === adminIds[0])) return true;
  if (user.super_admin === true || user.role === 'SUPER_ADMIN') return true;
  return false;
}

async function countActiveSuperAdmins() {
  const users = await store.list('users');
  const activeSuper = users.filter(u => u.role === 'SUPER_ADMIN' && u.status !== 'SUSPENDED' && u.status !== 'DISABLED');
  return Math.max(activeSuper.length, 1);
}

async function logAudit(action, actorUser, target = {}, details = {}) {
  try {
    const entry = {
      id: 'audit-' + randomUUID(),
      action,
      actorUid: actorUser?.uid || 'SYSTEM',
      actorEmail: actorUser?.email || 'system',
      actorRole: actorUser?.super_admin ? 'SUPER_ADMIN' : (actorUser?.admin ? 'ADMIN' : (actorUser?.role || 'USER')),
      targetUid: target.uid || target.id || null,
      targetEmail: target.email || null,
      targetType: target.type || 'USER',
      details,
      timestamp: new Date().toISOString(),
    };
    await store.create('auditLogs', entry, entry.id);
    return entry;
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

// ---------------- CATEGORY MANAGEMENT HELPERS ----------------
const defaultCategories = [
  {
    id: 'cat-fashion',
    name: 'Fashion & Clothing',
    slug: 'fashion-clothing',
    description: 'Handcrafted apparel, hand-embroidered kurtis, modest abayas, and silk scarves.',
    iconName: 'Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: true,
    sortOrder: 1,
    departmentTag: 'Dept. of Textile Design',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-art',
    name: 'Art & Collectibles',
    slug: 'art-collectibles',
    description: 'Original Islamic calligraphy, resin geode art, botanical watercolors, and canvas portraits.',
    iconName: 'Palette',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: true,
    sortOrder: 2,
    departmentTag: 'Dept. of Visual Studies',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-accessories',
    name: 'Fashion Accessories',
    slug: 'fashion-accessories',
    description: 'Handmade polymer clay jewelry, beaded handbags, crystal pins, and scrunchies.',
    iconName: 'Sparkles',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: true,
    sortOrder: 3,
    departmentTag: 'Dept. of Fine Arts',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-beauty',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'All-natural herbal hair oils, organic rose water mists, and handmade goat milk soaps.',
    iconName: 'Smile',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-57351f04523e?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: true,
    sortOrder: 4,
    departmentTag: 'Dept. of Bio-Technology',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-fragrances',
    name: 'Fragrances & Attar',
    slug: 'fragrances',
    description: 'Alcohol-free botanical attars, long-lasting luxury roll-on oils, and room sprays.',
    iconName: 'Droplet',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: false,
    sortOrder: 5,
    departmentTag: 'Dept. of Chemistry',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-bakery',
    name: 'Bakery & Treats',
    slug: 'bakery-treats',
    description: 'Freshly baked pistachio cardamom cookies, fudgy brownies, and customized bento cakes.',
    iconName: 'Cake',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: true,
    sortOrder: 6,
    departmentTag: 'Dept. of Food Science',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-textile',
    name: 'Textile & Home Decor',
    slug: 'textile-craft',
    description: 'Handloom block-printed table runners, crocheted tote bags, and cushion covers.',
    iconName: 'Home',
    imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: false,
    sortOrder: 7,
    departmentTag: 'Dept. of Textile Design',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-gift',
    name: 'Gift Shop & Keepsakes',
    slug: 'gift-shop-keepsakes',
    description: 'Personalized resin bookmarks, wax seal kits, motivational planners, and graduation hampers.',
    iconName: 'Gift',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: true,
    sortOrder: 8,
    departmentTag: 'JUW Entrepreneurship Club',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-sustainable',
    name: 'Eco-Friendly & Sustainable',
    slug: 'eco-friendly',
    description: 'Upcycled denim tote bags, reusable linen produce pouches, and organic seed plantables.',
    iconName: 'Leaf',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: false,
    sortOrder: 9,
    departmentTag: 'Environmental Science Club',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-electronics',
    name: 'Electronics & 3D Prints',
    slug: 'electronics',
    description: 'Custom 3D-printed phone cradles, modular desk cable organizers, and LED study lamps.',
    iconName: 'Cpu',
    imageUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: false,
    sortOrder: 10,
    departmentTag: 'Dept. of Computer Science & IT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-wellness',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Aromatherapy pure soy candles, herbal bedtime teas, and lavender essential diffusers.',
    iconName: 'HeartPulse',
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: false,
    sortOrder: 11,
    departmentTag: 'Dept. of Pharmacy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
  {
    id: 'cat-services',
    name: 'Campus Freelance Services',
    slug: 'services',
    description: 'Graphic design, FYP UI/UX, academic proofreading, event calligraphy, and tech assistance.',
    iconName: 'Briefcase',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    status: 'active',
    isFeatured: true,
    sortOrder: 12,
    departmentTag: 'JUW Incubation Centre',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM_SEED',
  },
];

function generateSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function isCategorySlugTaken(slug, excludeId = null) {
  if (!store) return false;
  const categories = await store.list('categories');
  const normalized = slug.trim().toLowerCase();
  return categories.some(c => (c.slug || '').trim().toLowerCase() === normalized && c.id !== excludeId);
}

async function getCategoriesWithCounts(adminMode = false) {
  if (!store) return [];
  const [categories, products] = await Promise.all([
    store.list('categories'),
    productRepository ? productRepository.getAll() : [],
  ]);

  // Approved products are active or out of stock in catalog
  const approvedProducts = products.filter(p => p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK');

  const counts = new Map();
  for (const p of approvedProducts) {
    for (const c of categories) {
      if (
        (p.categoryId && p.categoryId === c.id) ||
        (p.categorySlug && p.categorySlug.toLowerCase() === (c.slug || '').toLowerCase()) ||
        (p.category && p.category.toLowerCase() === (c.name || '').toLowerCase())
      ) {
        counts.set(c.id, (counts.get(c.id) || 0) + 1);
        break;
      }
    }
  }

  const result = categories.map(c => {
    const rawStatus = String(c.status || 'ACTIVE').toLowerCase();
    const status = rawStatus === 'active' ? 'active' : rawStatus === 'hidden' ? 'hidden' : 'archived';
    return {
      ...c,
      imageUrl: c.imageUrl || c.image || '',
      image: c.imageUrl || c.image || '',
      isFeatured: !!(c.isFeatured ?? c.featured),
      featured: !!(c.isFeatured ?? c.featured),
      status,
      sortOrder: Number.isFinite(c.sortOrder) ? Number(c.sortOrder) : 0,
      productCount: counts.get(c.id) || 0,
    };
  });

  result.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (!adminMode) {
    return result.filter(c => c.status === 'active');
  }
  return result;
}

async function ensureDefaultCategories() {
  if (!store) return;
  try {
    const existing = await store.list('categories');
    if (existing.length === 0) {
      console.log('Seeding initial marketplace categories into Firestore...');
      for (const cat of defaultCategories) {
        await store.create('categories', cat, cat.id);
      }
      console.log('Marketplace categories initialized successfully in Firestore.');
    }

    // Link any existing products that lack categoryId
    if (productRepository) {
      const allProducts = await productRepository.getAll();
      const currentCats = await store.list('categories');
      for (const prod of allProducts) {
        if (!prod.categoryId) {
          const match = currentCats.find(c =>
            (c.slug || '').toLowerCase() === (prod.categorySlug || '').toLowerCase() ||
            (c.name || '').toLowerCase() === (prod.category || '').toLowerCase()
          );
          if (match) {
            await productRepository.updateAdmin(prod.id, {
              categoryId: match.id,
              category: match.name,
              categorySlug: match.slug,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to ensure default categories:', err.message);
  }
}

function routeNotFound() {
  throw failure(404, 'Route not found');
}

async function handler(req, res) {
  res.req = req;
  if (req.method === 'OPTIONS') return respond(res, 204, {});
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
  if (req.headers?.origin && !isOriginAllowed(req.headers.origin, host)) {
    return respond(res, 403, { error: 'Origin not permitted' });
  }

  try {
    const u = new URL(req.url, 'http://localhost');
    let pathName = u.pathname.replace(/\/$/, '') || '/';
    if (pathName.startsWith('/.netlify/functions/api')) {
      pathName = pathName.replace(/^\/\.netlify\/functions\/api/, '/api');
    }
    const url = pathName || '/api';
    const m = req.method;

    // 1. HEALTH CHECK
    if (url === '/api/health' && m === 'GET') {
      let firestoreConnected = false;
      if (firestoreDB) {
        try {
          await firestoreDB.collection('products').limit(1).get();
          firestoreConnected = true;
        } catch (error) {
          console.error('Firestore connection error:', error.message);
        }
      }
      return respond(res, 200, {
        ok: true,
        storage: 'firestore',
        firebaseConfigured: !!firebaseAuth,
        firestoreConnected,
        productSource: 'firestore',
        sellerOrderSource: 'firestore',
      });
    }

    // 2. CATEGORIES & CATALOG (PUBLIC)
    if (url === '/api/categories' && m === 'GET') {
      const categories = await getCategoriesWithCounts(false);
      return respond(res, 200, { categories });
    }

    if (/^\/api\/categories\/[^/]+$/.test(url) && m === 'GET') {
      const slug = url.split('/')[3].toLowerCase();
      const categories = await getCategoriesWithCounts(false);
      const category = categories.find(c => (c.slug || '').toLowerCase() === slug || c.id === slug);
      if (!category) throw failure(404, 'Category not found');
      return respond(res, 200, category);
    }

    if (url === '/api/catalog' && m === 'GET') {
      if (!productRepository) throw failure(503, 'Firestore is not configured');
      const catalog = await productRepository.getCatalog();
      const activeCategories = await getCategoriesWithCounts(false);
      return respond(res, 200, {
        ...catalog,
        categories: activeCategories,
        services: await store.list('services'),
      });
    }

    if (/^\/api\/products\/[^/]+$/.test(url) && m === 'GET') {
      if (!productRepository) throw failure(503, 'Firestore is not configured');
      const productId = url.split('/')[3];
      const item = await productRepository.getPublicProductById(productId);
      if (!item) throw failure(404, 'Product not found');
      return respond(res, 200, item);
    }

    // Product reviews list
    if (/^\/api\/products\/[^/]+\/reviews$/.test(url) && m === 'GET') {
      const productId = url.split('/')[3];
      const allReviews = await store.list('reviews');
      const reviews = allReviews.filter(r => r.productId === productId && r.status === 'APPROVED');
      return respond(res, 200, { reviews });
    }

    // 3. AUTHENTICATION & CUSTOMER PROFILE
    if (url === '/api/auth/register' && m === 'POST') {
      if (!firebaseAuth) throw failure(503, 'Authentication service unavailable');
      const data = await body(req);
      if (!isText(data.email, 120) || !data.email.includes('@')) throw failure(400, 'Valid email required');
      if (typeof data.password !== 'string' || data.password.length < 6) throw failure(400, 'Password must be at least 6 characters');
      if (!isText(data.name, 100)) throw failure(400, 'Full name required');

      const userRecord = await firebaseAuth.createUser({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        displayName: data.name.trim(),
      }).catch(err => {
        if (err.code === 'auth/email-already-exists') throw failure(409, 'An account with this email already exists');
        throw failure(400, err.message || 'Registration failed');
      });

      const now = new Date().toISOString();
      const customer = {
        id: userRecord.uid,
        uid: userRecord.uid,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: (data.phone || '').trim(),
        departmentOrAffiliation: (data.department || 'JUW Student').trim(),
        role: data.role || 'STUDENT',
        status: 'ACTIVE',
        totalOrders: 0,
        totalSpent: 0,
        joinedDate: now.slice(0, 10),
        lastActive: now,
      };

      await store.create('customers', customer, userRecord.uid);
      return respond(res, 201, { ok: true, user: customer });
    }

    if (url === '/api/auth/me' && m === 'GET') {
      const user = await authenticate(req);
      let customer = await store.findCustomerByUid(user.uid);
      if (!customer) {
        const now = new Date().toISOString();
        customer = {
          id: user.uid,
          uid: user.uid,
          name: user.name || user.email?.split('@')[0] || 'JUW Member',
          email: user.email?.toLowerCase() || '',
          phone: '',
          departmentOrAffiliation: 'JUW Member',
          role: 'STUDENT',
          status: 'ACTIVE',
          totalOrders: 0,
          totalSpent: 0,
          joinedDate: now.slice(0, 10),
          lastActive: now,
        };
        await store.create('customers', customer, user.uid);
      }
      const seller = await store.findSellerByUid(user.uid);
      const adminIds = (process.env.FIREBASE_ADMIN_UIDS || '').split(',').map(x => x.trim()).filter(Boolean);
      const hasAdminClaim = user.admin === true || user.super_admin === true || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      const isAdmin = adminIds.includes(user.uid) || hasAdminClaim;
      return respond(res, 200, { customer, seller, isAdmin });
    }

    if (url === '/api/customer/profile' && m === 'PATCH') {
      const user = await authenticate(req);
      const data = await body(req);
      const updates = {};
      if (isText(data.name, 100)) updates.name = data.name.trim();
      if (isText(data.phone, 35)) updates.phone = data.phone.trim();
      if (isText(data.departmentOrAffiliation, 120)) updates.departmentOrAffiliation = data.departmentOrAffiliation.trim();
      updates.lastActive = new Date().toISOString();

      const updated = await store.update('customers', user.uid, updates);
      if (updates.name && firebaseAuth) {
        await firebaseAuth.updateUser(user.uid, { displayName: updates.name }).catch(() => {});
      }
      return respond(res, 200, { customer: updated });
    }

    if (url === '/api/auth/reset-password' && m === 'POST') {
      const data = await body(req);
      if (!isText(data.email, 120) || !data.email.includes('@')) throw failure(400, 'Valid email required');
      if (!firebaseAuth) throw failure(503, 'Auth service unavailable');
      const link = await firebaseAuth.generatePasswordResetLink(data.email.trim().toLowerCase()).catch(err => {
        throw failure(400, err.message || 'Password reset request failed');
      });
      return respond(res, 200, { ok: true, message: 'Password reset link generated', link });
    }

    // 3B. INVITATION VERIFICATION & ACCEPTANCE
    if (url === '/api/invitations/verify' && m === 'GET') {
      const token = u.searchParams.get('token');
      if (!token) throw failure(400, 'Invitation token required');

      const [sellerInvs, adminInvs] = await Promise.all([
        store.list('sellerInvitations'),
        store.list('adminInvitations'),
      ]);
      const inv = sellerInvs.find(i => i.token === token) || adminInvs.find(i => i.token === token);
      if (!inv) throw failure(404, 'Invitation not found');

      const isExpired = new Date(inv.expiresAt) < new Date();
      return respond(res, 200, {
        ok: true,
        valid: !isExpired && inv.status === 'PENDING',
        invitation: {
          type: inv.type,
          email: inv.email,
          fullName: inv.fullName,
          role: inv.role || 'SELLER',
          storeName: inv.storeName,
          department: inv.department,
          status: inv.status,
          isExpired,
          expiresAt: inv.expiresAt,
        },
      });
    }

    if (url === '/api/invitations/accept' && m === 'POST') {
      const data = await body(req);
      if (!data.token) throw failure(400, 'Invitation token required');

      let user = null;
      if (req.headers.authorization) {
        user = await authenticate(req).catch(() => null);
      }

      const [sellerInvs, adminInvs] = await Promise.all([
        store.list('sellerInvitations'),
        store.list('adminInvitations'),
      ]);
      const isSeller = sellerInvs.some(i => i.token === data.token);
      const isAdmin = adminInvs.some(i => i.token === data.token);

      if (!isSeller && !isAdmin) throw failure(404, 'Invalid or expired invitation token');

      const inv = isSeller
        ? sellerInvs.find(i => i.token === data.token)
        : adminInvs.find(i => i.token === data.token);

      if (inv.status !== 'PENDING') throw failure(400, `Invitation is already ${inv.status.toLowerCase()}`);
      if (new Date(inv.expiresAt) < new Date()) {
        await store.update(isSeller ? 'sellerInvitations' : 'adminInvitations', inv.id, { status: 'EXPIRED' });
        throw failure(400, 'Invitation has expired');
      }

      // If user not authenticated, create or resolve Firebase user by email
      if (!user) {
        if (!data.password || String(data.password).length < 6) {
          throw failure(400, 'Password of at least 6 characters is required to activate account');
        }
        let fbUser = await firebaseAuth.getUserByEmail(inv.email).catch(() => null);
        if (!fbUser) {
          fbUser = await firebaseAuth.createUser({
            email: inv.email,
            password: String(data.password),
            displayName: data.name || inv.fullName,
          });
        }
        user = {
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || inv.fullName,
        };

        // Create or update customer record
        const nowStr = new Date().toISOString();
        if (!(await store.findCustomerByUid(user.uid))) {
          await store.create('customers', {
            id: user.uid,
            uid: user.uid,
            name: user.name,
            email: user.email,
            phone: inv.phone || '',
            departmentOrAffiliation: inv.department || 'JUW Member',
            role: isSeller ? 'SELLER' : (inv.role || 'ADMIN'),
            status: 'ACTIVE',
            totalOrders: 0,
            totalSpent: 0,
            joinedDate: nowStr.slice(0, 10),
            lastActive: nowStr,
          }, user.uid);
        }
      }

      const now = new Date().toISOString();

      if (isSeller) {
        const existingSeller = await store.findSellerByUid(user.uid);
        if (existingSeller) throw failure(409, 'You already have a registered seller profile');

        const sellerId = 'seller-' + randomUUID();
        const sellerRecord = {
          id: sellerId,
          sellerCode: 'JUW-S-' + Math.floor(1000 + Math.random() * 9000),
          firebaseUid: user.uid,
          studentName: inv.fullName || user.name || user.email?.split('@')[0],
          studentRollNumber: inv.studentRollNumber || 'JUW-' + Date.now().toString().slice(-4),
          department: inv.department || 'Department of Computer Science & IT',
          semester: inv.semester || '5th Semester',
          contactEmail: user.email,
          contactPhone: inv.phone || data.phone || '',
          storeName: inv.storeName || `${inv.fullName || 'Student'}'s Campus Shop`,
          storeDescription: inv.storeDescription || '',
          verificationStatus: inv.initialStatus || 'VERIFIED',
          totalProductsListed: 0,
          lifetimeRevenue: 0,
          rating: 5.0,
          joinedDate: now.slice(0, 10),
          approvedBy: inv.createdByEmail,
          approvalDate: now,
        };
        await store.create('sellers', sellerRecord, sellerId);
        await store.update('customers', user.uid, { role: 'SELLER' }).catch(() => {});
        await store.update('sellerInvitations', inv.id, { status: 'ACCEPTED', acceptedAt: now, acceptedByUid: user.uid });
        await logAudit('SELLER_INVITATION_ACCEPTED', user, { email: user.email, uid: user.uid }, { invitationId: inv.id, sellerId });
        return respond(res, 200, { ok: true, message: 'Seller invitation accepted successfully! Your seller portal is ready.', role: 'SELLER', seller: sellerRecord });
      } else {
        const existingClaims = user.customClaims || {};
        const newClaims = {
          ...existingClaims,
          admin: true,
          super_admin: inv.role === 'SUPER_ADMIN',
          role: inv.role || 'ADMIN',
          permissions: inv.permissions || ['all'],
        };
        await firebaseAuth.setCustomUserClaims(user.uid, newClaims);

        const adminProfile = {
          uid: user.uid,
          id: user.uid,
          email: user.email,
          name: inv.fullName || user.name || user.email?.split('@')[0],
          role: inv.role || 'ADMIN',
          permissions: inv.permissions || ['all'],
          status: 'ACTIVE',
          roleAssignedAt: now,
          roleAssignedBy: inv.createdByEmail,
          customClaims: newClaims,
          updatedAt: now,
        };
        await store.create('users', adminProfile, user.uid);
        await store.update('customers', user.uid, { role: inv.role || 'ADMIN' }).catch(() => {});
        await store.update('adminInvitations', inv.id, { status: 'ACCEPTED', acceptedAt: now, acceptedByUid: user.uid });
        await logAudit('ADMIN_INVITATION_ACCEPTED', user, { email: user.email, uid: user.uid }, { invitationId: inv.id, role: inv.role });
        return respond(res, 200, { ok: true, message: 'Administrator invitation accepted successfully! Privileges granted.', role: inv.role });
      }
    }

    // 4. ORDERS & CHECKOUT
    if (url === '/api/orders' && m === 'POST') {
      if (!orderRepo) throw failure(503, 'Firestore unavailable');
      const data = await body(req);
      let user = null;
      if (req.headers.authorization) {
        user = await authenticate(req);
        if (user.email?.toLowerCase() !== String(data.customerEmail || '').toLowerCase()) {
          throw failure(403, 'Checkout email must match signed-in account');
        }
      }
      const order = await orderRepo.create(data, user?.uid || null);

      // Record activity in customer record if signed in
      if (user?.uid) {
        const customer = await store.findCustomerByUid(user.uid);
        if (customer) {
          await store.update('customers', user.uid, {
            totalOrders: (customer.totalOrders || 0) + 1,
            totalSpent: (customer.totalSpent || 0) + (order.total || 0),
            lastActive: new Date().toISOString(),
          });
        }
      }

      return respond(res, 201, order);
    }

    if (url === '/api/orders/me' && m === 'GET') {
      const user = await authenticate(req);
      const allOrders = await store.list('orders');
      const orders = allOrders.filter(
        o => o.customerUid === user.uid || (user.email && o.customerEmail?.toLowerCase() === user.email.toLowerCase())
      );
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return respond(res, 200, { orders });
    }

    if (/^\/api\/orders\/[^/]+$/.test(url) && m === 'GET') {
      const user = await authenticate(req);
      const orderId = url.split('/')[3];
      const order = await store.get('orders', orderId);
      if (!order) throw failure(404, 'Order not found');

      const adminIds = (process.env.FIREBASE_ADMIN_UIDS || '').split(',').map(x => x.trim()).filter(Boolean);
      const isAdmin = adminIds.includes(user.uid) || user.admin === true;
      const isOwner = order.customerUid === user.uid || (user.email && order.customerEmail?.toLowerCase() === user.email.toLowerCase());

      if (!isAdmin && !isOwner) {
        // Check if seller has items in order
        const seller = await store.findSellerByUid(user.uid);
        if (!seller || !order.items?.some(i => i.sellerId === seller.id)) {
          throw failure(403, 'Unauthorized to view this order');
        }
        // Expose only seller items
        return respond(res, 200, {
          ...order,
          items: order.items.filter(i => i.sellerId === seller.id),
        });
      }

      return respond(res, 200, order);
    }

    // Cancel order (by customer or admin) with automatic stock restoration
    if (/^\/api\/orders\/[^/]+\/cancel$/.test(url) && m === 'POST') {
      const user = await authenticate(req);
      const orderId = url.split('/')[3];
      const data = await body(req);
      const adminIds = (process.env.FIREBASE_ADMIN_UIDS || '').split(',').map(x => x.trim()).filter(Boolean);
      const isAdmin = adminIds.includes(user.uid) || user.admin === true;

      const cancelled = await orderRepo.cancel(orderId, user.uid, isAdmin, data.reason || '');
      return respond(res, 200, cancelled);
    }

    // 5. REVIEWS
    if (url === '/api/reviews' && m === 'POST') {
      const user = await authenticate(req);
      const data = await body(req);
      if (!isText(data.productId, 100)) throw failure(400, 'Product ID required');
      const rating = Number(data.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw failure(400, 'Rating must be an integer 1-5');
      if (!isText(data.comment, 2000)) throw failure(400, 'Review comment required');

      const product = await store.get('products', data.productId);
      if (!product) throw failure(404, 'Product not found');

      const customer = await store.findCustomerByUid(user.uid);
      const customerOrders = (await store.list('orders')).filter(
        o => (o.customerUid === user.uid || (user.email && o.customerEmail?.toLowerCase() === user.email.toLowerCase()))
      );
      const verifiedPurchase = customerOrders.some(
        o => (o.status === 'DELIVERED' || o.status === 'READY') && o.items?.some(i => i.productId === data.productId)
      );

      const reviewId = randomUUID();
      const now = new Date().toISOString();
      const review = {
        id: reviewId,
        productId: data.productId,
        productName: product.name,
        customerUid: user.uid,
        customerName: customer?.name || user.name || 'JUW Student',
        rating,
        comment: data.comment.trim(),
        createdAt: now.slice(0, 10),
        status: 'APPROVED',
        verifiedPurchase,
      };

      await store.create('reviews', review, reviewId);

      // Update product rating and review count
      const allProductReviews = (await store.list('reviews')).filter(r => r.productId === data.productId && r.status === 'APPROVED');
      const avgRating = allProductReviews.reduce((sum, r) => sum + r.rating, 0) / (allProductReviews.length || 1);
      await store.update('products', data.productId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allProductReviews.length,
      });

      return respond(res, 201, review);
    }

    // 6. SUPPORT TICKETS
    if (url === '/api/support' && m === 'POST') {
      const user = await authenticate(req);
      const data = await body(req);
      if (!isText(data.subject, 180) || !isText(data.description, 4000)) {
        throw failure(400, 'Subject and description required');
      }
      const now = new Date().toISOString();
      const id = randomUUID();
      const customer = await store.findCustomerByUid(user.uid);
      const ticket = {
        id,
        ticketNumber: 'TKT-' + id.slice(0, 8).toUpperCase(),
        customerUid: user.uid,
        customerName: customer?.name || user.name || data.customerName || 'JUW Member',
        customerEmail: user.email || data.customerEmail || '',
        orderNumber: data.orderNumber || null,
        issueType: data.issueType || 'OTHER',
        subject: data.subject.trim(),
        description: data.description.trim(),
        status: 'OPEN',
        priority: 'MEDIUM',
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: randomUUID(),
            sender: 'CUSTOMER',
            senderName: customer?.name || user.name || 'Customer',
            message: data.description.trim(),
            timestamp: now,
          },
        ],
        internalAdminNotes: [],
      };
      await store.create('tickets', ticket, id);
      return respond(res, 201, { id, ticketNumber: ticket.ticketNumber, status: ticket.status });
    }

    if (url === '/api/support/me' && m === 'GET') {
      const user = await authenticate(req);
      const tickets = (await store.list('tickets')).filter(t => t.customerUid === user.uid);
      tickets.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      return respond(res, 200, { tickets });
    }

    if (/^\/api\/support\/[^/]+\/reply$/.test(url) && m === 'POST') {
      const user = await authenticate(req);
      const ticketId = url.split('/')[3];
      const data = await body(req);
      if (!isText(data.message, 4000)) throw failure(400, 'Reply message cannot be empty');

      const ticket = await store.get('tickets', ticketId);
      if (!ticket) throw failure(404, 'Ticket not found');
      if (ticket.customerUid !== user.uid) throw failure(403, 'Unauthorized');

      const now = new Date().toISOString();
      const newMessage = {
        id: randomUUID(),
        sender: 'CUSTOMER',
        senderName: user.name || 'Customer',
        message: data.message.trim(),
        timestamp: now,
      };

      const updated = await store.update('tickets', ticketId, {
        messages: [...(ticket.messages || []), newMessage],
        status: ticket.status === 'CLOSED' ? 'OPEN' : ticket.status,
        updatedAt: now,
      });

      return respond(res, 200, updated);
    }

    // 7. SELLER PORTAL ENDPOINTS
    if (url === '/api/seller/apply' && m === 'POST') {
      const user = await authenticate(req);
      const data = await body(req);
      if (
        !isText(data.studentName, 100) ||
        !isText(data.department, 120) ||
        !isText(data.studentRollNumber, 60) ||
        !isText(data.contactPhone, 35)
      ) {
        throw failure(400, 'Student name, roll number, department, and phone are required');
      }
      if (await store.findSellerByUid(user.uid)) {
        throw failure(409, 'A seller application already exists for this account');
      }

      const id = randomUUID();
      const seller = {
        id,
        firebaseUid: user.uid,
        sellerCode: 'JUW-SEL-' + id.slice(0, 6).toUpperCase(),
        studentName: data.studentName.trim(),
        studentRollNumber: data.studentRollNumber.trim(),
        department: data.department.trim(),
        semester: String(data.semester || '').trim(),
        contactEmail: user.email || '',
        contactPhone: data.contactPhone.trim(),
        storeName: (data.storeName || `${data.studentName.trim()}'s Studio`).trim(),
        storeDescription: (data.storeDescription || '').trim(),
        verificationStatus: 'PENDING_VERIFICATION',
        rejectionReason: '',
        totalProductsListed: 0,
        lifetimeRevenue: 0,
        rating: 0,
        joinedDate: new Date().toISOString().slice(0, 10),
      };

      await store.create('sellers', seller, id);
      return respond(res, 201, { seller });
    }

    if (url === '/api/seller/images' && m === 'POST') {
      const user = await authenticate(req);
      const seller = await store.findSellerByUid(user.uid);
      if (!seller || seller.verificationStatus !== 'VERIFIED') {
        throw failure(403, 'Only verified sellers can upload images');
      }
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw failure(503, 'Cloudinary credentials are not configured');
      }
      const data = await body(req);
      if (typeof data.image !== 'string' || !/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)) {
        throw failure(400, 'Upload a valid PNG, JPEG, or WebP base64 image');
      }
      const bytes = Buffer.from(data.image.split(',')[1], 'base64');
      if (bytes.length > 2_000_000 || bytes.length < 50) {
        throw failure(413, 'Image size must be under 2 MB');
      }
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });

      const result = await cloudinary.uploader.upload(data.image, {
        folder: `juw-marketplace/sellers/${seller.id}`,
        resource_type: 'image',
        overwrite: false,
      });

      return respond(res, 201, { url: result.secure_url, publicId: result.public_id });
    }

    if (url.startsWith('/api/seller/')) {
      const user = await authenticate(req);
      const seller = await store.findSellerByUid(user.uid);

      if (url === '/api/seller/me' && m === 'GET') {
        return respond(res, 200, { seller: seller || null });
      }

      if (!seller) throw failure(403, 'Apply for a seller account first');
      if (seller.verificationStatus !== 'VERIFIED') {
        throw failure(403, `Seller account status is ${seller.verificationStatus}`);
      }

      const owned = await productRepository.getOwned(seller.id);
      const myOrders = async () =>
        (await store.list('orders'))
          .map(order => ({
            ...order,
            items: (order.items || []).filter(line => line.sellerId === seller.id),
          }))
          .filter(order => order.items.length > 0)
          .map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            createdAt: order.createdAt,
            deliveryType: order.deliveryType,
            status: order.status,
            items: order.items,
            subtotal: order.items.reduce((s, i) => s + i.price * i.quantity, 0),
          }));

      if (url === '/api/seller/dashboard' && m === 'GET') {
        const orders = await myOrders();
        const completedSales = orders
          .filter(o => o.status === 'DELIVERED')
          .reduce((sum, o) => sum + o.subtotal, 0);

        return respond(res, 200, {
          seller,
          products: owned,
          orders,
          stats: {
            totalProducts: owned.length,
            activeProducts: owned.filter(p => p.status === 'ACTIVE').length,
            pendingProducts: owned.filter(p => p.status === 'PENDING').length,
            ordersCount: orders.length,
            grossRevenue: completedSales,
            pendingOrders: orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length,
          },
        });
      }

      if (url === '/api/seller/products' && m === 'POST') {
        const data = await body(req);
        if (
          !isText(data.name, 150) ||
          !isText(data.description, 4000) ||
          !Number.isFinite(data.price) ||
          data.price <= 0 ||
          !Number.isInteger(data.stock) ||
          data.stock < 0 ||
          (!isText(data.category, 120) && !data.categoryId)
        ) {
          throw failure(400, 'Valid product title, category, description, price, and stock are required');
        }

        // Validate category exists and is currently active
        const allCategories = await store.list('categories');
        const targetCategory = allCategories.find(c =>
          (data.categoryId && c.id === data.categoryId) ||
          (data.categorySlug && (c.slug || '').toLowerCase() === data.categorySlug.toLowerCase()) ||
          (data.category && (c.name || '').toLowerCase() === data.category.toLowerCase()) ||
          (data.category && (c.slug || '').toLowerCase() === generateSlug(data.category))
        );

        if (!targetCategory) {
          throw failure(400, 'Selected category does not exist or has been removed');
        }
        const normStatus = String(targetCategory.status || 'ACTIVE').toLowerCase();
        if (normStatus !== 'active') {
          throw failure(400, `Category "${targetCategory.name}" is currently ${normStatus} and not accepting new listings`);
        }

        const id = randomUUID();
        const product = {
          id,
          sellerId: seller.id,
          name: data.name.trim(),
          tagline: String(data.tagline || '').slice(0, 200),
          description: data.description.trim(),
          categoryId: targetCategory.id,
          category: targetCategory.name,
          categorySlug: targetCategory.slug,
          price: data.price,
          stock: data.stock,
          images: Array.isArray(data.images)
            ? data.images.filter(x => typeof x === 'string' && /^https:\/\//.test(x)).slice(0, 6)
            : [],
          tags: Array.isArray(data.tags) ? data.tags.slice(0, 8) : [],
          status: 'PENDING',
          rating: 0,
          reviewCount: 0,
          isFeatured: false,
          isBestSeller: false,
          isNewArrival: true,
          createdAt: new Date().toISOString().slice(0, 10),
          sellerDepartment: seller.department,
          sku: 'JUW-' + id.slice(0, 8).toUpperCase(),
        };

        const created = await productRepository.create(product);
        return respond(res, 201, created);
      }

      // Update product owned by seller
      const productId = url.match(/^\/api\/seller\/products\/([^/]+)$/)?.[1];
      if (productId && m === 'PATCH') {
        const existing = owned.find(x => x.id === productId);
        if (!existing) throw failure(404, 'Product not found');
        const data = await body(req);
        const changes = {};
        for (const key of ['name', 'description', 'tagline', 'category', 'categorySlug', 'categoryId', 'price', 'stock', 'images']) {
          if (Object.hasOwn(data, key)) changes[key] = data[key];
        }

        // Validate category if category details are being modified
        if (data.categoryId || data.category || data.categorySlug) {
          const allCategories = await store.list('categories');
          const targetCategory = allCategories.find(c =>
            (data.categoryId && c.id === data.categoryId) ||
            (data.categorySlug && (c.slug || '').toLowerCase() === data.categorySlug.toLowerCase()) ||
            (data.category && (c.name || '').toLowerCase() === data.category.toLowerCase()) ||
            (data.category && (c.slug || '').toLowerCase() === generateSlug(data.category))
          );
          if (!targetCategory) {
            throw failure(400, 'Selected category does not exist or has been removed');
          }
          const normStatus = String(targetCategory.status || 'ACTIVE').toLowerCase();
          if (normStatus !== 'active') {
            throw failure(400, `Category "${targetCategory.name}" is currently ${normStatus} and not accepting new listings`);
          }
          changes.categoryId = targetCategory.id;
          changes.category = targetCategory.name;
          changes.categorySlug = targetCategory.slug;
        }

        const candidate = { ...existing, ...changes };
        if (
          !isText(candidate.name, 150) ||
          !isText(candidate.description, 4000) ||
          !Number.isFinite(candidate.price) ||
          candidate.price <= 0 ||
          !Number.isInteger(candidate.stock) ||
          candidate.stock < 0
        ) {
          throw failure(400, 'Invalid product details');
        }

        const updated = await productRepository.updateOwned(productId, seller.id, changes);
        if (!updated) throw failure(404, 'Product not found');
        return respond(res, 200, updated);
      }

      // Seller update order item fulfillment status
      const sellerOrderId = url.match(/^\/api\/seller\/orders\/([^/]+)\/item$/)?.[1];
      if (sellerOrderId && m === 'PATCH') {
        const data = await body(req);
        if (!data.status) throw failure(400, 'Fulfillment status required');
        const updated = await orderRepo.updateItemFulfillment(
          sellerOrderId,
          seller.id,
          data.productId || null,
          data.status,
          data.note || ''
        );
        return respond(res, 200, {
          ...updated,
          items: updated.items.filter(i => i.sellerId === seller.id),
        });
      }

      routeNotFound();
    }

    // 8. ADMIN OPERATIONS
    if (url === '/api/admin/bootstrap' && m === 'GET') {
      const user = await authenticate(req, true);
      const isSuper = isSuperAdmin(user);

      const [
        products,
        orders,
        tickets,
        customers,
        sellers,
        reviews,
        settings,
        users,
        adminInvitations,
        sellerInvitations,
        auditLogs,
        categories,
      ] = await Promise.all([
        productRepository.getAll(),
        store.list('orders'),
        store.list('tickets'),
        store.list('customers'),
        store.list('sellers'),
        store.list('reviews'),
        store.get('settings', 'marketplace').then(s => s || defaultSettings),
        store.list('users'),
        store.list('adminInvitations'),
        store.list('sellerInvitations'),
        store.list('auditLogs'),
        getCategoriesWithCounts(true),
      ]);

      return respond(res, 200, {
        products,
        orders,
        tickets,
        customers,
        sellers,
        reviews,
        settings,
        users,
        adminInvitations,
        sellerInvitations,
        categories,
        auditLogs: auditLogs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 100),
        currentUser: {
          uid: user.uid,
          email: user.email,
          isSuperAdmin: isSuper,
          role: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
        },
      });
    }

    if (url.startsWith('/api/admin/')) {
      const user = await authenticate(req, true);
      const segments = url.split('/');
      const resource = segments[3];
      const id = segments[4];
      const subAction = segments[5];
      const data = m === 'POST' || m === 'PATCH' || m === 'DELETE' ? await body(req) : {};

      // User Search (for Add Seller / Add Admin existing account selector)
      if (resource === 'users' && id === 'search' && m === 'GET') {
        const query = (u.searchParams.get('q') || '').trim().toLowerCase();
        if (!query || query.length < 2) return respond(res, 200, { results: [] });

        const [customers, sellers, admins] = await Promise.all([
          store.list('customers'),
          store.list('sellers'),
          store.list('users'),
        ]);

        const sellerUidMap = new Map(sellers.map(s => [s.firebaseUid, s]));
        const adminUidMap = new Map(admins.map(a => [a.uid || a.id, a]));

        const matches = [];
        for (const c of customers) {
          const email = (c.email || '').toLowerCase();
          const name = (c.name || '').toLowerCase();
          const uid = (c.uid || c.id || '');
          if (email.includes(query) || name.includes(query) || uid.toLowerCase().includes(query)) {
            const seller = sellerUidMap.get(uid);
            const admin = adminUidMap.get(uid);
            matches.push({
              uid,
              name: c.name,
              email: c.email,
              phone: c.phone || '',
              department: c.departmentOrAffiliation || '',
              status: c.status || 'ACTIVE',
              isSeller: !!seller,
              sellerStatus: seller?.verificationStatus,
              sellerStoreName: seller?.storeName,
              isAdmin: !!admin,
              adminRole: admin?.role,
            });
          }
        }

        for (const s of sellers) {
          if (!matches.some(m => m.uid === s.firebaseUid)) {
            const email = (s.contactEmail || '').toLowerCase();
            const name = (s.studentName || '').toLowerCase();
            const roll = (s.studentRollNumber || '').toLowerCase();
            if (email.includes(query) || name.includes(query) || roll.includes(query)) {
              matches.push({
                uid: s.firebaseUid,
                name: s.studentName,
                email: s.contactEmail,
                phone: s.contactPhone || '',
                department: s.department || '',
                status: 'ACTIVE',
                isSeller: true,
                sellerStatus: s.verificationStatus,
                sellerStoreName: s.storeName,
                isAdmin: false,
              });
            }
          }
        }

        return respond(res, 200, { results: matches.slice(0, 20) });
      }

      // Add Seller (Direct from Admin or Invitation)
      if (resource === 'sellers' && !id && m === 'POST') {
        const onboardingMethod = data.onboardingMethod || 'INVITE';
        if (!isText(data.fullName, 100)) throw failure(400, 'Full name required');
        if (!isText(data.email, 120) || !data.email.includes('@')) throw failure(400, 'Valid email required');
        if (!isText(data.storeName, 120)) throw failure(400, 'Store name required');

        if (onboardingMethod === 'EXISTING_USER') {
          if (!data.existingUid) throw failure(400, 'Existing Firebase user UID required');
          const existingUser = await firebaseAuth.getUser(data.existingUid).catch(() => null);
          if (!existingUser) throw failure(404, 'Firebase user not found');

          const existingSeller = await store.findSellerByUid(data.existingUid);
          if (existingSeller) throw failure(409, 'This user already has a registered seller profile');

          const sellerId = 'seller-' + randomUUID();
          const sellerRecord = {
            id: sellerId,
            sellerCode: 'JUW-S-' + Math.floor(1000 + Math.random() * 9000),
            firebaseUid: data.existingUid,
            studentName: data.fullName.trim(),
            studentRollNumber: (data.studentRollNumber || 'JUW-' + Date.now().toString().slice(-4)).trim(),
            department: (data.department || 'Department of Computer Science & IT').trim(),
            semester: (data.semester || '5th Semester').trim(),
            contactEmail: data.email.trim().toLowerCase(),
            contactPhone: (data.phone || '').trim(),
            storeName: data.storeName.trim(),
            storeDescription: (data.storeDescription || '').trim(),
            verificationStatus: data.verificationStatus || 'VERIFIED',
            totalProductsListed: 0,
            lifetimeRevenue: 0,
            rating: 5.0,
            joinedDate: new Date().toISOString().slice(0, 10),
            approvedBy: user.email,
            approvalDate: new Date().toISOString(),
          };
          await store.create('sellers', sellerRecord, sellerId);
          await store.update('customers', data.existingUid, { role: 'SELLER' }).catch(() => {});
          await logAudit('SELLER_ADDED_EXISTING', user, { uid: data.existingUid, email: data.email }, { storeName: data.storeName, status: sellerRecord.verificationStatus });
          return respond(res, 201, { ok: true, seller: sellerRecord });
        } else {
          const token = randomUUID();
          const invitationId = 'sinv-' + randomUUID();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          const invitation = {
            id: invitationId,
            token,
            type: 'SELLER_INVITATION',
            fullName: data.fullName.trim(),
            email: data.email.trim().toLowerCase(),
            studentRollNumber: (data.studentRollNumber || '').trim(),
            department: (data.department || 'Department of Computer Science & IT').trim(),
            semester: (data.semester || '5th Semester').trim(),
            phone: (data.phone || '').trim(),
            storeName: data.storeName.trim(),
            storeDescription: (data.storeDescription || '').trim(),
            initialStatus: data.verificationStatus || 'VERIFIED',
            status: 'PENDING',
            createdByUid: user.uid,
            createdByEmail: user.email,
            createdAt: new Date().toISOString(),
            expiresAt,
          };
          await store.create('sellerInvitations', invitation, invitationId);
          await logAudit('SELLER_INVITATION_CREATED', user, { email: data.email }, { storeName: data.storeName, expiresAt });
          return respond(res, 201, { ok: true, invitation });
        }
      }

      // Add Administrator (Super Admin Only)
      if (resource === 'administrators' && m === 'POST') {
        if (!isSuperAdmin(user)) throw failure(403, 'Only Super Admins can appoint administrators');
        const onboardingMethod = data.onboardingMethod || 'INVITE';
        const role = data.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
        const permissions = Array.isArray(data.permissions) && data.permissions.length > 0 ? data.permissions : (role === 'SUPER_ADMIN' ? ['all'] : ['products', 'orders', 'support', 'sellers', 'customers']);

        if (!isText(data.fullName, 100)) throw failure(400, 'Full name required');
        if (!isText(data.email, 120) || !data.email.includes('@')) throw failure(400, 'Valid email required');

        if (onboardingMethod === 'EXISTING_USER') {
          if (!data.existingUid) throw failure(400, 'Existing Firebase user UID required');
          const targetUser = await firebaseAuth.getUser(data.existingUid).catch(() => null);
          if (!targetUser) throw failure(404, 'Firebase user not found');

          const existingClaims = targetUser.customClaims || {};
          const newClaims = {
            ...existingClaims,
            admin: true,
            super_admin: role === 'SUPER_ADMIN',
            role,
            permissions,
          };
          await firebaseAuth.setCustomUserClaims(data.existingUid, newClaims);

          const now = new Date().toISOString();
          const adminProfile = {
            uid: data.existingUid,
            id: data.existingUid,
            email: data.email.trim().toLowerCase(),
            name: data.fullName.trim(),
            role,
            permissions,
            status: 'ACTIVE',
            roleAssignedAt: now,
            roleAssignedBy: user.email,
            customClaims: newClaims,
            updatedAt: now,
          };
          await store.create('users', adminProfile, data.existingUid);
          await store.update('customers', data.existingUid, { role }).catch(() => {});
          await logAudit('ADMIN_ROLE_ASSIGNED', user, { uid: data.existingUid, email: data.email }, { role, permissions });
          return respond(res, 201, { ok: true, user: adminProfile });
        } else {
          const token = randomUUID();
          const invitationId = 'ainv-' + randomUUID();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          const invitation = {
            id: invitationId,
            token,
            type: 'ADMIN_INVITATION',
            fullName: data.fullName.trim(),
            email: data.email.trim().toLowerCase(),
            role,
            permissions,
            status: 'PENDING',
            createdByUid: user.uid,
            createdByEmail: user.email,
            createdAt: new Date().toISOString(),
            expiresAt,
          };
          await store.create('adminInvitations', invitation, invitationId);
          await logAudit('ADMIN_INVITATION_CREATED', user, { email: data.email }, { role, expiresAt });
          return respond(res, 201, { ok: true, invitation });
        }
      }

      // Change User Status / Suspend / Reactivate
      if (resource === 'users' && id && subAction === 'status' && m === 'PATCH') {
        const nextStatus = data.status;
        if (!['ACTIVE', 'SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION'].includes(nextStatus)) {
          throw failure(400, 'Invalid status');
        }

        const targetUser = await store.get('users', id) || await store.findUserByUid(id);
        const targetCustomer = await store.get('customers', id) || await store.findCustomerByUid(id);
        const targetSeller = await store.findSellerByUid(id) || await store.get('sellers', id);

        if (targetUser?.role === 'SUPER_ADMIN' || targetCustomer?.role === 'SUPER_ADMIN') {
          if (!isSuperAdmin(user)) throw failure(403, 'Only Super Admins can modify another Super Admin');
          if (nextStatus === 'SUSPENDED' || nextStatus === 'DISABLED') {
            const count = await countActiveSuperAdmins();
            if (count <= 1) {
              throw failure(400, 'Cannot suspend or disable the last active Super Admin. Appoint another Super Admin first.');
            }
          }
        }

        if (targetUser) {
          await store.update('users', targetUser.id, { status: nextStatus, updatedAt: new Date().toISOString() });
        }
        if (targetCustomer) {
          await store.update('customers', targetCustomer.id, { status: nextStatus, lastActive: new Date().toISOString() });
        }
        if (targetSeller) {
          const sellerStatus = nextStatus === 'ACTIVE' ? 'VERIFIED' : (nextStatus === 'SUSPENDED' ? 'SUSPENDED' : targetSeller.verificationStatus);
          await store.update('sellers', targetSeller.id, { verificationStatus: sellerStatus });
        }

        if (nextStatus === 'SUSPENDED' || nextStatus === 'DISABLED') {
          await firebaseAuth.revokeRefreshTokens(id).catch(() => {});
        }

        await logAudit('USER_STATUS_CHANGED', user, { uid: id, email: targetUser?.email || targetCustomer?.email }, { newStatus: nextStatus, reason: data.reason });
        return respond(res, 200, { ok: true, status: nextStatus });
      }

      // Revoke Role
      if (resource === 'users' && id && subAction === 'revoke' && m === 'POST') {
        const roleToRevoke = data.role;
        if (roleToRevoke === 'ADMIN' || roleToRevoke === 'SUPER_ADMIN') {
          if (!isSuperAdmin(user)) throw failure(403, 'Only Super Admins can revoke administrator privileges');
          if (roleToRevoke === 'SUPER_ADMIN') {
            const count = await countActiveSuperAdmins();
            if (count <= 1) {
              throw failure(400, 'Cannot revoke privileges of the last active Super Admin');
            }
          }

          const fbUser = await firebaseAuth.getUser(id).catch(() => null);
          if (fbUser) {
            const claims = { ...(fbUser.customClaims || {}) };
            delete claims.admin;
            delete claims.super_admin;
            claims.role = 'STUDENT';
            await firebaseAuth.setCustomUserClaims(id, claims);
            await firebaseAuth.revokeRefreshTokens(id).catch(() => {});
          }

          await store.update('users', id, { role: 'STUDENT', updatedAt: new Date().toISOString() }).catch(() => {});
          await store.update('customers', id, { role: 'STUDENT' }).catch(() => {});
          await logAudit('ADMIN_ROLE_REVOKED', user, { uid: id }, { revokedRole: roleToRevoke });
          return respond(res, 200, { ok: true, role: 'STUDENT' });
        }

        if (roleToRevoke === 'SELLER') {
          const seller = await store.findSellerByUid(id);
          if (seller) {
            await store.update('sellers', seller.id, { verificationStatus: 'SUSPENDED' });
          }
          await store.update('customers', id, { role: 'STUDENT' }).catch(() => {});
          await logAudit('SELLER_ROLE_REVOKED', user, { uid: id }, { revokedRole: 'SELLER' });
          return respond(res, 200, { ok: true, role: 'STUDENT' });
        }

        throw failure(400, 'Invalid role to revoke');
      }

      // Cancel Invitation
      if (resource === 'invitations' && segments[4] && segments[5] && m === 'DELETE') {
        const invType = segments[4];
        const invId = segments[5];
        if (invType === 'admin' && !isSuperAdmin(user)) {
          throw failure(403, 'Only Super Admins can cancel administrator invitations');
        }
        const collectionName = invType === 'admin' ? 'adminInvitations' : 'sellerInvitations';
        const inv = await store.get(collectionName, invId);
        if (!inv) throw failure(404, 'Invitation not found');
        await store.update(collectionName, invId, { status: 'CANCELLED', cancelledAt: new Date().toISOString(), cancelledBy: user.email });
        await logAudit('INVITATION_CANCELLED', user, { id: invId, type: invType }, { email: inv.email });
        return respond(res, 200, { ok: true });
      }

      // Edit User Details
      if (resource === 'users' && id && !subAction && m === 'PATCH') {
        const updates = {};
        if (data.name) updates.name = String(data.name).trim();
        if (data.phone) updates.phone = String(data.phone).trim();
        if (data.department) updates.departmentOrAffiliation = String(data.department).trim();
        updates.updatedAt = new Date().toISOString();

        if (await store.get('users', id)) {
          await store.update('users', id, updates);
        }
        if (await store.get('customers', id)) {
          await store.update('customers', id, updates);
        }
        if (data.storeName || data.storeDescription) {
          const seller = await store.findSellerByUid(id);
          if (seller) {
            const sUpdates = {};
            if (data.storeName) sUpdates.storeName = String(data.storeName).trim();
            if (data.storeDescription) sUpdates.storeDescription = String(data.storeDescription).trim();
            await store.update('sellers', seller.id, sUpdates);
          }
        }
        await logAudit('USER_DETAILS_UPDATED', user, { uid: id }, updates);
        return respond(res, 200, { ok: true });
      }

      if (resource === 'products' && m === 'POST') {
        if (!isText(data.name, 200) || !Number.isFinite(data.price) || data.price < 0 || !Number.isInteger(data.stock) || data.stock < 0) {
          throw failure(400, 'Invalid product details');
        }
        const item = {
          ...data,
          status: productStatuses.has(data.status) ? data.status : 'PENDING',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        return respond(res, 201, await productRepository.create(item));
      }

      if (resource === 'products' && id) {
        if (m === 'DELETE') {
          const deleted = await productRepository.deleteAdmin(id);
          if (!deleted) throw failure(404, 'Product not found');
          return respond(res, 200, { ok: true });
        }
        if (m === 'PATCH') {
          const permitted = [
            'name',
            'tagline',
            'description',
            'price',
            'originalPrice',
            'category',
            'categorySlug',
            'images',
            'stock',
            'status',
            'isFeatured',
            'isBestSeller',
            'isNewArrival',
            'tags',
            'adminFeedback',
            'sku',
          ];
          const changes = {};
          for (const key of permitted) if (Object.hasOwn(data, key)) changes[key] = data[key];
          if (Object.hasOwn(changes, 'status') && !productStatuses.has(changes.status)) throw failure(400, 'Invalid product status');
          if (Object.hasOwn(changes, 'price') && (!Number.isFinite(changes.price) || changes.price < 0)) throw failure(400, 'Invalid price');
          if (Object.hasOwn(changes, 'stock') && (!Number.isInteger(changes.stock) || changes.stock < 0)) throw failure(400, 'Invalid stock');
          const updated = await productRepository.updateAdmin(id, changes);
          if (!updated) throw failure(404, 'Product not found');
          return respond(res, 200, updated);
        }
      }

      if (resource === 'orders' && id && m === 'PATCH') {
        const updated = await orderRepo.adminUpdate(id, data);
        return respond(res, 200, updated);
      }

      if (resource === 'support' && id && m === 'PATCH') {
        const current = await store.get('tickets', id);
        if (!current) throw failure(404, 'Ticket not found');
        const changes = { updatedAt: new Date().toISOString() };
        if (data.status) {
          if (!['OPEN', 'IN_PROGRESS', 'AWAITING_SELLER_INPUT', 'RESOLVED', 'CLOSED'].includes(data.status)) throw failure(400, 'Invalid status');
          changes.status = data.status;
        }
        if (data.priority) {
          if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(data.priority)) throw failure(400, 'Invalid priority');
          changes.priority = data.priority;
        }
        if (isText(data.note, 4000)) changes.internalAdminNotes = [...(current.internalAdminNotes || []), data.note];
        if (isText(data.reply, 4000)) {
          changes.messages = [
            ...(current.messages || []),
            {
              id: randomUUID(),
              sender: 'ADMIN_SUPPORT',
              senderName: 'JUW Marketplace Support Desk',
              message: data.reply.trim(),
              timestamp: new Date().toISOString(),
            },
          ];
        }
        if (isText(data.resolutionSummary, 2000)) changes.resolutionSummary = data.resolutionSummary.trim();
        return respond(res, 200, await store.update('tickets', id, changes));
      }

      if (resource === 'sellers' && id && m === 'PATCH') {
        if (!['VERIFIED', 'PENDING_VERIFICATION', 'REJECTED', 'SUSPENDED'].includes(data.verificationStatus)) {
          throw failure(400, 'Invalid seller status');
        }
        const updates = { verificationStatus: data.verificationStatus };
        if (typeof data.rejectionReason === 'string') updates.rejectionReason = data.rejectionReason.trim();
        const seller = await store.update('sellers', id, updates);
        if (!seller) throw failure(404, 'Seller not found');
        return respond(res, 200, seller);
      }

      if (resource === 'customers' && id && m === 'PATCH') {
        if (!['ACTIVE', 'INACTIVE', 'FLAGGED'].includes(data.status)) throw failure(400, 'Invalid customer status');
        const item = await store.update('customers', id, { status: data.status });
        if (!item) throw failure(404, 'Customer not found');
        return respond(res, 200, item);
      }

      if (resource === 'reviews' && id && m === 'PATCH') {
        if (!['APPROVED', 'HIDDEN', 'PENDING'].includes(data.status)) throw failure(400, 'Invalid review status');
        const item = await store.update('reviews', id, { status: data.status });
        if (!item) throw failure(404, 'Review not found');
        return respond(res, 200, item);
      }

      if (resource === 'settings' && m === 'PATCH') {
        const current = (await store.get('settings', 'marketplace')) || defaultSettings;
        const updates = {};
        for (const key of ['marketplaceName', 'bannerAnnouncement', 'maintenanceMode', 'enableGuestCheckout', 'campusPickupLocations', 'commissionRate']) {
          if (Object.hasOwn(data, key)) updates[key] = data[key];
        }
        return respond(res, 200, await store.create('settings', { ...current, ...updates }, 'marketplace'));
      }

      // ---------------- ADMIN CATEGORIES MANAGEMENT ----------------
      if (resource === 'categories') {
        // Upload Category Image to Cloudinary
        if (id === 'upload-image' && m === 'POST') {
          if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw failure(503, 'Cloudinary credentials are not configured');
          }
          if (typeof data.image !== 'string' || !/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)) {
            throw failure(400, 'Upload a valid PNG, JPEG, or WebP base64 image');
          }
          const bytes = Buffer.from(data.image.split(',')[1], 'base64');
          if (bytes.length > 2_000_000 || bytes.length < 50) {
            throw failure(413, 'Image size must be under 2 MB');
          }
          const { v2: cloudinary } = await import('cloudinary');
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
          });

          const result = await cloudinary.uploader.upload(data.image, {
            folder: 'juw-marketplace/categories',
            resource_type: 'image',
            overwrite: false,
          });

          return respond(res, 201, { url: result.secure_url, publicId: result.public_id });
        }

        // List all categories (for admin, including active, hidden, archived with real product counts)
        if (!id && m === 'GET') {
          const categories = await getCategoriesWithCounts(true);
          return respond(res, 200, { categories });
        }

        // Reorder categories
        if (id === 'reorder' && m === 'POST') {
          if (!Array.isArray(data.orders)) throw failure(400, 'Orders array required');
          for (const item of data.orders) {
            if (item?.id && Number.isFinite(item?.sortOrder)) {
              await store.update('categories', item.id, { sortOrder: item.sortOrder, updatedAt: new Date().toISOString() });
            }
          }
          await logAudit('CATEGORIES_REORDERED', user, {}, { count: data.orders.length });
          return respond(res, 200, { ok: true, categories: await getCategoriesWithCounts(true) });
        }

        // Create new category
        if (!id && m === 'POST') {
          if (!isText(data.name, 120)) throw failure(400, 'Category name is required (max 120 chars)');
          const rawSlug = data.slug ? String(data.slug) : generateSlug(data.name);
          const slug = generateSlug(rawSlug);
          if (!slug) throw failure(400, 'Valid category slug is required');

          if (await isCategorySlugTaken(slug)) {
            throw failure(409, `Category with slug "${slug}" already exists. Please choose a different slug.`);
          }

          const now = new Date().toISOString();
          const rawStatus = String(data.status || 'active').toLowerCase();
          const status = ['active', 'hidden', 'archived'].includes(rawStatus) ? rawStatus : 'active';
          const sortOrder = Number.isFinite(data.sortOrder) ? Number(data.sortOrder) : ((await store.list('categories')).length + 1);

          const newCategory = {
            name: data.name.trim(),
            slug,
            description: String(data.description || '').trim().slice(0, 1000),
            imageUrl: String(data.imageUrl || data.image || '').trim(),
            imagePublicId: String(data.imagePublicId || '').trim(),
            iconName: String(data.iconName || 'Tag').trim(),
            status,
            isFeatured: Boolean(data.isFeatured ?? data.featured),
            sortOrder,
            departmentTag: String(data.departmentTag || '').trim(),
            createdAt: now,
            updatedAt: now,
            createdBy: user.uid,
          };

          const created = await store.create('categories', newCategory);
          await logAudit('CATEGORY_CREATED', user, { categoryId: created.id, name: created.name }, { slug, status });
          return respond(res, 201, created);
        }

        // Toggle category status (Active / Hidden / Archived)
        if (id && subAction === 'status' && m === 'PATCH') {
          const current = await store.get('categories', id);
          if (!current) throw failure(404, 'Category not found');
          const rawStatus = String(data.status || '').toLowerCase();
          if (!['active', 'hidden', 'archived'].includes(rawStatus)) {
            throw failure(400, 'Invalid status. Must be active, hidden, or archived');
          }
          const updated = await store.update('categories', id, {
            status: rawStatus,
            updatedAt: new Date().toISOString(),
          });
          await logAudit('CATEGORY_STATUS_UPDATED', user, { categoryId: id, name: current.name }, { oldStatus: current.status, newStatus: rawStatus });
          return respond(res, 200, updated);
        }

        // Update category details
        if (id && !subAction && m === 'PATCH') {
          const current = await store.get('categories', id);
          if (!current) throw failure(404, 'Category not found');

          const updates = { updatedAt: new Date().toISOString() };
          if (data.name !== undefined) {
            if (!isText(data.name, 120)) throw failure(400, 'Invalid category name');
            updates.name = data.name.trim();
          }
          if (data.slug !== undefined) {
            const newSlug = generateSlug(data.slug);
            if (!newSlug) throw failure(400, 'Invalid category slug');
            if (await isCategorySlugTaken(newSlug, id)) {
              throw failure(409, `Category with slug "${newSlug}" already exists. Please choose a different slug.`);
            }
            updates.slug = newSlug;
          }
          if (data.description !== undefined) updates.description = String(data.description || '').trim().slice(0, 1000);
          if (data.imageUrl !== undefined || data.image !== undefined) updates.imageUrl = String(data.imageUrl || data.image || '').trim();
          if (data.imagePublicId !== undefined) updates.imagePublicId = String(data.imagePublicId || '').trim();
          if (data.iconName !== undefined) updates.iconName = String(data.iconName || 'Tag').trim();
          if (data.status !== undefined) {
            const rawStatus = String(data.status).toLowerCase();
            if (['active', 'hidden', 'archived'].includes(rawStatus)) updates.status = rawStatus;
          }
          if (data.isFeatured !== undefined || data.featured !== undefined) updates.isFeatured = Boolean(data.isFeatured ?? data.featured);
          if (data.sortOrder !== undefined && Number.isFinite(data.sortOrder)) updates.sortOrder = Number(data.sortOrder);
          if (data.departmentTag !== undefined) updates.departmentTag = String(data.departmentTag || '').trim();

          // Sync product category labels and slugs if name or slug changed
          if (updates.name || updates.slug) {
            const allProducts = await productRepository.getAll();
            for (const prod of allProducts) {
              if (
                prod.categoryId === id ||
                (prod.categorySlug && prod.categorySlug.toLowerCase() === (current.slug || '').toLowerCase()) ||
                (prod.category && prod.category.toLowerCase() === (current.name || '').toLowerCase())
              ) {
                await productRepository.updateAdmin(prod.id, {
                  categoryId: id,
                  category: updates.name || prod.category,
                  categorySlug: updates.slug || prod.categorySlug,
                });
              }
            }
          }

          const updated = await store.update('categories', id, updates);
          await logAudit('CATEGORY_UPDATED', user, { categoryId: id, name: updated.name }, updates);
          return respond(res, 200, updated);
        }

        // Safe Category Deletion Rule
        if (id && m === 'DELETE') {
          const current = await store.get('categories', id);
          if (!current) throw failure(404, 'Category not found');

          const allProducts = await productRepository.getAll();
          const associatedProducts = allProducts.filter(p =>
            p.categoryId === id ||
            (p.categorySlug && p.categorySlug.toLowerCase() === (current.slug || '').toLowerCase()) ||
            (p.category && p.category.toLowerCase() === (current.name || '').toLowerCase())
          );

          const action = data.action || u.searchParams.get('action') || '';
          const targetCategoryId = data.targetCategoryId || u.searchParams.get('targetCategoryId') || '';

          if (associatedProducts.length > 0) {
            if (action === 'archive') {
              const updated = await store.update('categories', id, {
                status: 'archived',
                updatedAt: new Date().toISOString(),
              });
              await logAudit('CATEGORY_ARCHIVED_SAFE', user, { categoryId: id, name: current.name }, { associatedProductCount: associatedProducts.length });
              return respond(res, 200, {
                ok: true,
                archived: true,
                message: `Category "${current.name}" has been safely archived. ${associatedProducts.length} associated products are preserved.`,
              });
            }

            if (action === 'reassign') {
              if (!targetCategoryId || targetCategoryId === id) {
                throw failure(400, 'Valid destination category required for product reassignment');
              }
              const targetCategory = await store.get('categories', targetCategoryId);
              if (!targetCategory) throw failure(404, 'Destination category not found');

              for (const prod of associatedProducts) {
                await productRepository.updateAdmin(prod.id, {
                  categoryId: targetCategory.id,
                  category: targetCategory.name,
                  categorySlug: targetCategory.slug,
                });
              }

              await store.remove('categories', id);
              await logAudit('CATEGORY_DELETED_REASSIGNED', user, { categoryId: id, name: current.name }, { reassignedCount: associatedProducts.length, targetCategoryId });
              return respond(res, 200, {
                ok: true,
                reassignedCount: associatedProducts.length,
                targetCategoryName: targetCategory.name,
                message: `Successfully reassigned ${associatedProducts.length} product(s) to "${targetCategory.name}" and removed category "${current.name}".`,
              });
            }

            // Destructive deletion is blocked
            return respond(res, 400, {
              error: `Cannot delete category "${current.name}". It is currently assigned to ${associatedProducts.length} product(s). Please choose safe archive or reassign products first.`,
              associatedProductCount: associatedProducts.length,
              canArchive: true,
              canReassign: true,
            });
          }

          // No associated products: safe to delete permanently
          await store.remove('categories', id);
          await logAudit('CATEGORY_DELETED', user, { categoryId: id, name: current.name }, {});
          return respond(res, 200, { ok: true, deleted: true, message: `Category "${current.name}" deleted successfully.` });
        }
      }
    }

    routeNotFound();
  } catch (e) {
    if (e?.status) return respond(res, e.status, { error: e.message });
    console.error(e);
    return respond(res, 500, { error: 'Internal server error' });
  }
}

// Start standalone local server when executed directly (not in Netlify / Lambda serverless environment or when imported)
const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const isMain = Boolean(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url));

const port = Number(process.env.PORT || 4000);
const app = http.createServer(handler);

if (isMain && !isServerless && process.env.NODE_ENV !== 'test') {
  await getOrInitApp();
  app.listen(port, () => console.log(`JUW API listening on ${port}; Firebase configured: ${!!firebaseAuth}`));
}

export { app, handler, getOrInitApp, initializeFirebase, ensureDefaultCategories };
