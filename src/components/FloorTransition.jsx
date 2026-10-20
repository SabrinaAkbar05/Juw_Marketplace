import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { floors } from '../data/floors';
import '../styles/transition.css';

export default function FloorTransition({ from, to, onComplete }) {
  const overlayRef    = useRef(null);
  const leftDoorRef   = useRef(null);
  const rightDoorRef  = useRef(null);
  const counterRef    = useRef(null);
  const nameRef       = useRef(null);
  const arrowRef      = useRef(null);
  const progressRef   = useRef(null);

  const [displayFloor, setDisplayFloor] = useState(from ?? floors[0]);

  const fromNum = from?.num ?? 0;
  const toNum   = to?.num ?? 0;
  const goingUp = toNum >= fromNum;
  const totalSteps = Math.max(Math.abs(toNum - fromNum), 1);

  useEffect(() => {
    if (!overlayRef.current) return;

    const direction = goingUp ? 1 : -1;
    // Dynamic duration based on how many floors we travel (1.2s to 2.2s total)
    const travelDuration = Math.min(Math.max(0.25 * totalSteps, 1.2), 2.2);

    const tl = gsap.timeline();

    // 1. Initial door slam shut
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo(
        [leftDoorRef.current, rightDoorRef.current],
        { x: (i) => (i === 0 ? '-102%' : '102%') },
        { x: '0%', duration: 0.6, ease: 'power3.inOut' },
        0
      );

    // 2. Ticking counter through floors
    let stepCount = 0;
    const intervalTime = (travelDuration * 1000) / totalSteps;

    const interval = setInterval(() => {
      stepCount++;
      const currentNum = fromNum + direction * stepCount;
      const target = floors.find((f) => f.num === currentNum) || to;
      setDisplayFloor(target);

      if (progressRef.current) {
        progressRef.current.style.width = `${Math.min((stepCount / totalSteps) * 100, 100)}%`;
      }

      if (stepCount >= totalSteps) {
        clearInterval(interval);
        setDisplayFloor(to);
      }
    }, intervalTime);

    // 3. Open doors upon arrival and fade out
    tl.to({}, { duration: travelDuration + 0.3 })
      .to([leftDoorRef.current, rightDoorRef.current], {
        x: (i) => (i === 0 ? '-102%' : '102%'),
        duration: 0.8,
        ease: 'power3.inOut',
      })
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          clearInterval(interval);
          if (onComplete) onComplete();
        },
      }, '-=0.2');

    return () => {
      clearInterval(interval);
      tl.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="floor-transition"
      ref={overlayRef}
      role="status"
      aria-label={`Elevator riding to floor ${to?.id} — ${to?.name}`}
    >
      {/* Moving elevator shaft stripes */}
      <div className="floor-transition__shaft">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="floor-transition__stripe"
            style={{
              animationDelay: `${i * 0.03}s`,
              animationDirection: goingUp ? 'normal' : 'reverse',
            }}
          />
        ))}
      </div>

      {/* Side walls */}
      <div className="floor-transition__wall floor-transition__wall--left" />
      <div className="floor-transition__wall floor-transition__wall--right" />

      {/* Center digital display */}
      <div className="floor-transition__content">
        <div
          className={`floor-transition__arrow ${goingUp ? 'going-up' : 'going-down'}`}
          ref={arrowRef}
        >
          {goingUp ? '▲' : '▼'}
        </div>

        <div className="floor-transition__counter" ref={counterRef}>
          <span className="floor-transition__counter-label">Floor</span>
          {displayFloor.id}
        </div>

        <div className="floor-transition__name" ref={nameRef}>
          {displayFloor.emoji} {displayFloor.name}
        </div>

        <div className="floor-transition__dest">
          Destination: <strong>Floor {to.id}</strong> ({to.name})
        </div>
      </div>

      {/* Sliding door panels */}
      <div
        className="floor-transition__door floor-transition__door--left"
        ref={leftDoorRef}
        style={{ transform: 'translateX(-102%)' }}
      />
      <div
        className="floor-transition__door floor-transition__door--right"
        ref={rightDoorRef}
        style={{ transform: 'translateX(102%)' }}
      />

      {/* Progress bar */}
      <div className="floor-transition__progress">
        <div className="floor-transition__progress-fill" ref={progressRef} />
      </div>
    </div>
  );
}
