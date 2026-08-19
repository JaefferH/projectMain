import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { Search, Plus, Edit2, Trash2, CheckCircle, Users, FileText, Briefcase, X, Building, HandCoins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideModal, { FormField, SubmitBtn } from '../../components/SlideModal';
import type { Teacher } from '../../lib/sampleData';

const PANEL = 'glass-card';
const BLANK: Omit<Teacher, 'id'> = {
  fullName: '', fathersName: '', contact: '', nationalId: '',
  baseSalary: 4000, assignedCourseIds: [], username: '',
  monthlySalaries: {}, telegramChatId: ''
};

const CALENDAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ── Teacher Daily Attendance Logger ──
// function TeacherAttendanceLogger({ teacher, onClose, onSave }: {
//   teacher: Teacher;
//   onClose: () => void;
//   onSave: (record: TeacherAttendance) => void;
// }) {
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [status, setStatus] = useState<'Present' | 'Absent' | 'Permission'>('Present');

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
//       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
//       <motion.div
//         initial={{ opacity: 0, scale: 0.95, y: 10 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: 0.95, y: 10 }}
//         transition={{ duration: 0.2 }}
//         className="relative bg-[#042f22] border border-[#d4af37]/30 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
//         onClick={e => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-white font-bold">Log Attendance</h3>
//             <p className="text-[#d4af37] text-xs mt-0.5">{teacher.fullName}</p>
//           </div>
//           <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10">
//             <X size={16} />
//           </button>
//         </div>

//         <div className="space-y-4">
//           <div>
//              <label className="block text-white/60 text-xs font-semibold mb-1.5">Select Date</label>
//              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d4af37]/50" />
//           </div>

//           <div>
//              <label className="block text-white/60 text-xs font-semibold mb-1.5">Attendance Status</label>
//              <div className="grid grid-cols-3 gap-2">
//                {['Present', 'Absent', 'Permission'].map((s) => (
//                  <button
//                    key={s}
//                    onClick={() => setStatus(s as any)}
//                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${
//                      status === s 
//                        ? s === 'Present' ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
//                          : s === 'Absent' ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
//                          : 'bg-amber-500 text-white border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
//                        : 'bg-black/30 text-white/50 border-white/10 hover:border-white/30'
//                    }`}
//                  >
//                    {s}
//                  </button>
//                ))}
//              </div>
//           </div>
//         </div>

//         <button
//           onClick={() => {
//             onSave({
//               id: `t_att_${Date.now()}`,
//               teacherId: teacher.id,
//               date,
//               status
//             });
//             onClose();
//           }}
//           className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] font-bold py-2.5 rounded-xl hover:scale-[1.02] transition-all text-sm shadow-lg mt-2"
//         >
//           Save Log
//         </button>
//       </motion.div>
//     </div>
//   );
// }

// ── Teacher Salary Multi-Month Grid ──
function MonthlySalaryGrid({ teacher, onClose, onSave }: {
  teacher: Teacher;
  onClose: () => void;
  onSave: (salaries: NonNullable<Teacher['monthlySalaries']>, newTransactions: Array<{ month: string, amount: number }>) => void;
}) {
  const [salaries, setSalaries] = useState<NonNullable<Teacher['monthlySalaries']>>(
    teacher.monthlySalaries || {}
  );
  const [processingMonth, setProcessingMonth] = useState<string | null>(null);
  const [method, setMethod] = useState<'Cash' | 'Bank Transfer'>('Cash');
  const [revertingMonth, setRevertingMonth] = useState<string | null>(null);

  const toggle = (month: string) => {
    if (salaries[month]?.status === 'Paid') {
      // Reversal Safeguard
      setRevertingMonth(month);
    } else {
      // Start processing payment
      setProcessingMonth(month);
      setMethod('Cash');
    }
  };

  const confirmReversal = () => {
    if (revertingMonth) {
      const newSalaries = { ...salaries };
      delete newSalaries[revertingMonth];
      setSalaries(newSalaries);
      setRevertingMonth(null);
    }
  };

  const confirmPayment = () => {
    if (processingMonth) {
      setSalaries(prev => ({
        ...prev,
        [processingMonth]: {
          status: 'Paid',
          method
        }
      }));
      setProcessingMonth(null);
    }
  };

  const paidCount = Object.keys(salaries).filter(k => salaries[k].status === 'Paid').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[#042f22] border border-[#d4af37]/30 rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Faculty Payroll: {teacher.fullName}</h3>
            <p className="text-[#d4af37] text-xs font-mono">Base Salary: ETB {(teacher.baseSalary || 0).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="bg-black/40 rounded-xl px-4 py-2.5 flex items-center justify-between border border-[#d4af37]/10">
          <span className="text-white/60 text-xs">Annual Payroll Progress</span>
          <span className="text-[#d4af37] font-bold text-sm">{paidCount}/{CALENDAR_MONTHS.length} Disbursed</span>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-3 gap-2 relative">
          {CALENDAR_MONTHS.map(month => {
            const isPaid = salaries[month]?.status === 'Paid';
            return (
              <button
                key={month}
                onClick={() => toggle(month)}
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border transition-all ${
                  isPaid
                    ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/25'
                    : 'bg-black/30 border-white/10 text-white/60 hover:border-[#d4af37]/50 hover:text-[#d4af37]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs">{month.slice(0, 3)}</span>
                  <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${isPaid ? 'bg-emerald-400/20' : 'bg-white/10'}`}>
                    {isPaid ? 'PAID' : 'DUE'}
                  </span>
                </div>
                {isPaid && (
                  <span className="text-[10px] mt-1 opacity-70">
                    {salaries[month].method}
                  </span>
                )}
              </button>
            );
          })}

          {/* Operational Prompt Safeguard */}
          <AnimatePresence>
            {processingMonth && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-10 flex items-center justify-center p-2"
              >
                <div className="absolute inset-0 bg-[#021a12]/95 backdrop-blur-md rounded-xl" />
                <div className="relative w-full bg-[#042f22] border border-[#d4af37]/30 p-5 rounded-xl shadow-2xl space-y-4">
                  <div>
                    <h4 className="text-white font-bold text-sm">Disburse Salary: {processingMonth}</h4>
                    <p className="text-[#d4af37] text-xs mt-0.5">Amount: ETB {(teacher.baseSalary || 0).toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-white/60 text-xs font-semibold">Payment Method</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setMethod('Cash')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border ${
                          method === 'Cash' ? 'bg-[#d4af37] text-[#064e3b] border-[#d4af37]' : 'bg-black/30 text-white/50 border-white/10 hover:border-[#d4af37]/50'
                        }`}
                      >
                        <HandCoins size={14} /> Cash
                      </button>
                      <button
                        onClick={() => setMethod('Bank Transfer')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border ${
                          method === 'Bank Transfer' ? 'bg-[#d4af37] text-[#064e3b] border-[#d4af37]' : 'bg-black/30 text-white/50 border-white/10 hover:border-[#d4af37]/50'
                        }`}
                      >
                        <Building size={14} /> Bank Transfer
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setProcessingMonth(null)}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmPayment}
                      className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                    >
                      Confirm Disbursal
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reversal Safeguard Modal */}
          <AnimatePresence>
            {revertingMonth && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-20 flex items-center justify-center p-2"
              >
                <div className="absolute inset-0 bg-[#021a12]/95 backdrop-blur-md rounded-xl" />
                <div className="relative w-full bg-[#042f22] border border-red-500/50 p-5 rounded-xl shadow-2xl space-y-4 text-center">
                   <h4 className="text-white font-bold">Confirm Reversal</h4>
                   <p className="text-white/60 text-xs">Are you sure you want to remove/revert this issued salary payment for <span className="text-red-400 font-bold">{revertingMonth}</span>?</p>
                   <div className="flex items-center gap-2 pt-2">
                     <button onClick={() => setRevertingMonth(null)} className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors">Cancel</button>
                     <button onClick={confirmReversal} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">Confirm Reversal</button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save */}
        <button
          onClick={() => {
            const oldSalaries = teacher.monthlySalaries || {};
            const newTransactions = Object.keys(salaries)
              .filter(m => salaries[m].status === 'Paid' && oldSalaries[m]?.status !== 'Paid')
              .map(m => ({ month: m, amount: teacher.baseSalary }));
              
            onSave(salaries, newTransactions);
            onClose();
          }}
          className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] font-bold py-2.5 rounded-xl hover:scale-[1.02] transition-all text-sm shadow-lg mt-2"
        >
          Save Payroll Status
        </button>
      </motion.div>
    </div>
  );
}

export default function TeacherLedgerHub() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, paySalary } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [salaryTeacher, setSalaryTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState(false);

  const filtered = teachers.filter(t =>
    t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nationalId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayroll = teachers.reduce((acc, t) => acc + (t.baseSalary || 0), 0);

  const openAdd = () => { setEditing(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (t: Teacher) => { setEditing(t); setForm({ ...t }); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateTeacher({ ...form, id: editing.id } as Teacher);
    } else {
      addTeacher({
        ...form,
        id: `tch_${Date.now()}`,
        username: `teacher_${Date.now()}`,
      } as Teacher);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 1200);
  };

  const handleSaveSalaries = async (salaries: NonNullable<Teacher['monthlySalaries']>, newTransactions: Array<{ month: string, amount: number }>) => {
    if (!salaryTeacher) return;

    // Always persist the full salary map so reversals are saved too
    await updateTeacher({ ...salaryTeacher, monthlySalaries: salaries });

    // Fire atomic paySalary for each newly-paid month (ledger + Telegram handled server-side)
    for (const tx of newTransactions) {
      const monthEntry = salaries[tx.month];
      await paySalary(salaryTeacher.id, tx.month, (monthEntry?.method as 'Cash' | 'Bank Transfer') || 'Cash');
    }
  };


  const setF = (k: keyof typeof form, v: string | number | string[]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Faculty', value: teachers.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Showing', value: filtered.length, icon: Search, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10' },
          { label: 'Avg Salary', value: `ETB ${Math.round(totalPayroll / (teachers.length || 1))}`, icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Total Monthly Base', value: `ETB ${totalPayroll.toLocaleString()}`, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`${PANEL} p-4 flex items-center gap-3`}>
              <div className={`p-2 rounded-lg ${m.bg} ${m.color} shrink-0`}><Icon size={18} /></div>
              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{m.label}</p>
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className={`${PANEL} p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Search faculty ledger..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-[#d4af37]/20 rounded-xl text-white placeholder-white/40
              focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b]
            font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:scale-105 transition-all text-sm shrink-0"
        >
          <Plus size={18} /> Add Faculty Member
        </button>
      </div>

      {/* ── Table ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className={`${PANEL} p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/15 bg-black/40">
                <th className="p-4 text-[#d4af37] font-semibold text-sm">National ID</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Faculty Name</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Contact</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-right">Base Salary</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Payroll Calendar</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher, idx) => {
                const salaries = teacher.monthlySalaries || {};
                const paidCount = Object.values(salaries).filter(v => v.status === 'Paid').length;
                const totalMonths = CALENDAR_MONTHS.length;

                return (
                  <motion.tr
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                    key={teacher.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 text-sm text-emerald-100/70 font-medium">{teacher.nationalId}</td>
                    <td className="p-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold text-xs shrink-0">
                          {teacher.fullName.charAt(0)}
                        </div>
                        <span className="text-left">{teacher.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-emerald-100">{teacher.contact}</td>
                    <td className="p-4 text-sm font-bold text-emerald-400 text-right">ETB {(teacher.baseSalary || 0).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => setSalaryTeacher(teacher)}
                          title="Manage monthly payroll"
                          className="group inline-flex flex-col items-center gap-1 w-full"
                        >
                          <span className={`w-full px-4 py-1.5 rounded-full text-xs font-bold transition-all group-hover:scale-[1.02] border ${
                            paidCount > 0 
                              ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30 group-hover:bg-emerald-400/25' 
                              : 'bg-black/30 text-white/50 border-white/10 group-hover:border-[#d4af37]/50 group-hover:text-[#d4af37]'
                          }`}>
                            Manage Payroll
                          </span>
                          <span className="text-[10px] text-white/40 group-hover:text-[#d4af37] transition-colors font-bold">
                            {paidCount}/{totalMonths} disbursed
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(teacher)} className="p-2 text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => { if (window.confirm(`Are you sure you want to delete ${teacher.fullName}? This action cannot be undone.`)) deleteTeacher(teacher.id); }} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-white/40 text-sm">No faculty members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Slide Modal ── */}
      <SlideModal open={modalOpen} onClose={handleClose} title={editing ? 'Edit Faculty' : 'Add Faculty Member'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Full Name *" required value={form.fullName} onChange={e => setF('fullName', e.target.value)} placeholder="e.g. Ustaz Ali" />
          <FormField label="Father's Name *" required value={form.fathersName} onChange={e => setF('fathersName', e.target.value)} placeholder="e.g. Ahmed" />
          <FormField label="National ID *" required value={form.nationalId} onChange={e => setF('nationalId', e.target.value)} placeholder="e.g. NID-12345" />
          <FormField label="Contact Number" value={form.contact} onChange={e => setF('contact', e.target.value)} placeholder="+251 9xx xxx xxx" />
          <FormField label="Telegram Chat ID (Optional)" value={form.telegramChatId || ''} onChange={e => setF('telegramChatId', e.target.value)} placeholder="e.g. 123456789" />
          <FormField label="Base Salary (ETB)" type="number" value={form.baseSalary} onChange={e => setF('baseSalary', Number(e.target.value))} />

          <AnimatePresence>
            {saved && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
                <CheckCircle size={16} /> Saved successfully!
              </motion.div>
            )}
          </AnimatePresence>
          <SubmitBtn label={editing ? 'Save Changes' : 'Add Faculty'} />
        </form>
      </SlideModal>

      {/* ── Monthly Salary Matrix Popover ── */}
      <AnimatePresence>
        {salaryTeacher && (
          <MonthlySalaryGrid
            teacher={salaryTeacher}
            onClose={() => setSalaryTeacher(null)}
            onSave={handleSaveSalaries}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
