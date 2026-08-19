import React from 'react';

// 8-Pointed Islamic Star (Rub el Hizb / Shamsha Medallion)
export const IslamicStarMedallion = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    {/* Outer 8-pointed star formed by two overlapping rotated squares */}
    <rect x="15" y="15" width="70" height="70" rx="4" stroke="#d4af37" strokeWidth="3" fill="none" />
    <rect x="15" y="15" width="70" height="70" rx="4" transform="rotate(45 50 50)" stroke="#d4af37" strokeWidth="3" fill="none" />
    
    {/* Inner decorative geometric star lines */}
    <circle cx="50" cy="50" r="22" stroke="#d4af37" strokeWidth="2.5" fill="rgba(212, 175, 55, 0.15)" />
    <circle cx="50" cy="50" r="10" fill="#d4af37" />
  </svg>
);

// Andalusian / Moroccan Islamic Arch Corner Pattern
export const IslamicCornerArch = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`absolute pointer-events-none select-none opacity-25 ${className}`}
  >
    {/* Outer Arch */}
    <path
      d="M120 0H0V120C0 53.7258 53.7258 0 120 0Z"
      fill="url(#goldGradient)"
    />
    <path
      d="M110 0H0V110C0 49.7056 49.7056 0 110 0Z"
      stroke="#d4af37"
      strokeWidth="1.5"
      strokeDasharray="4 4"
    />
    <defs>
      <linearGradient id="goldGradient" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop stopColor="#d4af37" stopOpacity="0.4" />
        <stop offset="1" stopColor="#059669" stopOpacity="0.05" />
      </linearGradient>
    </defs>
  </svg>
);

// Traditional Bismillah & Quranic Quote Calligraphy Header Card
export const IslamicQuoteBanner = ({ quote, translation }: { quote?: string; translation?: string }) => (
  <div className="relative overflow-hidden rounded-2xl glass-card p-5 border border-[#d4af37]/30 shadow-xl my-4">
    {/* Top & Bottom Shimmer Accent Lines */}
    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
    <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#10b981] to-transparent" />

    {/* Islamic Arch Corner Ornaments */}
    <IslamicCornerArch className="top-0 left-0 w-24 h-24" />
    <IslamicCornerArch className="top-0 right-0 w-24 h-24 rotate-90" />

    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left px-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-inner shrink-0">
          <IslamicStarMedallion size={28} />
        </div>
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Islamic Wisdom &amp; Quranic Guidance</p>
          <h4 className="text-[#d4af37] font-bold text-lg font-arabic leading-relaxed mt-0.5">
            {quote || '“وَقُل رَّبِّ زِدْنِي عِلْمًا”'}
          </h4>
        </div>
      </div>

      <div className="text-right md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-6">
        <p className="text-emerald-100/90 text-xs italic font-medium">
          {translation || '“And say, \'My Lord, increase me in knowledge.\'” — Surah Taha (20:114)'}
        </p>
        <span className="gold-badge px-2.5 py-0.5 rounded-full text-[10px] mt-1.5 inline-block">
          Imam Hassen Islamic Education
        </span>
      </div>
    </div>
  </div>
);

// Large Authentic Arabic Calligraphy Watermark Background Overlay (Sidebar & Pages)
export const ArabicCalligraphyBg = ({ density = 'medium' }: { density?: 'light' | 'medium' | 'heavy' }) => {
  const opacityClass = density === 'light' ? 'opacity-[0.04]' : density === 'heavy' ? 'opacity-[0.08]' : 'opacity-[0.06]';

  return (
    <div className={`absolute inset-0 pointer-events-none select-none overflow-hidden ${opacityClass} z-0`}>
      {/* Background Bismillah Calligraphy Watermark */}
      <div className="absolute -top-10 left-10 text-[#d4af37] font-arabic text-7xl font-bold whitespace-nowrap tracking-widest leading-loose rotate-[-6deg]">
        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
      </div>
      <div className="absolute top-1/4 right-5 text-[#d4af37] font-arabic text-8xl font-bold whitespace-nowrap tracking-widest leading-loose rotate-[4deg]">
        وَقُل رَّبِّ زِدْنِي عِلْمًا
      </div>
      <div className="absolute top-1/2 left-4 text-[#10b981] font-arabic text-7xl font-bold whitespace-nowrap tracking-widest leading-loose rotate-[-3deg]">
        اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ
      </div>
      <div className="absolute bottom-20 right-12 text-[#d4af37] font-arabic text-8xl font-bold whitespace-nowrap tracking-widest leading-loose rotate-[5deg]">
        طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
      </div>
      <div className="absolute -bottom-10 left-1/3 text-[#d4af37] font-arabic text-7xl font-bold whitespace-nowrap tracking-widest leading-loose">
        ن وَالْقَلَمِ وَمَا يَسْطُرُونَ
      </div>
    </div>
  );
};

// Traditional Arabesque Geometric Pattern Background Overlay
export const ArabicPatternBg = () => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.04] select-none overflow-hidden z-0">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="islamicStarGrid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#d4af37" strokeWidth="1.2" />
          <circle cx="40" cy="40" r="16" fill="none" stroke="#d4af37" strokeWidth="1" />
          <path d="M20 20 L60 60 M60 20 L20 60" stroke="#d4af37" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamicStarGrid)" />
    </svg>
  </div>
);
