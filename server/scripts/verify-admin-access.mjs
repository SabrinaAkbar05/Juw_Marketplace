import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

// Load environment variables
const envPath = path.resolve(serverDir, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const serviceAccountPath = path.resolve(serverDir, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))) });

const auth = getAuth();
const db = getFirestore();
const targetUid = 'AiBU3zLcpXWPM4osYn2kFnpPt7l2';
const apiKey = 'AIzaSyDeyozJYeh8DQN-yehy0mihkPtrdQii1UY';

async function runTests() {
  console.log('--- RUNNING SUPER ADMIN INTEGRATION TESTS ---\n');

  // Test 1: Verify Custom Claims
  const user = await auth.getUser(targetUid);
  console.log('TEST 1: Firebase Auth Custom Claims:');
  console.log('  Claims:', user.customClaims);
  const claimsValid = user.customClaims?.admin === true && user.customClaims?.super_admin === true && user.customClaims?.role === 'SUPER_ADMIN';
  console.log(`  Result: ${claimsValid ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // Test 2: Verify Firestore Documents
  const userDoc = await db.collection('users').doc(targetUid).get();
  const customerDoc = await db.collection('customers').doc(targetUid).get();
  console.log('TEST 2: Firestore Profiles:');
  console.log('  users/{uid}.role =', userDoc.data()?.role);
  console.log('  customers/{uid}.role =', customerDoc.data()?.role);
  const firestoreValid = userDoc.data()?.role === 'SUPER_ADMIN' && customerDoc.data()?.role === 'SUPER_ADMIN';
  console.log(`  Result: ${firestoreValid ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // Test 3: Generate ID Token with custom claims and test /api/admin/bootstrap
  console.log('TEST 3: End-to-end Protected Endpoint Authorization:');
  const customToken = await auth.createCustomToken(targetUid);
  const exchangeRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const exchangeData = await exchangeRes.json();
  const idToken = exchangeData.idToken;

  const adminRes = await fetch('http://localhost:4000/api/admin/bootstrap', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  console.log(`  Admin GET /api/admin/bootstrap HTTP Status: ${adminRes.status}`);
  const adminData = await adminRes.json();
  const adminAccessValid = adminRes.status === 200 && Array.isArray(adminData.products) && Array.isArray(adminData.orders);
  console.log(`  Received payload: products=${adminData.products?.length}, orders=${adminData.orders?.length}, settings=${adminData.settings?.marketplaceName}`);
  console.log(`  Result: ${adminAccessValid ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // Test 4: Unauthenticated Request Rejection
  console.log('TEST 4: Unauthenticated Request Access Rejection:');
  const unauthRes = await fetch('http://localhost:4000/api/admin/bootstrap');
  console.log(`  GET /api/admin/bootstrap without token HTTP Status: ${unauthRes.status}`);
  const unauthValid = unauthRes.status === 401;
  console.log(`  Result: ${unauthValid ? 'PASS ✓ (401 Unauthorized)' : 'FAIL ✗'}\n`);

  // Test 5: Non-Admin User Access Rejection (HTTP 403)
  console.log('TEST 5: Non-Admin Customer Access Rejection:');
  // Create a temporary non-admin UID
  const nonAdminUid = 'test-regular-student-' + Date.now();
  const nonAdminCustomToken = await auth.createCustomToken(nonAdminUid, { role: 'STUDENT' });
  const nonAdminExchangeRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: nonAdminCustomToken, returnSecureToken: true }),
  });
  const nonAdminData = await nonAdminExchangeRes.json();
  const nonAdminIdToken = nonAdminData.idToken;

  const forbiddenRes = await fetch('http://localhost:4000/api/admin/bootstrap', {
    headers: { Authorization: `Bearer ${nonAdminIdToken}` },
  });
  console.log(`  GET /api/admin/bootstrap with normal user token HTTP Status: ${forbiddenRes.status}`);
  const forbiddenValid = forbiddenRes.status === 403;
  console.log(`  Result: ${forbiddenValid ? 'PASS ✓ (403 Forbidden)' : 'FAIL ✗'}\n`);

  console.log('--- ALL TESTS COMPLETED ---');
  if (claimsValid && firestoreValid && adminAccessValid && unauthValid && forbiddenValid) {
    console.log('OVERALL STATUS: ALL 5/5 SECURITY & AUTHORIZATION TESTS PASSED! 🎉');
  } else {
    console.error('OVERALL STATUS: ONE OR MORE TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
