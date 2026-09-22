import React from 'react';

interface SietLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const SietLogo: React.FC<SietLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  variant = 'light',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* SIET Emblem Crest Graphic */}
      <div
        className={`${sizeMap[size]} relative rounded-full bg-gradient-to-b from-[#facc15] via-[#eab308] to-[#ca8a04] p-0.5 shadow-sm flex items-center justify-center shrink-0 border border-[#064024] overflow-hidden`}
      >
        <div className="w-full h-full rounded-full bg-[#064024] flex flex-col items-center justify-center p-1 text-center relative overflow-hidden">
          {/* Emblem graphic: India Map + Computer Monitor + Torch/Growth Laurel */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-[#facc15]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer laurel wreath */}
            <circle cx="50" cy="50" r="46" stroke="#facc15" strokeWidth="2.5" strokeDasharray="3 3" />
            
            {/* Torch flame at top */}
            <path
              d="M50 8 C53 14, 58 18, 55 24 C52 20, 50 18, 45 24 C43 18, 47 14, 50 8 Z"
              fill="#facc15"
            />

            {/* Rising Sun Rays */}
            <path d="M50 26 L50 32 M38 28 L42 34 M62 28 L58 34 M30 36 L36 40 M70 36 L64 40" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />

            {/* Computer screen / Knowledge gateway */}
            <rect x="28" y="42" width="44" height="30" rx="3" fill="#042f2e" stroke="#facc15" strokeWidth="2.5" />
            <rect x="33" y="46" width="34" height="18" rx="1.5" fill="#0a5c36" />
            
            {/* Silhouette inside screen: India Map & Gear */}
            <circle cx="50" cy="55" r="5" fill="#facc15" />
            <path d="M47 55 L53 55 M50 52 L50 58" stroke="#042f2e" strokeWidth="1.5" />
            
            {/* Monitor Stand */}
            <path d="M44 72 L56 72 M50 72 L50 78 M38 78 L62 78" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />

            {/* SIET Core Ribbon */}
            <path d="M22 84 Q50 94 78 84" stroke="#facc15" strokeWidth="3" fill="none" strokeLinecap="round" />
            <text x="50" y="90" textAnchor="middle" fill="#fef08a" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
              SIET CSE
            </text>
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`text-xs font-black tracking-tight uppercase ${variant === 'dark' ? 'text-white' : 'text-[#172017]'}`}>
            Sri Shakthi
          </span>
          <span className={`text-[10px] font-semibold tracking-wider ${variant === 'dark' ? 'text-[#facc15]' : 'text-[#0a5c36]'}`}>
            OD MANAGEMENT
          </span>
        </div>
      )}
    </div>
  );
};

export default SietLogo;
