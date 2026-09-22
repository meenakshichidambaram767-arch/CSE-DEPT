import React from 'react';
import Image from 'next/image';

export interface SietLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
    '2xl': 'w-24 h-24',
  };

  const pixelMap = {
    sm: 28,
    md: 36,
    lg: 56,
    xl: 80,
    '2xl': 96,
  };

  const px = pixelMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official SIET Emblem Badge with clean circular backing */}
      <div
        className={`${sizeMap[size]} relative rounded-full bg-white shadow-xs p-1 flex items-center justify-center shrink-0 border border-emerald-900/10 ring-1 ring-[#fed403]/50 overflow-hidden`}
      >
        <div className="relative w-full h-full">
          <Image
            src="/images/siet-logo.png"
            alt="Sri Shakthi Institute of Engineering and Technology Logo"
            width={px}
            height={px}
            priority
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={`text-xs font-black tracking-tight uppercase ${
              variant === 'dark' ? 'text-white' : 'text-[#172017]'
            }`}
          >
            Sri Shakthi
          </span>
          <span
            className={`text-[10px] font-bold tracking-wider ${
              variant === 'dark' ? 'text-[#fed403]' : 'text-[#064024]'
            }`}
          >
            OD MANAGEMENT SYSTEM
          </span>
        </div>
      )}
    </div>
  );
};

export default SietLogo;
