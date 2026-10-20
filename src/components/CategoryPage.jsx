import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { floors, getProducts } from '../data/floors';
import '../styles/category.css';

function ProductCard({ product, index, onAddToCart }) {
  const cardRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 35, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay: index * 0.08,
        ease: 'power3.out',
      }
    );
  }, { scope: cardRef });

  return (
    <div className="product-card" ref={cardRef} id={`product-${product.id}`}>
      <div className="product-card__img-wrap">
        <img
          className="product-card__img"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
        <span className="product-card__badge">JUW Made</span>
      </div>

      <div className="product-card__info">
        <h3 className="product-card__name">{product.name}</h3>
        {product.desc && (
          <p className="product-card__desc">{product.desc}</p>
        )}

        <div className="product-card__meta">
          <span className="product-card__rating">
            {'★'.repeat(Math.floor(product.rating))}
            <span style={{ opacity: 0.35 }}>
              {'★'.repeat(5 - Math.floor(product.rating))}
            </span>
            &nbsp;{product.rating}
          </span>
          <span className="product-card__sold">{product.sold} sold</span>
        </div>

        <div className="product-card__price">
          <span>PKR</span>{product.price.toLocaleString()}
        </div>
      </div>

      <button
        className="product-card__btn"
        id={`add-cart-${product.id}`}
        onClick={() => onAddToCart(product)}
        aria-label={`Add ${product.name} to cart`}
      >
        + Add to Cart
      </button>
    </div>
  );
}

function MiniPanel({ currentFloor, onSelectFloor }) {
  return (
    <aside className="mini-panel" aria-label="Department Elevator Switcher">
      <div className="mini-panel__label">Floors</div>
      <div className="mini-panel__list">
        {floors.map((floor) => {
          const isActive = currentFloor?.id === floor.id;
          return (
            <button
              key={floor.id}
              className={`mini-floor-btn ${isActive ? 'active' : ''}`}
              onClick={() => !isActive && onSelectFloor(floor)}
              id={`mini-floor-${floor.id}`}
              aria-label={`Take elevator to Floor ${floor.id}: ${floor.name}`}
              title={`${floor.id} — ${floor.name}`}
            >
              <span className="mini-floor-btn__num">{floor.id}</span>
              <span className="mini-floor-btn__emoji">{floor.emoji}</span>
              <span className="mini-floor-btn__name">{floor.name}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default function CategoryPage({
  floor,
  onSelectFloor,
  onReturnToElevator,
  onAddToCart,
}) {
  const heroRef = useRef(null);
  const products = getProducts(floor.id);

  useGSAP(() => {
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: -25 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
    );
  }, { scope: heroRef, dependencies: [floor.id] });

  return (
    <div
      className="category-page"
      style={{
        '--floor-color': floor.color,
        '--floor-accent': floor.accent,
      }}
      id={`category-floor-${floor.id}`}
    >
      {/* Category Hero Banner */}
      <div className="category-hero" ref={heroRef}>
        <div className="category-hero__bg" />
        <div className="category-hero__pattern" />

        <button
          className="category-hero__back"
          onClick={onReturnToElevator}
          aria-label="Return to elevator"
          id="back-to-elevator"
        >
          🛗 Return to Elevator
        </button>

        <div className="category-hero__content">
          <div className="category-hero__floor-num">
            Floor {floor.id} &nbsp;·&nbsp; {floor.emoji} &nbsp;·&nbsp; JUW Department
          </div>
          <h1 className="category-hero__title">{floor.name}</h1>
          <p className="category-hero__desc">
            {floor.desc || `Discover handcrafted ${floor.name.toLowerCase()} items made with pride by JUW students.`}
          </p>
        </div>
      </div>

      {/* Main Category Body */}
      <div className="category-body">
        {/* Sticky Mini Floor Panel */}
        <MiniPanel currentFloor={floor} onSelectFloor={onSelectFloor} />

        {/* Products Grid */}
        <main className="products-area" id="products-container">
          <div className="products-area__header">
            <div>
              <h2 className="products-area__title">
                {floor.name} Catalog
              </h2>
              <p className="products-area__subtitle">
                Student-crafted items available for purchase
              </p>
            </div>
            <span className="products-area__count">
              {products.length} Products Available
            </span>
          </div>

          <div className="products-grid">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
