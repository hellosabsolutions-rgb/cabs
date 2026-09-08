import React from 'react';
import '../../styles/CabLoadingScreen.css';

export interface CabLoadingScreenProps {
  title?: React.ReactNode;
  subtitle?: string;
  showTitle?: boolean;
  carImageSrc?: string;
  isFadingOut?: boolean;
}

export const CabLoadingScreen: React.FC<CabLoadingScreenProps> = ({
  title,
  subtitle = 'Loading your dashboard…',
  showTitle = true,
  carImageSrc = '/innova-cab.png',
  isFadingOut = false
}) => {
  return (
    <div
      className={`cab-loading-stage ${isFadingOut ? 'fade-out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading your dashboard"
    >
      <div className="car-wrap">
        <div className="glow" />
        <div className="car-anim">
          <img
            className="car"
            src={carImageSrc}
            alt="Innova cab"
            draggable={false}
          />
        </div>
      </div>

      <div className="brand">
        {showTitle && (
          title !== undefined ? (
            typeof title === 'string' ? (
              <h1>{title}</h1>
            ) : (
              title
            )
          ) : (
            <h1>
              <span>KAB</span>PRO
            </h1>
          )
        )}
        <p>{subtitle}</p>
        <div className="progress">
          <div className="progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default CabLoadingScreen;
