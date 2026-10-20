import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const API_BASE = 'http://localhost:4000';
const FIREBASE_API_KEY = 'AIzaSyDeyozJYeh8DQN-yehy0mihkPtrdQii1UY';

// 1. Initialize Firebase Admin
const cred = cert(JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8')));
const adminApp = initializeApp({ credential: cred }, 'test-runner-' + Date.now());
const auth = getAuth(adminApp);
const db = getFirestore(adminApp);

async function getIdToken(uid, claims = {}) {
  const customToken = await auth.createCustomToken(uid, claims);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!data.idToken) throw new Error('Failed to get ID token: ' + JSON.stringify(data));
  return data.idToken;
}

const results = [];

function record(scenarioNum, name, passed, details) {
  results.push({ scenarioNum, name, passed, details });
  console.log(`[SCENARIO ${scenarioNum}] ${name} -> ${passed ? 'PASSED ✅' : 'FAILED ❌'}`);
  if (details) console.log(`   Details: ${details}`);
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('JUW MARKETPLACE: RUNNING VERIFICATION FOR 13 CATEGORY SCENARIOS');
  console.log('===============================================================\n');

  // Authenticate Admin and Seller
  const adminUid = 'AiBU3zLcpXWPM4osYn2kFnpPt7l2';
  const adminToken = await getIdToken(adminUid, { admin: true });

  // Ensure a test seller exists in Firestore
  let sellers = (await db.collection('sellers').get()).docs.map(d => ({ ...d.data(), id: d.id }));
  let testSeller = sellers.find(s => s.verificationStatus === 'VERIFIED');
  let sellerUid = testSeller?.firebaseUid;

  if (!sellerUid) {
    sellerUid = 'test-seller-' + Date.now();
    const sellerRecord = {
      id: 'sel-test-' + Date.now(),
      firebaseUid: sellerUid,
      studentName: 'Ayesha Test',
      contactEmail: 'ayesha.test@juw.edu.pk',
      department: 'Dept. of Textile Design',
      storeName: 'Ayesha Studio',
      verificationStatus: 'VERIFIED',
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    await db.collection('sellers').doc(sellerRecord.id).set(sellerRecord);
    testSeller = sellerRecord;
  }

  const sellerToken = await getIdToken(sellerUid, {});

  const testSlug = 'botanical-resin-art-' + Date.now();
  let createdCategoryId = null;
  let createdProductId = null;

  // ---------------- SCENARIO 1: Admin adds category ----------------
  try {
    const res = await fetch(`${API_BASE}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Botanical & Resin Craft',
        slug: testSlug,
        description: 'Handcrafted floral resin art created by botanical researchers and fine arts students.',
        departmentTag: 'Dept. of Visual Studies',
        iconName: 'Sparkles',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        status: 'active',
        isFeatured: true,
        sortOrder: 15,
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.id && data.slug === testSlug) {
      createdCategoryId = data.id;
      record(1, 'Admin adds category', true, `Created ID: ${data.id}, Slug: ${data.slug}`);
    } else {
      record(1, 'Admin adds category', false, `Status: ${res.status}, Error: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    record(1, 'Admin adds category', false, err.message);
  }

  // ---------------- SCENARIO 2: Firestore document is created ----------------
  try {
    const docSnap = await db.collection('categories').doc(createdCategoryId).get();
    if (docSnap.exists && docSnap.data().name === 'Botanical & Resin Craft' && docSnap.data().slug === testSlug) {
      record(2, 'Firestore document is created', true, `Verified in Firestore collection "categories" doc ID: ${createdCategoryId}`);
    } else {
      record(2, 'Firestore document is created', false, 'Document does not exist in Firestore');
    }
  } catch (err) {
    record(2, 'Firestore document is created', false, err.message);
  }

  // ---------------- SCENARIO 3: Seller sees category in Add Product ----------------
  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    const data = await res.json();
    const found = data.categories?.find(c => c.id === createdCategoryId || c.slug === testSlug);
    if (res.status === 200 && found && found.status === 'active') {
      record(3, 'Seller sees category in Add Product', true, `Category "${found.name}" found in public/seller category feed with productCount: ${found.productCount}`);
    } else {
      record(3, 'Seller sees category in Add Product', false, 'Category not present in active list');
    }
  } catch (err) {
    record(3, 'Seller sees category in Add Product', false, err.message);
  }

  // ---------------- SCENARIO 4: Seller submits product in category ----------------
  try {
    const res = await fetch(`${API_BASE}/api/seller/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        name: 'Pressed Wildflower Resin Tray',
        tagline: 'Hand-poured crystal tray with real campus bougainvillea',
        categoryId: createdCategoryId,
        category: 'Botanical & Resin Craft',
        categorySlug: testSlug,
        description: 'Artisanal tray made with non-yellowing epoxy resin and dried campus flowers.',
        price: 2200,
        stock: 5,
        images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'],
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.id && data.status === 'PENDING' && data.categoryId === createdCategoryId) {
      createdProductId = data.id;
      record(4, 'Seller submits product in category', true, `Product ID: ${data.id}, Category: ${data.category}, Status: ${data.status}`);
    } else {
      record(4, 'Seller submits product in category', false, `Status: ${res.status}, Error: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    record(4, 'Seller submits product in category', false, err.message);
  }

  // ---------------- SCENARIO 5: Admin approves product ----------------
  try {
    const res = await fetch(`${API_BASE}/api/admin/products/${createdProductId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.status === 'ACTIVE') {
      record(5, 'Admin approves product', true, `Product ${createdProductId} approved, status is now ACTIVE`);
    } else {
      record(5, 'Admin approves product', false, `Status: ${res.status}, Error: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    record(5, 'Admin approves product', false, err.message);
  }

  // ---------------- SCENARIO 6: Customer sees product under correct category ----------------
  try {
    const [catRes, prodRes] = await Promise.all([
      fetch(`${API_BASE}/api/categories/${testSlug}`).then(r => r.json()),
      fetch(`${API_BASE}/api/products/${createdProductId}`).then(r => r.json()),
    ]);
    if (catRes.slug === testSlug && catRes.productCount >= 1 && prodRes.id === createdProductId) {
      record(6, 'Customer sees product under correct category', true, `Category productCount is now ${catRes.productCount}, product public endpoint returns approved item`);
    } else {
      record(6, 'Customer sees product under correct category', false, `Cat productCount: ${catRes.productCount}, Prod: ${prodRes.name}`);
    }
  } catch (err) {
    record(6, 'Customer sees product under correct category', false, err.message);
  }

  // ---------------- SCENARIO 7: Admin edits category ----------------
  const updatedName = 'Botanical & Resin Masterpieces';
  try {
    const res = await fetch(`${API_BASE}/api/admin/categories/${createdCategoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: updatedName,
        description: 'Updated description for university exhibition showcase.',
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.name === updatedName) {
      record(7, 'Admin edits category', true, `Category name updated to "${data.name}"`);
    } else {
      record(7, 'Admin edits category', false, `Status: ${res.status}, Error: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    record(7, 'Admin edits category', false, err.message);
  }

  // ---------------- SCENARIO 8: Updated category appears across all three portals ----------------
  try {
    const [publicCat, adminCatList] = await Promise.all([
      fetch(`${API_BASE}/api/categories/${testSlug}`).then(r => r.json()),
      fetch(`${API_BASE}/api/admin/categories`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json()),
    ]);
    const adminFound = adminCatList.categories?.find(c => c.id === createdCategoryId);
    if (publicCat.name === updatedName && adminFound?.name === updatedName) {
      record(8, 'Updated category appears across all three portals', true, `Public and Admin category APIs both reflect "${updatedName}"`);
    } else {
      record(8, 'Updated category appears across all three portals', false, `Public: ${publicCat.name}, Admin: ${adminFound?.name}`);
    }
  } catch (err) {
    record(8, 'Updated category appears across all three portals', false, err.message);
  }

  // ---------------- SCENARIO 9: Admin hides category ----------------
  try {
    const res = await fetch(`${API_BASE}/api/admin/categories/${createdCategoryId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'hidden' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.status === 'hidden') {
      record(9, 'Admin hides category', true, `Category status updated to hidden`);
    } else {
      record(9, 'Admin hides category', false, `Status: ${res.status}, Error: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    record(9, 'Admin hides category', false, err.message);
  }

  // ---------------- SCENARIO 10: Hidden category disappears from public browsing ----------------
  try {
    const [publicList, publicDetail] = await Promise.all([
      fetch(`${API_BASE}/api/categories`).then(r => r.json()),
      fetch(`${API_BASE}/api/categories/${testSlug}`),
    ]);
    const inPublicList = publicList.categories?.some(c => c.id === createdCategoryId);
    if (!inPublicList && publicDetail.status === 404) {
      record(10, 'Hidden category disappears from public browsing', true, `Category is excluded from /api/categories and /api/categories/${testSlug} returns 404`);
    } else {
      record(10, 'Hidden category disappears from public browsing', false, `In list: ${inPublicList}, Detail status: ${publicDetail.status}`);
    }
  } catch (err) {
    record(10, 'Hidden category disappears from public browsing', false, err.message);
  }

  // ---------------- SCENARIO 11: Duplicate category slugs are rejected ----------------
  try {
    const res = await fetch(`${API_BASE}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Slug Test Category',
        slug: testSlug, // Reusing existing slug
      }),
    });
    const data = await res.json();
    if (res.status === 409) {
      record(11, 'Duplicate category slugs are rejected', true, `Server correctly rejected duplicate slug with HTTP 409 Conflict: "${data.error}"`);
    } else {
      record(11, 'Duplicate category slugs are rejected', false, `Expected 409, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    record(11, 'Duplicate category slugs are rejected', false, err.message);
  }

  // ---------------- SCENARIO 12: Unauthorized users cannot modify categories ----------------
  try {
    const [noAuthRes, sellerAuthRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hacker Category', slug: 'hacker-cat' }),
      }),
      fetch(`${API_BASE}/api/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`, // Non-admin seller token
        },
        body: JSON.stringify({ name: 'Unauthorized Category', slug: 'unauthorized-cat' }),
      }),
    ]);
    if (noAuthRes.status === 401 && sellerAuthRes.status === 403) {
      record(12, 'Unauthorized users cannot modify categories', true, `No-token request returned HTTP 401; Non-admin seller token returned HTTP 403`);
    } else {
      record(12, 'Unauthorized users cannot modify categories', false, `NoAuth: ${noAuthRes.status}, SellerAuth: ${sellerAuthRes.status}`);
    }
  } catch (err) {
    record(12, 'Unauthorized users cannot modify categories', false, err.message);
  }

  // ---------------- SCENARIO 13: Deletion cannot orphan existing products ----------------
  try {
    // Attempt destructive delete on category that has createdProductId assigned
    const attemptDeleteRes = await fetch(`${API_BASE}/api/admin/categories/${createdCategoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteData = await attemptDeleteRes.json();
    const destructiveBlocked = attemptDeleteRes.status === 400 && deleteData.associatedProductCount >= 1;

    // Now reassign to another active category (e.g. cat-art) and complete safe delete
    const reassignRes = await fetch(`${API_BASE}/api/admin/categories/${createdCategoryId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        action: 'reassign',
        targetCategoryId: 'cat-art',
      }),
    });
    const reassignData = await reassignRes.json();

    // Verify product was reassigned and not orphaned
    const updatedProd = (await db.collection('products').doc(createdProductId).get()).data();
    const productPreserved = updatedProd.categoryId === 'cat-art';

    if (destructiveBlocked && reassignRes.status === 200 && productPreserved) {
      record(13, 'Deletion cannot orphan existing products', true, `Destructive delete blocked (HTTP 400, ${deleteData.associatedProductCount} products); Controlled reassignment moved product to cat-art and safely cleaned up category`);
    } else {
      record(13, 'Deletion cannot orphan existing products', false, `Blocked: ${destructiveBlocked}, Reassign status: ${reassignRes.status}, Product preserved: ${productPreserved}`);
    }

    // Clean up test product
    await db.collection('products').doc(createdProductId).delete();
  } catch (err) {
    record(13, 'Deletion cannot orphan existing products', false, err.message);
  }

  console.log('\n===============================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TEST SUMMARY: ${results.filter(r => r.passed).length}/${results.length} SCENARIOS PASSED (${allPassed ? '100% SUCCESS' : 'FAILURES DETECTED'})`);
  console.log('===============================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
