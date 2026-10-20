import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

// Load environment variables from server/.env if not already loaded
const envPath = path.resolve(serverDir, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const targetUid = process.argv[2] || process.env.SUPER_ADMIN_UID || 'AiBU3zLcpXWPM4osYn2kFnpPt7l2';

async function main() {
  console.log('='.repeat(70));
  console.log('JUW Marketplace — Super Admin Provisioning Script');
  console.log('='.repeat(70));
  console.log(`Target User UID: ${targetUid}`);

  // 1. Initialize Firebase Admin SDK
  let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Neither FIREBASE_SERVICE_ACCOUNT_PATH nor GOOGLE_APPLICATION_CREDENTIALS is set.');
  }

  const resolvedServicePath = serviceAccountPath ? path.resolve(serverDir, serviceAccountPath) : null;
  if (resolvedServicePath && !fs.existsSync(resolvedServicePath)) {
    throw new Error(`Firebase service account file not found at: ${resolvedServicePath}`);
  }

  if (getApps().length === 0) {
    const credential = resolvedServicePath
      ? cert(JSON.parse(fs.readFileSync(resolvedServicePath, 'utf8')))
      : applicationDefault();
    initializeApp({ credential });
  }

  const auth = getAuth();
  const db = getFirestore();

  // 2. Step 1: Verify the Firebase Authentication User exists
  console.log('\n[1/5] Verifying user in Firebase Authentication...');
  let userRecord;
  try {
    userRecord = await auth.getUser(targetUid);
    console.log(`  ✓ User found: ${userRecord.email || '(No email)'} (UID: ${userRecord.uid})`);
    console.log(`  ✓ Display Name: ${userRecord.displayName || '(Not set)'}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`\n❌ ERROR: Firebase Authentication user with UID "${targetUid}" does NOT exist.`);
      console.error('Privileges cannot be assigned to a non-existent account.');
      console.error('Please create or verify the account first in Firebase Authentication.');
      process.exit(1);
    }
    throw err;
  }

  // 3. Step 2: Assign Custom Claims (idempotent, preserving existing claims)
  console.log('\n[2/5] Assigning Firebase Custom Claims...');
  const existingClaims = userRecord.customClaims || {};
  const updatedClaims = {
    ...existingClaims,
    admin: true,
    super_admin: true,
    role: 'SUPER_ADMIN',
  };

  await auth.setCustomUserClaims(targetUid, updatedClaims);
  console.log('  ✓ Updated custom claims:', JSON.stringify(updatedClaims, null, 2));

  // 4. Step 3: Create / Update Profile in Firestore `users` collection
  console.log('\n[3/5] Updating Firestore "users" collection document...');
  const now = new Date().toISOString();
  const userDocRef = db.collection('users').doc(targetUid);
  const userSnap = await userDocRef.get();
  const existingUserData = userSnap.exists ? userSnap.data() : {};

  const userProfile = {
    ...existingUserData,
    uid: targetUid,
    id: targetUid,
    email: userRecord.email || existingUserData.email || '',
    name: userRecord.displayName || existingUserData.name || (userRecord.email ? userRecord.email.split('@')[0] : 'JUW Super Admin'),
    role: 'SUPER_ADMIN',
    permissions: ['all', 'admin_access', 'product_approval', 'seller_management', 'order_management', 'settings_management'],
    status: 'ACTIVE',
    roleAssignedAt: now,
    roleAssignedBy: 'local-admin-script',
    customClaims: updatedClaims,
    updatedAt: now,
    createdAt: existingUserData.createdAt || now,
  };

  await userDocRef.set(userProfile, { merge: true });
  console.log(`  ✓ Firestore users/${targetUid} document saved with role SUPER_ADMIN`);

  // 5. Step 4: Ensure `customers` collection document is in sync
  console.log('\n[4/5] Syncing Firestore "customers" collection document...');
  const customerDocRef = db.collection('customers').doc(targetUid);
  const customerSnap = await customerDocRef.get();

  if (customerSnap.exists) {
    await customerDocRef.set({
      role: 'SUPER_ADMIN',
      updatedAt: now,
      lastActive: now,
    }, { merge: true });
    console.log(`  ✓ Updated existing customers/${targetUid} with role SUPER_ADMIN`);
  } else {
    await customerDocRef.set({
      id: targetUid,
      uid: targetUid,
      name: userRecord.displayName || (userRecord.email ? userRecord.email.split('@')[0] : 'JUW Super Admin'),
      email: userRecord.email || '',
      phone: userRecord.phoneNumber || '',
      departmentOrAffiliation: 'JUW Marketplace Administration',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      totalOrders: 0,
      totalSpent: 0,
      joinedDate: now.slice(0, 10),
      lastActive: now,
    }, { merge: true });
    console.log(`  ✓ Created customers/${targetUid} with role SUPER_ADMIN`);
  }

  // 6. Step 5: Verification & Environment Check
  console.log('\n[5/5] Verification & Audit...');
  const verifiedUser = await auth.getUser(targetUid);
  const verifiedUserDoc = await userDocRef.get();
  const verifiedCustomerDoc = await customerDocRef.get();

  const envAdminUids = (process.env.FIREBASE_ADMIN_UIDS || '').split(',').map(x => x.trim());
  const inEnvAllowlist = envAdminUids.includes(targetUid);

  console.log('\n' + '='.repeat(70));
  console.log('PROVISIONING RESULTS AUDIT');
  console.log('='.repeat(70));
  console.log(`UID:                     ${targetUid}`);
  console.log(`Email:                   ${verifiedUser.email}`);
  console.log(`Firebase Custom Claims:  admin=${verifiedUser.customClaims?.admin}, super_admin=${verifiedUser.customClaims?.super_admin}, role=${verifiedUser.customClaims?.role}`);
  console.log(`Firestore "users" Role:  ${verifiedUserDoc.data()?.role}`);
  console.log(`Firestore "customers":   ${verifiedCustomerDoc.data()?.role}`);
  console.log(`Backend FIREBASE_ADMIN_UIDS Allowlist: ${inEnvAllowlist ? 'Configured ✓' : 'Pending in .env'}`);
  console.log('='.repeat(70));
  console.log('\n🎉 SUCCESS: User ' + targetUid + ' is configured as JUW Marketplace Super Admin.');
  console.log('NOTE: If the user is currently signed in, they must sign out and sign in again (or refresh their ID token) for the new custom claims to take effect in the browser.\n');
}

main().catch(err => {
  console.error('\n❌ Provisioning failed:', err);
  process.exit(1);
});
