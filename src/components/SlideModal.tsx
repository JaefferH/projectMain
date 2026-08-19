import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SlideModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Luxury slide-over modal panel.
 * Slides in from the right. Backdrop closes on click.
 * Heavy dark fill (bg-[#042f22]/95) prevents background bleed-through.
 */
export default function SlideModal({ open, onClose, title, children }: SlideModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col shadow-2xl border-l border-[#d4af37]/30"
            style={{
              background: 'linear-gradient(160deg, #042f22 0%, #031e16 60%, #020f0a 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Top gold shimmer line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/80 to-transparent shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#d4af37]/15 shrink-0">
              <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/50 hover:text-[#d4af37] hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Shared form field components ──────────────────────────────────────────────

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export function FormField({ label, ...props }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/80">{label}</label>
      <input
        {...props}
        className="w-full bg-black/40 border border-[#d4af37]/25 rounded-xl px-4 py-3 text-white placeholder-white/30
          focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 focus:border-transparent transition-all text-sm
          hover:border-[#d4af37]/40"
      />
    </div>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}
export function SelectField({ label, children, ...props }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/80">{label}</label>
      <select
        {...props}
        className="w-full bg-black/40 border border-[#d4af37]/25 rounded-xl px-4 py-3 text-white
          focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 focus:border-transparent transition-all text-sm
          hover:border-[#d4af37]/40 [&>option]:bg-[#042f22] [&>option]:text-white"
      >
        {children}
      </select>
    </div>
  );
}

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}
export function TextareaField({ label, ...props }: TextareaFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white/80">{label}</label>
      <textarea
        {...props}
        className="w-full bg-black/40 border border-[#d4af37]/25 rounded-xl px-4 py-3 text-white placeholder-white/30
          focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 focus:border-transparent transition-all text-sm
          hover:border-[#d4af37]/40 resize-none"
      />
    </div>
  );
}

interface SubmitBtnProps {
  label: string;
  onClick?: () => void;
}
export function SubmitBtn({ label, onClick }: SubmitBtnProps) {
  return (
    <button
      type="submit"
      onClick={onClick}
      className="w-full relative overflow-hidden group bg-gradient-to-r from-[#d4af37] via-[#e0c25c] to-[#d4af37]
        text-[#064e3b] font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.35)]
        transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
      <span className="relative">{label}</span>
    </button>
  );
}
