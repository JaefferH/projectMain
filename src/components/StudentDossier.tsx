import { FileText, Activity as ActivityIcon, DollarSign } from 'lucide-react';
import SlideModal from './SlideModal';
import { useState } from 'react';
import type { Student } from '../lib/sampleData';

interface StudentDossierProps {
  student: Student | null;
  onClose: () => void;
}

export default function StudentDossier({ student, onClose }: StudentDossierProps) {
  const [dossierTab, setDossierTab] = useState<'marks' | 'attendance' | 'fees'>('marks');

  if (!student) return null;

  return (
    <SlideModal open={!!student} onClose={onClose} title="Student 360° Dossier Card">
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10">
          <div className="w-14 h-14 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold text-xl shrink-0 border border-[#d4af37]/40 shadow-lg">
            {student.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{student.fullName}</h3>
            <p className="text-[#d4af37] text-sm font-medium">{student.registrationNumber}</p>
            {student.mothersName && (
              <p className="text-white/50 text-xs mt-1">Mother: {student.mothersName}</p>
            )}
          </div>
        </div>

        {/* Dossier Tabs */}
        <div className="flex gap-2 p-1.5 bg-black/40 rounded-xl border border-white/10">
          {[
            { id: 'marks', label: 'Marks Ledger', icon: FileText },
            { id: 'attendance', label: 'Attendance', icon: ActivityIcon },
            { id: 'fees', label: 'Fee History', icon: DollarSign }
          ].map(t => {
            const Icon = t.icon;
            const active = dossierTab === t.id;
            return (
              <button key={t.id} onClick={() => setDossierTab(t.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  active ? 'bg-[#d4af37]/10 text-[#d4af37]' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-black/30 border border-[#d4af37]/20 rounded-xl p-5 min-h-[300px]">
          {dossierTab === 'marks' && (
            <div className="space-y-4">
              <h4 className="text-[#d4af37] font-semibold flex items-center gap-2"><FileText size={16}/> Academic Grades History</h4>
              {student.academicHistory.length === 0 ? (
                <p className="text-white/40 text-sm italic">No completed academic history available.</p>
              ) : (
                <div className="space-y-3">
                  {student.academicHistory.map((term, i) => (
                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <p className="font-bold text-emerald-400 mb-2">{term.term} Semester</p>
                      <div className="space-y-2">
                        {term.enrolledCourseIds.map(cId => (
                          <div key={cId} className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                            <span className="text-white/80">{cId}</span>
                            <span className="font-mono text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded">Archived</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {dossierTab === 'attendance' && (
            <div className="space-y-4">
              <h4 className="text-[#d4af37] font-semibold flex items-center gap-2"><ActivityIcon size={16}/> Term-by-Term Attendance</h4>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-white/60 text-sm leading-relaxed text-center">
                  Detailed attendance breakdown spanning {student.academicHistory.length} historical terms and current active courses.
                </p>
                <div className="mt-4 flex justify-center gap-8">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">92%</p>
                    <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Avg Presence</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">3</p>
                    <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Total Absences</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {dossierTab === 'fees' && (
            <div className="space-y-4">
              <h4 className="text-[#d4af37] font-semibold flex items-center gap-2"><DollarSign size={16}/> Financial Ledger</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="text-white/70">Current Total Fee</span>
                  <span className="font-semibold text-white">ETB {student.totalFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="text-white/70">Amount Paid</span>
                  <span className="font-semibold text-emerald-400">ETB {student.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="text-white/70">Remaining Balance</span>
                  <span className="font-bold text-red-400">ETB {(student.totalFee - student.amountPaid).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SlideModal>
  );
}
