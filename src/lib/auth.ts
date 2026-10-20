import { api, json } from './api';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  departmentOrAffiliation?: string;
  role: 'STUDENT' | 'FACULTY' | 'GUEST' | 'ALUMNA' | 'SUPER_ADMIN' | 'ADMIN';
}

const TOKEN_KEY = 'juw_firebase_token';
const REFRESH_KEY = 'juw_firebase_refresh_token';
const USER_KEY = 'juw_user_profile';

export function getFirebaseApiKey(): string {
  const key = (import.meta as ImportMeta & { env?: { VITE_FIREBASE_API_KEY?: string } }).env?.VITE_FIREBASE_API_KEY;
  if (!key) {
    throw new Error('VITE_FIREBASE_API_KEY is not configured in .env');
  }
  return key;
}

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function adminToken(): string {
  return getStoredToken();
}

export function saveAuthSession(idToken: string, refreshToken?: string, user?: AuthUser) {
  localStorage.setItem(TOKEN_KEY, idToken);
  sessionStorage.setItem(TOKEN_KEY, idToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function refreshIdToken(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) throw new Error('No refresh token available');
  const key = getFirebaseApiKey();

  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    clearAuthSession();
    throw new Error(data.error?.message || 'Failed to refresh token');
  }

  saveAuthSession(data.id_token, data.refresh_token);
  return data.id_token as string;
}

export async function ensureValidToken(): Promise<string> {
  const token = getStoredToken();
  if (!token) return '';
  return token;
}

export async function firebasePasswordLogin(email: string, password: string): Promise<string> {
  const key = getFirebaseApiKey();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    const msg = data.error?.message || 'Sign-in failed';
    if (msg.includes('EMAIL_NOT_FOUND') || msg.includes('INVALID_PASSWORD') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
      throw new Error('Incorrect email or password. Please verify your credentials.');
    }
    if (msg.includes('USER_DISABLED')) {
      throw new Error('This account has been disabled by an administrator.');
    }
    throw new Error(msg);
  }

  saveAuthSession(data.idToken, data.refreshToken, {
    uid: data.localId,
    email: data.email,
    name: data.displayName || data.email?.split('@')[0] || 'JUW Member',
    role: 'STUDENT',
  });

  return data.idToken as string;
}

export async function firebaseRegister(params: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  department?: string;
  role?: string;
}): Promise<{ idToken: string; user: AuthUser }> {
  // First register user on backend to establish both Firebase user and Firestore customer document
  await api('/api/auth/register', json('POST', params));

  // Then obtain the client ID token through password login
  const idToken = await firebasePasswordLogin(params.email, params.password);

  // Fetch full profile from backend
  const me = await fetchCurrentUserProfile(idToken);
  const user: AuthUser = {
    uid: me.customer.uid || me.customer.id,
    email: me.customer.email,
    name: me.customer.name,
    phone: me.customer.phone,
    departmentOrAffiliation: me.customer.departmentOrAffiliation,
    role: me.customer.role || 'STUDENT',
  };

  saveAuthSession(idToken, undefined, user);
  return { idToken, user };
}

export async function firebasePasswordReset(email: string): Promise<void> {
  try {
    const key = getFirebaseApiKey();
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send password reset email');
    }
  } catch {
    // Fallback to backend admin reset link generator
    await api('/api/auth/reset-password', json('POST', { email }));
  }
}

export async function firebaseSendEmailVerification(): Promise<void> {
  const token = getStoredToken();
  if (!token) throw new Error('You must be signed in to request email verification');
  const key = getFirebaseApiKey();
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken: token }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send verification email');
  }
}

export async function fetchCurrentUserProfile(token?: string) {
  const t = token || getStoredToken();
  if (!t) throw new Error('Not authenticated');
  return api<{
    customer: {
      id: string;
      uid: string;
      name: string;
      email: string;
      phone: string;
      departmentOrAffiliation: string;
      role: 'STUDENT' | 'FACULTY' | 'GUEST' | 'ALUMNA' | 'SUPER_ADMIN' | 'ADMIN';
      status: string;
      totalOrders: number;
      totalSpent: number;
    };
    seller: {
      id: string;
      studentName: string;
      studentRollNumber: string;
      department: string;
      verificationStatus: string;
    } | null;
    isAdmin: boolean;
  }>('/api/auth/me', {
    headers: { Authorization: `Bearer ${t}` },
  });
}
