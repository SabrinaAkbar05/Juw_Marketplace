import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

// Load environment variables from server/.env and root .env
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq !== -1) {
        const k = trimmed.slice(0, eq).trim();
        let v = trimmed.slice(eq + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}
loadEnv(path.resolve(serverDir, '.env'));
loadEnv(path.resolve(serverDir, '..', '.env'));

const serviceAccountPath = path.resolve(serverDir, process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-service-account.json');
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))) });

const auth = getAuth();
const db = getFirestore();
const superAdminUid = 'AiBU3zLcpXWPM4osYn2kFnpPt7l2';
const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY;
if (!apiKey) {
  throw new Error('Missing Firebase Web API Key. Please define VITE_FIREBASE_API_KEY or FIREBASE_API_KEY in your .env or environment.');
}
const baseUrl = 'http://localhost:4000';

async function getIdToken(uid, customClaims = null) {
  const customToken = await auth.createCustomToken(uid, customClaims || undefined);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!data.idToken) {
    throw new Error('Failed to exchange custom token: ' + JSON.stringify(data));
  }
  return data.idToken;
}

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS [Scenario ${totalCount}]: ${message}`);
  } else {
    console.error(`  ✗ FAIL [Scenario ${totalCount}]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('JUW Marketplace — Complete 14-Scenario User Management Test Suite');
  console.log('===============================================================\n');

  // Super Admin token
  const superAdminToken = await getIdToken(superAdminUid);

  // SCENARIO 1: Super Admin Authorization & Expanded Bootstrap Payload
  console.log('Scenario 1: Testing Super Admin Bootstrap with User Management Data...');
  const bootRes = await fetch(`${baseUrl}/api/admin/bootstrap`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  const bootData = await bootRes.json();
  assert(
    bootRes.status === 200 &&
    Array.isArray(bootData.users) &&
    Array.isArray(bootData.adminInvitations) &&
    Array.isArray(bootData.sellerInvitations) &&
    Array.isArray(bootData.auditLogs) &&
    bootData.currentUser?.isSuperAdmin === true,
    'Bootstrap returns users, invitations, audit logs, and identifies currentUser as Super Admin'
  );

  // SCENARIO 2: Search Users across roles
  console.log('Scenario 2: Testing User Search across roles (customers, sellers, admins)...');
  const searchRes = await fetch(`${baseUrl}/api/admin/users/search?q=faiza`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  const searchData = await searchRes.json();
  assert(
    searchRes.status === 200 &&
    Array.isArray(searchData.results) &&
    searchData.results.some((u) => u.uid === superAdminUid),
    'User search returns matching user record with accurate role information'
  );

  // SCENARIO 3: Add Seller via Invitation (expires in 7 days, logs audit)
  console.log('Scenario 3: Testing Add Seller via Invitation...');
  const testSellerEmail = `test.seller.${Date.now()}@juw.edu.pk`;
  const addSellerRes = await fetch(`${baseUrl}/api/admin/sellers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      onboardingMethod: 'INVITE',
      fullName: 'Amina Tariq',
      email: testSellerEmail,
      studentRollNumber: '2023/JUW/CS/101',
      department: 'Department of Computer Science & IT',
      semester: '4th Semester',
      phone: '+92 300 1122334',
      storeName: 'Amina Digital Crafts',
      storeDescription: 'Handmade digital illustrations and prints',
      verificationStatus: 'VERIFIED',
    }),
  });
  const addSellerData = await addSellerRes.json();
  assert(
    addSellerRes.status === 201 &&
    addSellerData.invitation?.token &&
    addSellerData.invitation.email === testSellerEmail &&
    addSellerData.invitation.status === 'PENDING',
    'Seller invitation created with valid token and PENDING status'
  );
  const sellerInviteToken = addSellerData.invitation.token;
  const sellerInviteId = addSellerData.invitation.id;

  // Check Firestore sellerInvitations
  const sellerInvDoc = await db.collection('sellerInvitations').doc(sellerInviteId).get();
  assert(sellerInvDoc.exists && sellerInvDoc.data()?.email === testSellerEmail, 'Seller invitation persisted in Firestore');

  // SCENARIO 4: Public Invitation Verification
  console.log('Scenario 4: Testing Public Invitation Verification Endpoint...');
  const verifyRes = await fetch(`${baseUrl}/api/invitations/verify?token=${sellerInviteToken}`);
  const verifyData = await verifyRes.json();
  assert(
    verifyRes.status === 200 &&
    verifyData.ok === true &&
    verifyData.invitation?.type === 'SELLER_INVITATION' &&
    verifyData.invitation?.email === testSellerEmail,
    'Public verification endpoint returns valid invitation metadata without requiring authentication'
  );

  // SCENARIO 5: Public Invitation Acceptance
  console.log('Scenario 5: Testing Public Invitation Acceptance & Seller Registration...');
  const acceptRes = await fetch(`${baseUrl}/api/invitations/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: sellerInviteToken,
      name: 'Amina Tariq',
      password: 'StrongPassword123!',
    }),
  });
  const acceptData = await acceptRes.json();
  assert(
    acceptRes.status === 200 &&
    acceptData.ok === true &&
    acceptData.role === 'SELLER',
    'Invitation accepted successfully, user created and registered as SELLER'
  );

  // Assert seller record created in Firestore
  const createdSellerSnapshot = await db.collection('sellers').where('contactEmail', '==', testSellerEmail).get();
  assert(!createdSellerSnapshot.empty, 'Seller document registered in Firestore sellers collection upon invitation acceptance');

  // SCENARIO 6: Add Seller from Existing Firebase Account
  console.log('Scenario 6: Testing Add Seller from Existing Firebase Account...');
  const existingSellerUid = 'test-seller-existing-' + Date.now();
  const existingSellerEmail = `existing.seller.${Date.now()}@juw.edu.pk`;
  await auth.createUser({
    uid: existingSellerUid,
    email: existingSellerEmail,
    displayName: 'Hafsa Farooq',
    password: 'Password123!',
  });
  // Add as customer first
  await db.collection('customers').doc(existingSellerUid).set({
    id: existingSellerUid,
    name: 'Hafsa Farooq',
    email: existingSellerEmail,
    role: 'STUDENT',
    status: 'ACTIVE',
    totalOrders: 0,
    totalSpent: 0,
    departmentOrAffiliation: 'Software Engineering',
    joinedDate: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  });

  const addExistingSellerRes = await fetch(`${baseUrl}/api/admin/sellers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      onboardingMethod: 'EXISTING_USER',
      existingUid: existingSellerUid,
      fullName: 'Hafsa Farooq',
      email: existingSellerEmail,
      studentRollNumber: '2022/JUW/SE/055',
      department: 'Department of Software Engineering',
      semester: '6th Semester',
      phone: '+92 312 9988776',
      storeName: 'Hafsa Code & Prints',
      storeDescription: 'Programming notebooks and stationery',
      verificationStatus: 'VERIFIED',
    }),
  });
  const addExistingSellerData = await addExistingSellerRes.json();
  assert(
    addExistingSellerRes.status === 201 &&
    addExistingSellerData.seller?.firebaseUid === existingSellerUid,
    'Existing user directly onboarded as seller without invitation flow'
  );

  // SCENARIO 7: Add Administrator via Invitation (Super Admin Only)
  console.log('Scenario 7: Testing Add Administrator via Invitation (Super Admin)...');
  const testAdminEmail = `invited.admin.${Date.now()}@juw.edu.pk`;
  const addAdminRes = await fetch(`${baseUrl}/api/admin/administrators`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      onboardingMethod: 'INVITE',
      fullName: 'Professor Nida Khan',
      email: testAdminEmail,
      role: 'ADMIN',
      permissions: ['products', 'orders', 'support'],
    }),
  });
  const addAdminData = await addAdminRes.json();
  assert(
    addAdminRes.status === 201 &&
    addAdminData.invitation?.token &&
    addAdminData.invitation.role === 'ADMIN',
    'Administrator invitation created with granular permissions'
  );
  const adminInviteId = addAdminData.invitation.id;

  // SCENARIO 8: Non-Super Admin Cannot Appoint Administrators (HTTP 403)
  console.log('Scenario 8: Testing Non-Super Admin Cannot Appoint Administrators (Least Privilege)...');
  // Create a regular admin user
  const regularAdminUid = 'test-reg-admin-' + Date.now();
  await auth.createUser({
    uid: regularAdminUid,
    email: `reg.admin.${Date.now()}@juw.edu.pk`,
    displayName: 'Regular Admin',
  });
  await auth.setCustomUserClaims(regularAdminUid, { admin: true, super_admin: false, role: 'ADMIN' });
  const regularAdminToken = await getIdToken(regularAdminUid, { admin: true, super_admin: false, role: 'ADMIN' });

  const forbiddenAdminRes = await fetch(`${baseUrl}/api/admin/administrators`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regularAdminToken}`,
    },
    body: JSON.stringify({
      onboardingMethod: 'INVITE',
      fullName: 'Intruder User',
      email: 'intruder@juw.edu.pk',
      role: 'ADMIN',
      permissions: ['all'],
    }),
  });
  assert(
    forbiddenAdminRes.status === 403,
    'Non-Super Admin receives HTTP 403 when attempting to appoint administrators'
  );

  // SCENARIO 9: Add Administrator from Existing Firebase Account (Super Admin)
  console.log('Scenario 9: Testing Add Administrator from Existing Account (Assign Claims & Firestore)...');
  const existingAdminUid = 'test-existing-admin-' + Date.now();
  const existingAdminEmail = `existing.admin.${Date.now()}@juw.edu.pk`;
  await auth.createUser({
    uid: existingAdminUid,
    email: existingAdminEmail,
    displayName: 'Dr. Rabia Zafar',
  });

  const assignAdminRes = await fetch(`${baseUrl}/api/admin/administrators`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      onboardingMethod: 'EXISTING_USER',
      existingUid: existingAdminUid,
      fullName: 'Dr. Rabia Zafar',
      email: existingAdminEmail,
      role: 'ADMIN',
      permissions: ['products', 'orders', 'support', 'sellers', 'customers'],
    }),
  });
  assert(assignAdminRes.status === 201, 'Super Admin assigns administrator role to existing account');

  const fbAdminUser = await auth.getUser(existingAdminUid);
  assert(
    fbAdminUser.customClaims?.admin === true && fbAdminUser.customClaims?.role === 'ADMIN',
    'Custom claims (admin: true, role: ADMIN) set on Firebase Authentication user'
  );

  // SCENARIO 10: Change User Status to SUSPENDED
  console.log('Scenario 10: Testing User Status Change to SUSPENDED & Token Revocation...');
  const suspendRes = await fetch(`${baseUrl}/api/admin/users/${existingAdminUid}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      status: 'SUSPENDED',
      reason: 'Temporary investigation of activity',
    }),
  });
  assert(suspendRes.status === 200, 'User status successfully updated to SUSPENDED');

  const suspendedUserDoc = await db.collection('users').doc(existingAdminUid).get();
  assert(suspendedUserDoc.data()?.status === 'SUSPENDED', 'Firestore user document reflects SUSPENDED status');

  // SCENARIO 11: Suspended User Access Blocked (HTTP 403)
  console.log('Scenario 11: Testing Suspended User Blocked from Backend Endpoints (HTTP 403)...');
  const suspendedToken = await getIdToken(existingAdminUid, { admin: true, role: 'ADMIN' });
  const suspendedAccessRes = await fetch(`${baseUrl}/api/admin/bootstrap`, {
    headers: { Authorization: `Bearer ${suspendedToken}` },
  });
  assert(
    suspendedAccessRes.status === 403,
    'Suspended user receives HTTP 403 Forbidden even with valid token'
  );

  // SCENARIO 12: Reactivate Suspended Account
  console.log('Scenario 12: Testing Reactivating Suspended Account (Status to ACTIVE)...');
  const reactivateRes = await fetch(`${baseUrl}/api/admin/users/${existingAdminUid}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  assert(reactivateRes.status === 200, 'User successfully restored to ACTIVE status');

  // SCENARIO 13: Protection of Last Active Super Admin
  console.log('Scenario 13: Testing Protection of Last Active Super Admin (Cannot Suspend/Demote)...');
  const protectSuspendRes = await fetch(`${baseUrl}/api/admin/users/${superAdminUid}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({ status: 'SUSPENDED' }),
  });
  assert(
    protectSuspendRes.status === 400,
    'System rejects suspending the only active Super Admin (HTTP 400 Prevented)'
  );

  const protectRevokeRes = await fetch(`${baseUrl}/api/admin/users/${superAdminUid}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({ role: 'SUPER_ADMIN' }),
  });
  assert(
    protectRevokeRes.status === 400,
    'System rejects revoking privileges of the last active Super Admin (HTTP 400 Prevented)'
  );

  // SCENARIO 14: Revoke Administrative Role & Cancel Invitation with Audit Trail
  console.log('Scenario 14: Testing Role Revocation, Invitation Cancellation & Audit Logging...');
  const revokeRes = await fetch(`${baseUrl}/api/admin/users/${existingAdminUid}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({ role: 'ADMIN' }),
  });
  assert(revokeRes.status === 200, 'Administrator role revoked successfully');

  const revokedClaims = (await auth.getUser(existingAdminUid)).customClaims || {};
  assert(!revokedClaims.admin && revokedClaims.role === 'STUDENT', 'Firebase custom claims stripped and reverted to STUDENT');

  const cancelInvRes = await fetch(`${baseUrl}/api/admin/invitations/admin/${adminInviteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert(cancelInvRes.status === 200, 'Administrator invitation cancelled successfully');

  // Verify Audit Trail has entries
  const auditLogsSnapshot = await db.collection('auditLogs').get();
  assert(
    auditLogsSnapshot.size >= 5,
    `Audit trail logged ${auditLogsSnapshot.size} administrative security events in Firestore`
  );

  // Clean up temporary test users created during test suite
  await auth.deleteUser(existingSellerUid).catch(() => {});
  await auth.deleteUser(regularAdminUid).catch(() => {});
  await auth.deleteUser(existingAdminUid).catch(() => {});

  console.log('\n===============================================================');
  console.log(`ALL TESTS PASSED: ${passedCount} / ${totalCount} SCENARIOS VERIFIED ✓`);
  console.log('===============================================================\n');
}

runAllTests().catch((err) => {
  console.error('\nTest execution failed:', err);
  process.exit(1);
});
