import { randomUUID } from 'node:crypto';

export function createOrders(db) {
  const allowedTransitions = new Set([
    'PLACED',
    'PAYMENT_CONFIRMED',
    'PROCESSING',
    'READY',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'RETURNED',
    'DISPUTED',
  ]);

  const itemFulfillmentStatuses = new Set([
    'PENDING',
    'PROCESSING',
    'READY',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED',
  ]);

  const create = async (data, uid) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const requested = data.items;

    if (!Array.isArray(requested) || requested.length < 1 || requested.length > 40) {
      throw Object.assign(new Error('Invalid cart: must contain 1 to 40 items'), { status: 400 });
    }
    if (!['CAMPUS_PICKUP', 'STANDARD_DELIVERY'].includes(data.deliveryType)) {
      throw Object.assign(new Error('Invalid delivery type: choose CAMPUS_PICKUP or STANDARD_DELIVERY'), { status: 400 });
    }
    if (!['COD'].includes(data.paymentMethod)) {
      throw Object.assign(new Error('Only cash on delivery/pickup is currently supported'), { status: 400 });
    }
    if (data.deliveryType === 'STANDARD_DELIVERY' && (!data.shippingAddress?.street || !data.shippingAddress?.city)) {
      throw Object.assign(new Error('Street address and city required for delivery'), { status: 400 });
    }
    if (!data.customerName?.trim() || !data.customerEmail?.trim() || !data.customerPhone?.trim()) {
      throw Object.assign(new Error('Customer name, valid email, and contact phone are required'), { status: 400 });
    }

    const idempotencyKey = (typeof data.idempotencyKey === 'string' && data.idempotencyKey.trim()) ? data.idempotencyKey.trim() : null;
    if (idempotencyKey) {
      const existingSnap = await db.collection('orders').where('idempotencyKey', '==', idempotencyKey).limit(1).get();
      if (!existingSnap.empty) {
        const existing = existingSnap.docs[0].data();
        return { ...existing, id: existingSnap.docs[0].id };
      }
    }

    const quantities = new Map();
    for (const line of requested) {
      const qty = Number(line.quantity);
      if (typeof line.productId !== 'string' || !Number.isInteger(qty) || qty < 1 || qty > 50) {
        throw Object.assign(new Error('Invalid item quantity'), { status: 400 });
      }
      quantities.set(line.productId, (quantities.get(line.productId) || 0) + qty);
    }
    if (quantities.size > 40 || [...quantities.values()].some(n => n > 50)) {
      throw Object.assign(new Error('Cart quantity exceeds maximum allowed limits'), { status: 400 });
    }

    const orderRef = db.collection('orders').doc(id);

    return db.runTransaction(async tx => {
      const refs = [...quantities.keys()].sort().map(k => db.collection('products').doc(k));
      const snapshots = await Promise.all(refs.map(ref => tx.get(ref)));
      const items = [];
      let subtotal = 0;

      for (let i = 0; i < refs.length; i++) {
        const snap = snapshots[i];
        if (!snap.exists) {
          throw Object.assign(new Error(`Product ${refs[i].id} not found`), { status: 404 });
        }
        const p = snap.data();
        const qty = quantities.get(refs[i].id);

        if (!p || (p.status !== 'ACTIVE' && p.status !== 'OUT_OF_STOCK') || !Number.isInteger(p.stock) || p.stock < qty || !Number.isFinite(p.price) || p.price <= 0) {
          throw Object.assign(new Error(`Product "${p?.name || refs[i].id}" has insufficient stock or is unavailable`), { status: 409 });
        }

        items.push({
          productId: refs[i].id,
          sellerId: p.sellerId || null,
          name: p.name,
          price: p.price,
          quantity: qty,
          image: p.images?.[0] || '',
          category: p.category || '',
          fulfillmentStatus: 'PENDING',
        });
        subtotal += p.price * qty;
      }

      const deliveryFee = data.deliveryType === 'STANDARD_DELIVERY' ? 200 : 0;
      const order = {
        id,
        orderNumber: 'JUW-' + id.slice(0, 8).toUpperCase(),
        customerUid: uid || null,
        customerName: data.customerName.trim(),
        customerEmail: data.customerEmail.trim().toLowerCase(),
        customerPhone: data.customerPhone.trim(),
        deliveryType: data.deliveryType,
        pickupLocation: data.deliveryType === 'CAMPUS_PICKUP' ? (data.pickupLocation || 'JUW Main Campus - Incubation Hub Counter (Block C)') : null,
        shippingAddress: data.deliveryType === 'STANDARD_DELIVERY' ? data.shippingAddress : null,
        items,
        subtotal,
        deliveryFee,
        discount: 0,
        total: subtotal + deliveryFee,
        status: 'PLACED',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        createdAt: now,
        estimatedDelivery: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
        statusHistory: [{ status: 'PLACED', timestamp: now, note: 'Order placed by customer' }],
        trackingNumber: 'JUW-TRK-' + id.slice(0, 8).toUpperCase(),
        idempotencyKey,
      };

      for (let i = 0; i < refs.length; i++) {
        const p = snapshots[i].data();
        const remaining = p.stock - quantities.get(refs[i].id);
        tx.update(refs[i], {
          stock: remaining,
          status: remaining === 0 ? 'OUT_OF_STOCK' : p.status,
        });
      }

      tx.create(orderRef, order);
      return order;
    });
  };

  const cancel = async (orderId, userUid, isAdmin = false, reason = '') => {
    const orderRef = db.collection('orders').doc(orderId);
    return db.runTransaction(async tx => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) {
        throw Object.assign(new Error('Order not found'), { status: 404 });
      }
      const order = snap.data();

      if (!isAdmin && order.customerUid && order.customerUid !== userUid) {
        throw Object.assign(new Error('Unauthorized: cannot cancel an order belonging to another customer'), { status: 403 });
      }

      if (order.status === 'CANCELLED') {
        throw Object.assign(new Error('Order is already cancelled'), { status: 400 });
      }

      if (!isAdmin && !['PLACED', 'PAYMENT_CONFIRMED', 'PROCESSING'].includes(order.status)) {
        throw Object.assign(new Error(`Order cannot be cancelled in "${order.status}" status`), { status: 400 });
      }

      const itemQuantities = new Map();
      for (const line of order.items || []) {
        if (line.productId) {
          itemQuantities.set(line.productId, (itemQuantities.get(line.productId) || 0) + (line.quantity || 1));
        }
      }

      const productRefs = [...itemQuantities.keys()].sort().map(k => db.collection('products').doc(k));
      const productSnaps = await Promise.all(productRefs.map(ref => tx.get(ref)));

      for (let i = 0; i < productRefs.length; i++) {
        const pSnap = productSnaps[i];
        if (pSnap.exists) {
          const p = pSnap.data();
          const restoreQty = itemQuantities.get(productRefs[i].id);
          const newStock = (Number.isInteger(p.stock) ? p.stock : 0) + restoreQty;
          const newStatus = p.status === 'OUT_OF_STOCK' && newStock > 0 ? 'ACTIVE' : p.status;
          tx.update(productRefs[i], { stock: newStock, status: newStatus });
        }
      }

      const now = new Date().toISOString();
      const updatedHistory = [
        ...(order.statusHistory || []),
        {
          status: 'CANCELLED',
          timestamp: now,
          note: reason || (isAdmin ? 'Cancelled by JUW Administrator' : 'Cancelled by customer'),
        },
      ];

      const updated = {
        ...order,
        status: 'CANCELLED',
        cancelledAt: now,
        statusHistory: updatedHistory,
      };

      tx.update(orderRef, updated);
      return { ...updated, id: orderId };
    });
  };

  const updateItemFulfillment = async (orderId, sellerId, productId, newStatus, note = '') => {
    if (!itemFulfillmentStatuses.has(newStatus)) {
      throw Object.assign(new Error('Invalid item fulfillment status'), { status: 400 });
    }

    const orderRef = db.collection('orders').doc(orderId);
    return db.runTransaction(async tx => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) {
        throw Object.assign(new Error('Order not found'), { status: 404 });
      }
      const order = snap.data();

      let hasSellerItems = false;
      const updatedItems = (order.items || []).map(item => {
        if (item.sellerId === sellerId && (!productId || item.productId === productId)) {
          hasSellerItems = true;
          return { ...item, fulfillmentStatus: newStatus };
        }
        return item;
      });

      if (!hasSellerItems) {
        throw Object.assign(new Error('No matching items belonging to this seller in order'), { status: 403 });
      }

      // Recalculate parent order status based on component items
      const allStatuses = updatedItems.map(i => i.fulfillmentStatus || 'PENDING');
      let parentStatus = order.status;

      if (order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
        if (allStatuses.every(s => s === 'DELIVERED')) {
          parentStatus = 'DELIVERED';
        } else if (allStatuses.every(s => s === 'READY' || s === 'DISPATCHED' || s === 'DELIVERED')) {
          parentStatus = 'READY';
        } else if (allStatuses.some(s => s === 'PROCESSING' || s === 'READY' || s === 'DISPATCHED')) {
          parentStatus = 'PROCESSING';
        }
      }

      const now = new Date().toISOString();
      const statusHistory = [...(order.statusHistory || [])];
      if (parentStatus !== order.status) {
        statusHistory.push({
          status: parentStatus,
          timestamp: now,
          note: note || `Order updated to ${parentStatus} based on seller fulfillment`,
        });
      } else if (note) {
        statusHistory.push({
          status: parentStatus,
          timestamp: now,
          note: `Seller update: ${note}`,
        });
      }

      const updated = {
        ...order,
        items: updatedItems,
        status: parentStatus,
        statusHistory,
        updatedAt: now,
      };

      tx.update(orderRef, updated);
      return { ...updated, id: orderId };
    });
  };

  const adminUpdate = async (orderId, data) => {
    const orderRef = db.collection('orders').doc(orderId);
    return db.runTransaction(async tx => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) {
        throw Object.assign(new Error('Order not found'), { status: 404 });
      }
      const current = snap.data();

      if (data.status === 'CANCELLED' && current.status !== 'CANCELLED') {
        // Stock restoration
        const itemQuantities = new Map();
        for (const line of current.items || []) {
          if (line.productId) {
            itemQuantities.set(line.productId, (itemQuantities.get(line.productId) || 0) + (line.quantity || 1));
          }
        }
        const productRefs = [...itemQuantities.keys()].sort().map(k => db.collection('products').doc(k));
        const productSnaps = await Promise.all(productRefs.map(ref => tx.get(ref)));
        for (let i = 0; i < productRefs.length; i++) {
          const pSnap = productSnaps[i];
          if (pSnap.exists) {
            const p = pSnap.data();
            const restoreQty = itemQuantities.get(productRefs[i].id);
            const newStock = (Number.isInteger(p.stock) ? p.stock : 0) + restoreQty;
            const newStatus = p.status === 'OUT_OF_STOCK' && newStock > 0 ? 'ACTIVE' : p.status;
            tx.update(productRefs[i], { stock: newStock, status: newStatus });
          }
        }
      }

      const changes = {};
      const now = new Date().toISOString();
      if (data.status) {
        if (!allowedTransitions.has(data.status)) {
          throw Object.assign(new Error(`Invalid status: ${data.status}`), { status: 400 });
        }
        changes.status = data.status;
        changes.statusHistory = [
          ...(current.statusHistory || []),
          {
            status: data.status,
            timestamp: now,
            note: (typeof data.note === 'string' && data.note.trim()) ? data.note.trim() : `Admin updated status to ${data.status}`,
          },
        ];
      }

      if (data.paymentStatus) {
        if (!['PAID', 'PENDING', 'REFUNDED'].includes(data.paymentStatus)) {
          throw Object.assign(new Error('Invalid payment status'), { status: 400 });
        }
        changes.paymentStatus = data.paymentStatus;
      }

      const updated = {
        ...current,
        ...changes,
        updatedAt: now,
      };

      tx.update(orderRef, updated);
      return { ...updated, id: orderId };
    });
  };

  return { create, cancel, updateItemFulfillment, adminUpdate };
}
