'use client';

import { motion, useReducedMotion } from 'motion/react';

// Cab configurations with taxi-specific styling
const cabs = [
  { color: '#FFC107', type: 'taxi', delay: 0, x: -100, speed: 8 },
  { color: '#1687F5', type: 'taxi', delay: 1.2, x: 150, speed: 7.5 },
  { color: '#FFFFFF', type: 'taxi', delay: 2.5, x: 50, speed: 8.5 },
  { color: '#000000', type: 'taxi', delay: 4, x: -50, speed: 7 },
];

function TaxiSVG({ color }: { color: string }) {
  return (
    <svg width="140" height="60" viewBox="0 0 140 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="70" cy="55" rx="50" ry="4" fill="#000000" opacity="0.15" />
      
      {/* Car body */}
      <path
        d="M20 40 L30 40 L35 30 L50 25 L95 25 L105 30 L120 40 L120 45 L20 45 Z"
        fill={color}
        stroke={color === '#FFFFFF' ? '#e0e0e0' : '#1a1a1a'}
        strokeWidth="1.5"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
      />
      
      {/* Roof with taxi sign */}
      <path
        d="M40 25 L45 15 L85 15 L95 25"
        fill={color}
        stroke={color === '#FFFFFF' ? '#e0e0e0' : '#1a1a1a'}
        strokeWidth="1.5"
      />
      
      {/* TAXI light on roof */}
      <rect x="58" y="8" width="24" height="7" rx="2" fill="#FFC107" stroke="#1a1a1a" strokeWidth="1" />
      <text x="70" y="14" fontSize="5" fontWeight="bold" fill="#1a1a1a" textAnchor="middle">TAXI</text>
      
      {/* Windows */}
      <path d="M47 16 L50 25 L62 25 L62 16 Z" fill="#1a3a5c" opacity="0.7" />
      <path d="M64 16 L64 25 L84 25 L90 16 Z" fill="#1a3a5c" opacity="0.7" />
      
      {/* Door line */}
      <line x1="63" y1="25" x2="63" y2="40" stroke="#1a1a1a" strokeWidth="1" opacity="0.3" />
      
      {/* Headlights */}
      <circle cx="115" cy="35" r="3" fill="#fff9e0" opacity="0.9" />
      <circle cx="115" cy="35" r="2" fill="#ffffff" />
      
      {/* Taillights */}
      <circle cx="25" cy="35" r="3" fill="#ff3333" opacity="0.9" />
      
      {/* Side mirror */}
      <rect x="95" y="28" width="6" height="3" rx="1" fill={color} stroke="#1a1a1a" strokeWidth="0.5" />
      
      {/* Wheels with motion */}
      <g>
        <circle cx="45" cy="45" r="9" fill="#1a1a1a" />
        <circle cx="45" cy="45" r="5" fill="#4a4a4a" />
        <circle cx="45" cy="45" r="2" fill="#6a6a6a" />
      </g>
      <g>
        <circle cx="95" cy="45" r="9" fill="#1a1a1a" />
        <circle cx="95" cy="45" r="5" fill="#4a4a4a" />
        <circle cx="95" cy="45" r="2" fill="#6a6a6a" />
      </g>
      
      {/* Number plate */}
      <rect x="55" y="42" width="30" height="6" rx="1" fill="#FFFFFF" stroke="#1a1a1a" strokeWidth="0.5" />
      <text x="70" y="47" fontSize="4" fontWeight="600" fill="#1a1a1a" textAnchor="middle">KAB PRO</text>
    </svg>
  );
}

function AnimatedTaxi({ color, delay, initialX, speed }: { 
  color: string; 
  delay: number; 
  initialX: number;
  speed: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="absolute"
      initial={{ x: -180, opacity: 0 }}
      animate={{ 
        x: [-180, 500],
        opacity: [0, 1, 1, 1, 1, 0],
        y: [0, -2, 0, -1, 0] // Slight bounce for realism
      }}
      transition={{
        duration: reduce ? 0 : speed,
        delay: reduce ? 0 : delay,
        repeat: Infinity,
        ease: 'linear',
        y: { 
          duration: 0.5, 
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }}
    >
      <TaxiSVG color={color} />
    </motion.div>
  );
}

export function CarScene() {
  const reduce = useReducedMotion();

  return (
    <div className="w-full h-[280px] md:h-[320px] relative overflow-hidden bg-bg">
      {/* City skyline background */}
      <div className="absolute inset-x-0 bottom-[60%] flex justify-center items-end gap-1 md:gap-2 opacity-[0.08]">
        {[60, 95, 75, 110, 65, 100, 80, 70, 105, 60, 115, 85, 70, 95, 65].map((h, i) => (
          <motion.div
            key={i}
            className="bg-foreground rounded-t-sm"
            style={{ width: i % 3 === 0 ? '40px' : '25px', height: `${h}px` }}
            initial={{ opacity: 0.08 }}
            animate={reduce ? {} : { 
              opacity: [0.08, 0.12, 0.08],
              height: [`${h}px`, `${h + 5}px`, `${h}px`]
            }}
            transition={{ 
              duration: 4,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Road */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        {/* Road surface with gradient */}
        <div className="h-28 bg-gradient-to-b from-[#404040] via-[#3a3a3a] to-[#2d2d2d] relative shadow-inner">
          {/* Road center lines */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-around px-4">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="w-12 md:w-16 h-1.5 bg-yellow-300/90 rounded-full"
                initial={{ opacity: 0.5, scaleX: 1 }}
                animate={reduce ? {} : { 
                  opacity: [0.5, 1, 0.5],
                  scaleX: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: i * 0.08,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
          
          {/* Road edge lines */}
          <div className="absolute inset-x-0 top-2 h-0.5 bg-white/40" />
          <div className="absolute inset-x-0 bottom-2 h-0.5 bg-white/40" />
        </div>
      </div>

      {/* Animated taxis */}
      <div className="absolute inset-x-0 top-[calc(50%-40px)] z-10">
        {cabs.map((cab, i) => (
          <AnimatedTaxi
            key={i}
            color={cab.color}
            delay={cab.delay}
            initialX={cab.x}
            speed={cab.speed}
          />
        ))}
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-bg to-transparent pointer-events-none" />
      
      {/* Subtle particles for depth */}
      {!reduce && (
        <div className="absolute inset-0 opacity-30">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 50 - 25],
                y: [0, Math.random() * 50 - 25],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
