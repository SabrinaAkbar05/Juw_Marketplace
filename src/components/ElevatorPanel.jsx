import { floors } from '../data/floors';
import '../styles/panel.css';

export default function ElevatorPanel({ currentFloor, onSelectFloor, disabled }) {
  return (
    <div className="floor-panel" id="elevator-floor-panel">
      <div className="floor-panel__header">
        <div className="floor-panel__title">Select Floor</div>
        <div className="floor-panel__subtitle">Tap a department to ride</div>
      </div>

      <div className="floor-panel__grid">
        {floors.map((floor) => {
          const isSelected = currentFloor?.id === floor.id;
          return (
            <button
              key={floor.id}
              id={`floor-btn-${floor.id}`}
              className={`floor-btn ${isSelected ? 'active' : ''} ${floor.id === 'G' ? 'ground' : ''}`}
              style={{ '--floor-accent': floor.accent }}
              onClick={() => {
                if (!disabled) {
                  onSelectFloor(floor);
                }
              }}
              disabled={disabled}
              aria-label={`Go to Floor ${floor.id} — ${floor.name}`}
              title={`Floor ${floor.id}: ${floor.name}`}
            >
              <span className="floor-btn__num">{floor.id}</span>
              <span className="floor-btn__emoji">{floor.emoji}</span>
              <span className="floor-btn__name">{floor.name}</span>
            </button>
          );
        })}
      </div>

      <div className="floor-panel__controls">
        <div className="panel-ctrl-status">
          ✦ Select any floor above ✦
        </div>
      </div>
    </div>
  );
}
