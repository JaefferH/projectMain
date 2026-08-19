import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quotes } from '../lib/translations';
import { useAppStore } from '../store/useAppStore';

/**
 * variant="card"   → large prominent card for Landing page (below titles)
 * variant="banner" → slim frosted banner for Auth page (above login cards)
 */
interface Props {
  variant?: 'card' | 'banner';
}

export default function ScripturalQuote({ variant = 'card' }: Props) {
  const { currentLanguage } = useAppStore();
  const [index, setIndex] = useState(0);

  // Cycle every 7 seconds
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % quotes.length), 7000);
    return () => clearInterval(id);
  }, []);

  const q = quotes[index];
  const isAr = currentLanguage === 'ar';

  // ── CARD VARIANT (Landing page) ─────────────────────────────────────────
  if (variant === 'card') {
    return (
      <div
        className="w-full max-w-2xl mx-auto rounded-3xl border border-[#d4af37]/30 shadow-[0_8px_40px_rgba(0,0,0,0.45)] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(6,78,59,0.72) 0%, rgba(4,50,36,0.80) 100%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        {/* Gold shimmer top line */}
        <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent" />

        <div className="px-8 py-7 relative">
          {/* Decorative star motif */}
          <div className="absolute right-5 top-3 opacity-[0.07] pointer-events-none select-none" aria-hidden>
            <svg width="90" height="90" viewBox="0 0 100 100" fill="none">
              <path d="M50 0L61 35H97L68 57L79 92L50 70L21 92L32 57L3 35H39Z" fill="#d4af37" />
            </svg>
          </div>

          {/* Quote body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="space-y-4 text-center"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Arabic — always shown, primary weight */}
              <p
                className="font-arabic text-[#6ee7b7] font-extrabold leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)' }}
                dir="rtl"
              >
                {q.ar}
              </p>

              {/* Divider */}
              <div className="flex items-center justify-center gap-3 opacity-60">
                <div className="h-px w-12 bg-[#34d399]" />
                <span className="text-[#6ee7b7] text-xs">✦</span>
                <div className="h-px w-12 bg-[#34d399]" />
              </div>

              {/* Localised translation */}
              <p
                className="text-white font-medium italic leading-relaxed drop-shadow-sm"
                style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1rem)' }}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {currentLanguage === 'ar' ? q.ar : currentLanguage === 'am' ? q.am : q.en}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-5">
            {quotes.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-5 h-1.5 bg-[#d4af37]'
                    : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Quote ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Gold shimmer bottom line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
      </div>
    );
  }

  // ── BANNER VARIANT (Auth page) ──────────────────────────────────────────
  return (
    <div
      className="w-full max-w-4xl mx-auto rounded-2xl border border-white/10 overflow-hidden"
      style={{
        background: 'rgba(6,78,59,0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderColor: 'rgba(212,175,55,0.20)',
      }}
    >
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />

      <div className="px-6 py-4 flex items-center gap-4 min-h-[72px]">
        {/* Gold ornament */}
        <span className="text-[#d4af37]/60 text-xl shrink-0 select-none" aria-hidden>
          ✦
        </span>

        {/* Quote */}
        <div className="flex-1 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: isAr ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isAr ? 20 : -20 }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              className="space-y-1"
            >
              {/* Arabic text */}
              <p
                className="font-arabic text-[#d4af37] leading-snug"
                style={{ fontSize: 'clamp(0.82rem, 1.4vw, 1rem)' }}
                dir="rtl"
              >
                {q.ar}
              </p>
              {/* Translation (hidden in Arabic mode since Arabic is primary) */}
              {!isAr && (
                <p
                  className="text-white/50 italic"
                  style={{ fontSize: 'clamp(0.68rem, 1.1vw, 0.78rem)' }}
                  dir="ltr"
                >
                  {currentLanguage === 'am' ? q.am : q.en}
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
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-4 h-1.5 bg-[#d4af37]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Quote ${i + 1}`}
            />
          ))}
        </div>

        <span className="text-[#d4af37]/60 text-xl shrink-0 select-none" aria-hidden>
          ✦
        </span>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
    </div>
  );
}
