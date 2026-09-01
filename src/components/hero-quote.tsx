import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { knowledgeQuotes } from "@/lib/quotes";
import { Sparkles, X, ScrollText } from "lucide-react";

export function HeroQuote() {
  const { lang } = useI18n();
  const [index, setIndex] = useState(0);
  const [selectedQuote, setSelectedQuote] = useState<typeof knowledgeQuotes[0] | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % knowledgeQuotes.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  const q = knowledgeQuotes[index];

  return (
    <>
      <figure className="mt-3 sm:mt-4 min-h-[6.5rem] sm:min-h-[8.5rem] relative">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={q.id}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            onClick={() => setSelectedQuote(q)}
            className="cursor-pointer group rounded-2xl p-4 sm:p-5 bg-black/75 hover:bg-black/85 border border-[#6ee7b7]/50 hover:border-[#6ee7b7] backdrop-blur-md transition-all shadow-xl inline-block text-left w-full sm:w-auto"
          >
            <div className="flex items-center gap-2 mb-1.5 text-xs text-[#6ee7b7] font-bold">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-[#6ee7b7]" />
              <span>Click for Hadith Commentary</span>
            </div>

            {lang !== "ar" && (
              <p dir="rtl" lang="ar" className="font-display text-xl sm:text-3xl font-extrabold text-[#6ee7b7] leading-relaxed drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
                {q.arabic}
              </p>
            )}
            <p className="mt-1.5 font-display text-base sm:text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] group-hover:text-[#6ee7b7] transition-colors leading-snug">
              {q.text[lang]}
            </p>
            <figcaption className="mt-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#34d399] drop-shadow-sm">
              <span aria-hidden className="h-px w-6 sm:w-8 bg-[#6ee7b7]" />
              {q.ref[lang]}
            </figcaption>
          </motion.blockquote>
        </AnimatePresence>
      </figure>

      {/* ── INTERACTIVE HADITH POP-UP MODAL ── */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-[#022c1e] via-[#043d2c] to-[#021a12] p-6 sm:p-8 border-2 border-[#6ee7b7]/60 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(110,231,183,0.35)] text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedQuote(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-[#6ee7b7]/20 text-[#6ee7b7] border border-[#6ee7b7]/40">
                  <ScrollText className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#6ee7b7]">Sacred Islamic Wisdom</span>
                  <h3 className="text-lg font-extrabold text-white">Hadith Reflection &amp; Source</h3>
                </div>
              </div>

              {/* Arabic Verse / Hadith */}
              <div className="p-6 rounded-2xl bg-black/50 border border-[#6ee7b7]/30 text-center my-4">
                <p dir="rtl" lang="ar" className="font-display text-3xl font-extrabold text-[#6ee7b7] leading-relaxed drop-shadow-md">
                  {selectedQuote.arabic}
                </p>
              </div>

              {/* Translations & Commentary */}
              <div className="space-y-3">
                <p className="text-base font-bold text-white leading-relaxed">
                  “{selectedQuote.text[lang]}”
                </p>
                <p className="text-xs text-emerald-100/90 font-mono bg-emerald-950/60 p-3 rounded-xl border border-emerald-800">
                  📖 <span className="font-bold text-[#6ee7b7]">Reference:</span> {selectedQuote.ref[lang]}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#6ee7b7]/20 flex justify-end">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="rounded-xl bg-gradient-to-r from-[#6ee7b7] to-[#10b981] text-[#021a12] px-6 py-2.5 text-xs font-extrabold shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  Close Reflection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

