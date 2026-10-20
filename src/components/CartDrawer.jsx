import '../styles/cart.css';

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}) {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-overlay" onClick={onClose} id="cart-drawer-overlay">
      <div
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Shopping Cart Drawer"
      >
        <div className="cart-drawer__header">
          <div className="cart-drawer__title">
            Your Cart <span>({items.reduce((c, i) => c + i.quantity, 0)} items)</span>
          </div>
          <button
            className="cart-drawer__close"
            onClick={onClose}
            aria-label="Close Cart"
            id="close-cart-btn"
          >
            ✕
          </button>
        </div>

        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty__icon">🛍️</div>
              <h3>Your cart is empty</h3>
              <p>Explore the departments and add handcrafted items made by JUW students.</p>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.id}>
                <img
                  className="cart-item__img"
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                />
                <div className="cart-item__details">
                  <div className="cart-item__name">{item.name}</div>
                  <div className="cart-item__price">
                    PKR {(item.price * item.quantity).toLocaleString()}
                  </div>
                  <div className="cart-item__controls">
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="cart-item__qty">{item.quantity}</span>
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  className="cart-item__remove"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__subtotal">
              <span className="cart-drawer__subtotal-label">Subtotal</span>
              <span className="cart-drawer__subtotal-val">
                PKR {subtotal.toLocaleString()}
              </span>
            </div>
            <button
              className="cart-drawer__checkout-btn"
              onClick={onCheckout}
              id="checkout-btn"
            >
              Simulate Checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
