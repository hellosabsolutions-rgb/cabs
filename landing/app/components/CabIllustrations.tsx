'use client';

export function SedanCab({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 80"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse cx="80" cy="72" rx="55" ry="4" fill="currentColor" opacity="0.08" />
      {/* Body */}
      <path
        d="M20 52h120c0 0 4 0 4 4v8c0 2-2 4-4 4H20c-2 0-4-2-4-4v-8c0-4 4-4 4-4z"
        fill="#5028c0"
      />
      {/* Roof */}
      <path
        d="M45 52V36c0-2 2-4 4-4h62c2 0 4 2 4 4v16"
        fill="#7856ff"
      />
      {/* Windows */}
      <rect x="52" y="35" width="22" height="14" rx="2" fill="#80e1d9" opacity="0.4" />
      <rect x="78" y="35" width="22" height="14" rx="2" fill="#80e1d9" opacity="0.4" />
      <rect x="104" y="35" width="8" height="14" rx="2" fill="#80e1d9" opacity="0.3" />
      {/* Window dividers */}
      <line x1="76" y1="35" x2="76" y2="49" stroke="#5028c0" strokeWidth="1.5" />
      {/* Taxi sign */}
      <rect x="62" y="26" width="28" height="8" rx="3" fill="#f8bc3b" />
      <text x="76" y="32.5" textAnchor="middle" fontSize="5" fill="#1f1f24" fontWeight="bold" fontFamily="system-ui">
        TAXI
      </text>
      {/* Headlights */}
      <rect x="140" y="54" width="6" height="6" rx="2" fill="#f8bc3b" />
      <rect x="14" y="54" width="6" height="6" rx="2" fill="#ff7557" />
      {/* Bumpers */}
      <rect x="8" y="58" width="8" height="3" rx="1" fill="#4520a8" />
      <rect x="144" y="58" width="8" height="3" rx="1" fill="#4520a8" />
      {/* Wheels */}
      <circle cx="42" cy="68" r="9" fill="#1f1f24" />
      <circle cx="42" cy="68" r="5" fill="#eae6e7" />
      <circle cx="42" cy="68" r="2" fill="#1f1f24" />
      <circle cx="118" cy="68" r="9" fill="#1f1f24" />
      <circle cx="118" cy="68" r="5" fill="#eae6e7" />
      <circle cx="118" cy="68" r="2" fill="#1f1f24" />
      {/* Door handle */}
      <rect x="88" y="50" width="6" height="1.5" rx="0.75" fill="#4520a8" />
    </svg>
  );
}

export function SUVCab({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 90"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse cx="90" cy="82" rx="60" ry="5" fill="currentColor" opacity="0.08" />
      {/* Body */}
      <path
        d="M18 58h144c3 0 5 2 5 5v10c0 2-2 4-5 4H18c-3 0-5-2-5-4V63c0-3 2-5 5-5z"
        fill="#5028c0"
      />
      {/* Roof - taller for SUV */}
      <path
        d="M38 58V32c0-3 2-5 5-5h94c3 0 5 2 5 5v26"
        fill="#7856ff"
      />
      {/* Roof rack */}
      <rect x="42" y="24" width="96" height="3" rx="1.5" fill="#4520a8" />
      {/* Windows - 3 rows */}
      <rect x="45" y="32" width="24" height="22" rx="2" fill="#80e1d9" opacity="0.35" />
      <rect x="73" y="32" width="24" height="22" rx="2" fill="#80e1d9" opacity="0.35" />
      <rect x="101" y="32" width="24" height="22" rx="2" fill="#80e1d9" opacity="0.35" />
      {/* Window dividers */}
      <line x1="71" y1="32" x2="71" y2="54" stroke="#5028c0" strokeWidth="2" />
      <line x1="99" y1="32" x2="99" y2="54" stroke="#5028c0" strokeWidth="2" />
      {/* Headlights */}
      <rect x="162" y="60" width="7" height="7" rx="2" fill="#f8bc3b" />
      <rect x="11" y="60" width="7" height="7" rx="2" fill="#ff7557" />
      {/* Bumper guard */}
      <rect x="5" y="64" width="10" height="4" rx="1.5" fill="#4520a8" />
      <rect x="165" y="64" width="10" height="4" rx="1.5" fill="#4520a8" />
      {/* Wheels - larger for SUV */}
      <circle cx="48" cy="77" r="11" fill="#1f1f24" />
      <circle cx="48" cy="77" r="6" fill="#eae6e7" />
      <circle cx="48" cy="77" r="2.5" fill="#1f1f24" />
      <circle cx="132" cy="77" r="11" fill="#1f1f24" />
      <circle cx="132" cy="77" r="6" fill="#eae6e7" />
      <circle cx="132" cy="77" r="2.5" fill="#1f1f24" />
      {/* Side step */}
      <rect x="55" y="72" width="70" height="2" rx="1" fill="#4520a8" />
    </svg>
  );
}

export function MiniTruck({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 90"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse cx="100" cy="82" rx="70" ry="5" fill="currentColor" opacity="0.08" />
      {/* Cargo bed */}
      <rect x="70" y="30" width="115" height="38" rx="3" fill="#5028c0" />
      <rect x="74" y="34" width="107" height="30" rx="2" fill="#4520a8" />
      {/* Cargo lines */}
      <line x1="100" y1="34" x2="100" y2="64" stroke="#5028c0" strokeWidth="1" />
      <line x1="130" y1="34" x2="130" y2="64" stroke="#5028c0" strokeWidth="1" />
      <line x1="155" y1="34" x2="155" y2="64" stroke="#5028c0" strokeWidth="1" />
      {/* Cabin */}
      <path
        d="M15 68V40c0-3 2-5 5-5h45c3 0 5 2 5 5v28"
        fill="#7856ff"
      />
      {/* Cabin window */}
      <rect x="22" y="38" width="36" height="18" rx="2" fill="#80e1d9" opacity="0.4" />
      {/* Cabin door */}
      <rect x="22" y="56" width="36" height="12" rx="1" fill="#5028c0" />
      <rect x="50" y="60" width="5" height="2" rx="1" fill="#eae6e7" opacity="0.5" />
      {/* Headlights */}
      <rect x="8" y="55" width="8" height="7" rx="2" fill="#f8bc3b" />
      {/* Tail lights */}
      <rect x="184" y="55" width="6" height="7" rx="2" fill="#ff7557" />
      {/* Bumper */}
      <rect x="5" y="63" width="12" height="4" rx="1.5" fill="#4520a8" />
      {/* Wheels */}
      <circle cx="38" cy="77" r="11" fill="#1f1f24" />
      <circle cx="38" cy="77" r="6" fill="#eae6e7" />
      <circle cx="38" cy="77" r="2.5" fill="#1f1f24" />
      <circle cx="155" cy="77" r="11" fill="#1f1f24" />
      <circle cx="155" cy="77" r="6" fill="#eae6e7" />
      <circle cx="155" cy="77" r="2.5" fill="#1f1f24" />
      {/* KABPRO branding on truck */}
      <text x="120" y="52" textAnchor="middle" fontSize="8" fill="#7856ff" fontWeight="bold" fontFamily="system-ui" opacity="0.6">
        KABPRO
      </text>
    </svg>
  );
}
