import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { FileArchive, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PANEL = 'glass-card p-6 border border-emerald-500/30 rounded-2xl';

export default function SemesterClosure() {
  const { courses, closeSemester } = useDataStore();
  const [selectedTerm, setSelectedTerm] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Get unique active terms from courses
  const activeTerms = Array.from(new Set(courses.map(c => c.term).filter(Boolean)));

  const handleProcess = () => {
    if (!selectedTerm) return;
    setStep(2);
    setTimeout(() => {
      closeSemester(selectedTerm);
      setStep(3);
    }, 2500); // Simulate processing time
  };

  const handleReset = () => {
    setStep(1);
    setSelectedTerm('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className={`${PANEL} flex items-center gap-3`}>
        <div className="p-2.5 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30"><FileArchive size={22} /></div>
        <div>
          <h1 className="text-xl font-extrabold text-[#d4af37] gold-title">Semester Closure & Progression Wizard</h1>
          <p className="text-[#047857] dark:text-emerald-200 text-sm mt-0.5 font-medium">Safely archive active grades, attendance, and clear workspaces for the next term.</p>
        </div>
      </div>

      <div className={`${PANEL}`}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="bg-red-500/20 border-2 border-red-500/40 rounded-xl p-5 flex gap-4">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-300 shrink-0" />
                <div className="space-y-2">
                  <h3 className="text-red-700 dark:text-red-200 font-black text-base">Critical Operation Warning</h3>
                  <p className="text-sm text-red-900 dark:text-red-100 font-bold leading-relaxed">
                    Closing a semester will freeze all current marks, fee logs, and attendance records into the students' permanent historical timeline arrays. Active workspace tables for the selected term will be completely cleared to prepare for new enrollments.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[#042c22] dark:text-white font-extrabold text-sm">Select Term to Close</label>
                {activeTerms.length === 0 ? (
                  <p className="text-[#047857] dark:text-emerald-200 text-sm italic font-semibold">No active terms found in the system.</p>
                ) : (
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full bg-white dark:bg-black/40 border border-emerald-300 dark:border-[#d4af37]/30 rounded-xl px-5 py-4 text-[#042c22] dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 [&>option]:bg-white [&>option]:text-[#042c22] dark:[&>option]:bg-[#042f22] dark:[&>option]:text-white"
                  >
                    <option value="">-- Select an active term --</option>
                    {activeTerms.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleProcess}
                  disabled={!selectedTerm}
                  className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg ${
                    !selectedTerm
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-[0.98]'
                  }`}
                >
                  Initiate Closure <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-[#d4af37]/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-[#d4af37] rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[#d4af37]">
                  <FileArchive size={32} />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">Processing Semester Closure...</h3>
                <p className="text-[#d4af37]/70 text-sm animate-pulse">Archiving {selectedTerm} records to permanent dossiers.</p>
              </div>
              <div className="w-64 space-y-2 pt-4">
                <div className="flex justify-between text-xs text-white/50">
                  <span>Archiving Grades</span>
                  <CheckCircle size={14} className="text-emerald-400" />
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>Archiving Attendance</span>
                  <CheckCircle size={14} className="text-emerald-400" />
                </div>
                <div className="flex justify-between text-xs text-[#d4af37]">
                  <span>Clearing Workspaces</span>
                  <span className="w-3.5 h-3.5 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-24 h-24 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.3)] text-emerald-400">
                <CheckCircle size={48} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">Closure Complete</h3>
                <p className="text-emerald-400/80 text-sm max-w-md mx-auto leading-relaxed">
                  The {selectedTerm} semester has been fully closed. All records are safely archived in student dossiers, and active workspaces have been cleared.
                </p>
              </div>
              <div className="pt-8">
                <button
                  onClick={handleReset}
                  className="bg-white/10 hover:bg-white/15 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === 1 && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 text-blue-400 text-sm">
          <Info size={18} className="shrink-0" />
          <p>
            Make sure all teachers have finalized their grades before running this wizard. Once closed, modifications to the semester's data will require direct database access.
          </p>
        </div>
      )}
    </div>
  );
}
