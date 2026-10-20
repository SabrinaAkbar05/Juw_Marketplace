import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ElevatorPanel from './ElevatorPanel';
import '../styles/elevator.css';

const Elevator = forwardRef(function Elevator(
  { isOpen, currentFloor, onSelectFloor, panelDisabled },
  ref
) {
  const leftDoorRef  = useRef(null);
  const rightDoorRef = useRef(null);
  const panelRef     = useRef(null);
  const indicatorRef = useRef(null);

  // Expose door animations to parent via ref
  useImperativeHandle(ref, () => ({
    openDoors(onComplete) {
      const tl = gsap.timeline({ onComplete });
      tl.to(leftDoorRef.current,  { x: '-102%', duration: 1.0, ease: 'power2.inOut' }, 0)
        .to(rightDoorRef.current, { x: '102%',  duration: 1.0, ease: 'power2.inOut' }, 0)
        .fromTo(panelRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.4);
    },
    closeDoors(onComplete) {
      const tl = gsap.timeline({ onComplete });
      tl.to(panelRef.current,     { opacity: 0, scale: 0.95, duration: 0.3 }, 0)
        .to(leftDoorRef.current,  { x: '0%', duration: 0.9, ease: 'power3.inOut' }, 0.1)
        .to(rightDoorRef.current, { x: '0%', duration: 0.9, ease: 'power3.inOut' }, 0.1);
    },
  }));

  useGSAP(() => {
    if (isOpen) {
      gsap.set(leftDoorRef.current,  { x: '-102%' });
      gsap.set(rightDoorRef.current, { x: '102%' });
      gsap.set(panelRef.current,     { opacity: 1, scale: 1 });
    } else {
      gsap.set(leftDoorRef.current,  { x: '0%' });
      gsap.set(rightDoorRef.current, { x: '0%' });
      gsap.set(panelRef.current,     { opacity: 0 });
    }
  }, [isOpen]);

  return (
    <section className="elevator-stage" id="elevator-section">
      <div className="elevator-stage__label">
        ⬆ &nbsp; JUW Shop Department Elevator &nbsp; ⬇
      </div>

      <div className="elevator-wrapper">
        {/* Cable */}
        <div className="elevator__cable" />

        {/* Main elevator car */}
        <div className="elevator" role="region" aria-label="Elevator Car">

          {/* Floor indicator display */}
          <div className="elevator__indicator">
            <span
              className="elevator__indicator-num"
              ref={indicatorRef}
              aria-live="polite"
            >
              {currentFloor ? currentFloor.id : 'G'}
            </span>
            <span className="elevator__indicator-dir">
              {currentFloor ? currentFloor.emoji : '🏠'}
            </span>
          </div>

          {/* Interior (Floor Selection Panel lives here) */}
          <div className="elevator__interior">
            <div
              className="elevator__panel-container"
              ref={panelRef}
              style={{ opacity: isOpen ? 1 : 0 }}
            >
              <ElevatorPanel
                currentFloor={currentFloor}
                onSelectFloor={onSelectFloor}
                disabled={panelDisabled}
              />
            </div>
          </div>

          {/* Sliding elevator doors */}
          <div className="elevator__doors" aria-hidden="true">
            <div
              className="elevator__door elevator__door--left"
              ref={leftDoorRef}
            >
              <div className="elevator__door-texture" />
              <div className="elevator__door-handle" />
            </div>
            <div
              className="elevator__door elevator__door--right"
              ref={rightDoorRef}
            >
              <div className="elevator__door-texture" />
              <div className="elevator__door-handle" />
            </div>
          </div>
        </div>

        {/* Shaft base */}
        <div className="elevator__shaft-base" />
      </div>
    </section>
  );
});

export default Elevator;
