import '../styles/cart.css';

export default function Navbar({ currentFloor, cartCount, onOpenCart, onReturnToElevator, onGoHome }) {
  return (
    <header className="top-nav" id="top-navbar">
      <button className="top-nav__logo" onClick={onGoHome} aria-label="Go to JUW Shop Home">
        <div className="top-nav__logo-mark">J</div>
        <div className="top-nav__logo-text">
          JUW <span>SHOP</span>
        </div>
      </button>

      <div className="top-nav__actions">
        {currentFloor && (
          <button
            className="top-nav__elevator-btn"
            onClick={onReturnToElevator}
            id="nav-elevator-btn"
            aria-label="Return to Elevator"
          >
            🛗 Floor {currentFloor.id} ({currentFloor.name})
          </button>
        )}

        <button
          className="top-nav__cart-btn"
          onClick={onOpenCart}
          id="nav-cart-btn"
          aria-label="Shopping Cart"
        >
          🛒
          {cartCount > 0 && (
            <span className="top-nav__cart-badge" id="cart-item-count">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
