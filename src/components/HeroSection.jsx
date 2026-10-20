import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import '../styles/hero.css';

export default function HeroSection({ onEnter }) {
  const heroRef = useRef(null);
  const badgeRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const btnRef = useRef(null);
  const statsRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(badgeRef.current,
      { opacity: 0, y: -20, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8 }
    )
    .fromTo(eyebrowRef.current,
      { opacity: 0, y: 20, letterSpacing: '0.6em' },
      { opacity: 1, y: 0, letterSpacing: '0.4em', duration: 0.9 },
      '-=0.4'
    )
    .fromTo(titleRef.current,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1.1 },
      '-=0.5'
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.6'
    )
    .fromTo(btnRef.current,
      { opacity: 0, y: 25, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8 },
      '-=0.4'
    )
    .fromTo(statsRef.current,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.5'
    );
  }, { scope: heroRef });

  return (
    <section className="hero" ref={heroRef} id="hero-section">
      {/* Real Video Background Element */}
      <div className="hero__video-wrap">
        <video
          className="hero__video"
          src="/hero-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
      </div>

      {/* Overlays for contrast & elegance */}
      <div className="hero__overlay" />
      <div className="hero__vignette" />
      <div className="hero__grain" />
      <div className="hero__orb hero__orb--1" />
      <div className="hero__orb hero__orb--2" />
      <div className="hero__orb hero__orb--3" />

      {/* Main Content */}
      <div className="hero__content">
        <div className="hero__badge" ref={badgeRef}>
          <span className="hero__badge-dot" />
          Jinnah University for Women
        </div>

        <p className="hero__eyebrow" ref={eyebrowRef}>
          Elevator Shopping Experience — Est. 2024
        </p>

        <h1 className="hero__title" ref={titleRef}>
          JUW
          <span>SHOP</span>
        </h1>

        <p className="hero__subtitle" ref={subtitleRef}>
          Twelve floors of student craftsmanship, fashion, bakery, fine arts, and university pride. Step inside the elevator to explore every department.
        </p>

        <button
          className="hero__enter-btn"
          ref={btnRef}
          onClick={onEnter}
          id="enter-shop-btn"
          aria-label="Enter JUW Shop Elevator"
        >
          <span>Enter JUW Shop</span>
          <span className="arrow">→</span>
        </button>
      </div>

      {/* University Stats Bar */}
      <div className="hero__stats" ref={statsRef}>
        {[
          { num: '500+', label: 'Student Creators' },
          { num: '12',   label: 'Department Floors' },
          { num: '2,500+', label: 'Handmade Items' },
          { num: '★ 4.9', label: 'Student Rating' },
        ].map(s => (
          <div key={s.label} className="hero__stat">
            <div className="hero__stat-num">{s.num}</div>
            <div className="hero__stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
