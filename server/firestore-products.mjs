// Firestore is the source of truth for product records.
export function createProductRepository(firestore) {
  const collection = firestore.collection('products');
  const unpack = snapshot => ({ ...snapshot.data(), id: snapshot.id });
  
  // Public catalog includes active and out-of-stock items so users can view details/availability
  const publicProduct = p => (p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK');
  
  // Strip private contact info and moderation details before serving to customers
  const toPublic = p => {
    const { adminFeedback, firebaseUid, contactEmail, contactPhone, studentRollNumber, ...safe } = p;
    return safe;
  };

  async function getAll() {
    const snapshot = await collection.get();
    return snapshot.docs.map(unpack);
  }

  async function getCatalog() {
    const products = (await getAll()).filter(publicProduct).map(toPublic);
    return { products };
  }

  async function getPublicProductById(id) {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return null;
    const p = unpack(doc);
    return publicProduct(p) ? toPublic(p) : null;
  }

  async function getOwned(sellerId) {
    const snapshot = await collection.where('sellerId', '==', sellerId).get();
    return snapshot.docs.map(unpack);
  }

  async function create(data) {
    const ref = collection.doc();
    const product = { ...data, id: ref.id };
    await ref.set(product);
    return product;
  }

  async function updateOwned(id, sellerId, changes) {
    const ref = collection.doc(id);
    return firestore.runTransaction(async transaction => {
      const snap = await transaction.get(ref);
      if (!snap.exists || snap.data().sellerId !== sellerId) return null;
      const current = snap.data();

      // Check if sensitive fields were changed
      const sensitiveKeys = ['name', 'description', 'price', 'category', 'categorySlug', 'images'];
      const hasSensitiveChanges = sensitiveKeys.some(
        key => Object.hasOwn(changes, key) && JSON.stringify(changes[key]) !== JSON.stringify(current[key])
      );

      let newStatus = current.status;
      let adminFeedback = current.adminFeedback || '';

      if (hasSensitiveChanges) {
        // Sensitive edit requires renewed admin moderation
        newStatus = 'PENDING';
        adminFeedback = '';
      } else if (Object.hasOwn(changes, 'stock')) {
        // Stock only adjustment retains live status
        if (current.status === 'ACTIVE' || current.status === 'OUT_OF_STOCK') {
          newStatus = changes.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
        }
      }

      const updated = {
        ...current,
        ...changes,
        status: newStatus,
        adminFeedback,
        id,
        updatedAt: new Date().toISOString(),
      };

      transaction.set(ref, updated);
      return updated;
    });
  }

  async function updateAdmin(id, changes) {
    const ref = collection.doc(id);
    return firestore.runTransaction(async transaction => {
      const snap = await transaction.get(ref);
      if (!snap.exists) return null;
      const updated = { ...snap.data(), ...changes, id, updatedAt: new Date().toISOString() };
      transaction.set(ref, updated);
      return updated;
    });
  }

  async function deleteAdmin(id) {
    const ref = collection.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
  }

  return { getAll, getCatalog, getPublicProductById, getOwned, create, updateOwned, updateAdmin, deleteAdmin };
}
