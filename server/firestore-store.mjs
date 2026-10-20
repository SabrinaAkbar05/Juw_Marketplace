export function createStore(db) {
  const col = name => db.collection(name);
  const unpack = snap => ({ ...snap.data(), id: snap.id });
  const list = async name => (await col(name).get()).docs.map(unpack);
  const get = async (name, id) => {
    const s = await col(name).doc(id).get();
    return s.exists ? unpack(s) : null;
  };
  const create = async (name, data, id) => {
    const ref = id ? col(name).doc(id) : col(name).doc();
    const value = { ...data, id: ref.id };
    await ref.set(value);
    return value;
  };
  const update = async (name, id, changes) => {
    const ref = col(name).doc(id);
    return db.runTransaction(async tx => {
      const s = await tx.get(ref);
      if (!s.exists) return null;
      const result = { ...s.data(), ...changes, id };
      tx.set(ref, result);
      return result;
    });
  };
  const remove = async (name, id) => {
    const ref = col(name).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
  };
  const findSellerByUid = async uid => {
    const snap = await col('sellers').where('firebaseUid', '==', uid).limit(1).get();
    return snap.empty ? null : unpack(snap.docs[0]);
  };
  const findCustomerByUid = async uid => {
    const snap = await col('customers').doc(uid).get();
    if (snap.exists) return unpack(snap);
    const q = await col('customers').where('uid', '==', uid).limit(1).get();
    return q.empty ? null : unpack(q.docs[0]);
  };
  const findUserByUid = async uid => {
    const snap = await col('users').doc(uid).get();
    if (snap.exists) return unpack(snap);
    const q = await col('users').where('uid', '==', uid).limit(1).get();
    return q.empty ? null : unpack(q.docs[0]);
  };

  return { list, get, create, update, remove, findSellerByUid, findCustomerByUid, findUserByUid };
}
