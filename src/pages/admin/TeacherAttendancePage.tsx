import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { ClipboardCheck, CheckCircle, Users, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TeacherAttendance } from '../../lib/sampleData';

const PANEL = 'glass-card p-5 border border-emerald-500/30 rounded-2xl';

export default function TeacherAttendancePage() {
  const { teachers, teacherAttendance, addTeacherAttendanceBatch } = useDataStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Permission'>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = teachers.filter(t =>
    t.fullName.toLowerCase().includes(filter.toLowerCase()) ||
    t.nationalId.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatus = (teacherId: string): 'Present' | 'Absent' | 'Permission' => {
    // Check local state first, then check DB records
    if (attendance[teacherId]) return attendance[teacherId];
    const saved = teacherAttendance.find(r => r.teacherId === teacherId && r.date === date);
    return saved?.status ?? 'Present';
  };

  const handleStatusChange = (teacherId: string, status: 'Present' | 'Absent' | 'Permission') => {
    setAttendance(prev => ({ ...prev, [teacherId]: status }));
  };

  // Reset local state when date changes so we reload from DB
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setAttendance({});
  };

  const handleSaveAll = async () => {
    if (teachers.length === 0) return;
    setSaving(true);
    const records: TeacherAttendance[] = teachers.map(t => ({
      id: `tatt_${t.id}_${date}`,
      teacherId: t.id,
      date,
      status: getStatus(t.id),
    }));
    await addTeacherAttendanceBatch(records);
    setSaving(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  const presentCount = teachers.filter(t => getStatus(t.id) === 'Present').length;
  const absentCount  = teachers.filter(t => getStatus(t.id) === 'Absent').length;
  const permCount    = teachers.filter(t => getStatus(t.id) === 'Permission').length;

  // Mark all Present / all Absent quickly
  const markAll = (status: 'Present' | 'Absent') => {
    const next: Record<string, 'Present' | 'Absent' | 'Permission'> = {};
    teachers.forEach(t => { next[t.id] = status; });
    setAttendance(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${PANEL} flex items-center gap-3`}>
        <div className="p-2.5 rounded-xl bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40"><ClipboardCheck size={22} /></div>
        <div>
          <h1 className="text-xl font-extrabold text-[#d4af37] gold-title">Teacher Attendance Audit</h1>
          <p className="text-[#047857] dark:text-emerald-200 text-sm mt-0.5 font-medium">Log and track daily teacher attendance — saves to database.</p>
        </div>
      </div>

      {/* Controls */}
      <div className={`${PANEL} flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}>
        <div className="flex gap-3 flex-wrap w-full md:w-auto">
          {/* Search */}
          <input
            type="text"
            placeholder="Search teacher..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="flex-1 md:w-56 py-2.5 px-4 bg-white dark:bg-black/40 border border-emerald-300 dark:border-[#d4af37]/30 rounded-xl text-[#042c22] dark:text-white placeholder-[#047857]/60 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm font-semibold"
          />
          {/* Date picker */}
          <div className="flex items-center gap-2 bg-white dark:bg-black/40 border border-emerald-300 dark:border-[#d4af37]/30 rounded-xl px-3">
            <Calendar size={16} className="text-[#047857] dark:text-[#d4af37] shrink-0" />
            <input
              type="date"
              value={date}
              onChange={e => handleDateChange(e.target.value)}
              className="py-2.5 bg-transparent text-[#042c22] dark:text-white focus:outline-none text-sm font-semibold"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => markAll('Present')}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 text-[#047857] dark:text-emerald-300 border border-emerald-500/40 text-xs font-extrabold hover:bg-emerald-500/30 transition-all">
            All Present
          </button>
          <button onClick={() => markAll('Absent')}
            className="px-4 py-2 rounded-xl bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 text-xs font-extrabold hover:bg-red-500/30 transition-all">
            All Absent
          </button>
          <button
            onClick={handleSaveAll}
            disabled={teachers.length === 0 || saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#10b981] to-[#047857] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm cursor-pointer"
          >
            <ClipboardCheck size={16} />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {teachers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Present', value: presentCount, color: 'text-[#047857] dark:text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
            { label: 'Absent',  value: absentCount,  color: 'text-red-700 dark:text-red-400',     border: 'border-red-500/30',     bg: 'bg-red-500/10' },
            { label: 'Permission', value: permCount, color: 'text-amber-800 dark:text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10' },
          ].map(m => (
            <motion.div key={m.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`${PANEL} border ${m.border} ${m.bg} p-4 text-center`}>
              <p className={`text-2xl font-extrabold ${m.color}`}>{m.value}</p>
              <p className="text-[#047857] dark:text-emerald-200 text-xs font-bold mt-1">{m.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Success Banner */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-5 py-3 text-[#047857] dark:text-emerald-300 text-sm font-bold"
          >
            <CheckCircle size={18} />
            Attendance for {teachers.length} teachers saved successfully for {date}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className={`${PANEL} p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/40 bg-emerald-100/90 dark:bg-[#042c22] text-[#047857] dark:text-[#fef08a] font-black text-sm">
                <th className="p-4 text-[#047857] dark:text-[#fef08a] font-black">Faculty Name</th>
                <th className="p-4 text-[#047857] dark:text-[#fef08a] font-black">National ID</th>
                <th className="p-4 text-[#047857] dark:text-[#fef08a] font-black">Contact</th>
                <th className="p-4 text-[#047857] dark:text-[#fef08a] font-black text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher, idx) => {
                const status = getStatus(teacher.id);
                return (
                  <motion.tr key={teacher.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                    className="border-b border-emerald-500/20 hover:bg-emerald-500/10 transition-colors"
                  >
                    <td className="p-4 font-semibold text-[#042c22] dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold text-xs shrink-0">
                          {teacher.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[#042c22] dark:text-white text-sm font-extrabold">{teacher.fullName}</p>
                          <p className="text-[#047857] dark:text-emerald-200/80 text-xs font-semibold">{teacher.fathersName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#047857] dark:text-emerald-200 font-mono font-bold">{teacher.nationalId}</td>
                    <td className="p-4 text-sm text-emerald-100">{teacher.contact}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {(['Present', 'Absent', 'Permission'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(teacher.id, s)}
                            className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all border ${
                              status === s
                                ? s === 'Present'
                                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                                  : s === 'Absent'
                                  ? 'bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                  : 'bg-amber-500 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-10 text-center text-white/30 text-sm flex flex-col items-center gap-2">
                  <Users size={32} className="text-white/20 mx-auto mb-2" />
                  No teachers found.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
