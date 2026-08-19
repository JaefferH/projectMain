import  { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { quotes } from '../../lib/translations';
import { useAppStore } from '../../store/useAppStore';

export default function ScripturalBanner() {
  const { currentLanguage } = useAppStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const currentQuote = quotes[activeIndex];
  const isArabic = currentLanguage === 'ar';

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-[#d4af37]/20 shadow-lg"
      style={{
        background: 'linear-gradient(135deg, rgba(6,78,59,0.80) 0%, rgba(5,46,37,0.88) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Gold shimmer top border */}
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent" />

      {/* Decorative hexagon bg motif */}
      <div className="absolute right-0 top-0 opacity-[0.06] pointer-events-none select-none">
        <svg width="160" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0L93.3013 25V75L50 100L6.69873 75V25L50 0Z" fill="#d4af37" />
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-4 px-6 py-4 min-h-[80px]">
        {/* Icon */}
        <div className="shrink-0 w-9 h-9 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center shadow-inner">
          <Sparkles size={16} className="text-[#d4af37]" />
        </div>

        {/* Quote */}
        <div className="flex-1 overflow-hidden" dir={isArabic ? 'rtl' : 'ltr'}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              className="space-y-1"
            >
              {/* Arabic text — always shown as primary script */}
              <p
                className="font-arabic text-[#e8cc6a] leading-relaxed drop-shadow-sm"
                style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1.05rem)' }}
                dir="rtl"
              >
                {currentQuote.ar}
              </p>
              {/* Localised translation (non-Arabic) */}
              {currentLanguage !== 'ar' && (
                <p
                  className="text-white/65 italic leading-snug"
                  style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.82rem)' }}
                  dir="ltr"
                >
                  {currentLanguage === 'am' ? currentQuote.am : currentQuote.en}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="shrink-0 flex gap-1.5 items-center">
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > activeIndex ? 1 : -1);
                setActiveIndex(i);
              }}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-4 h-1.5 bg-[#d4af37]'
                  : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
              }`}
              aria-label={`Quote ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom gold shimmer */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
    </div>
  );
}
