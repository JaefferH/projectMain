import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import StudentDossier from '../../components/StudentDossier';
import type { Student } from '../../lib/sampleData';
import { CheckCircle, BookCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Attendance } from '../../lib/sampleData';

const PANEL = 'glass-card';

export default function AttendanceSystem() {
  const { currentUser } = useAppStore();
  const { students, courses, attendance: dbAttendance, addAttendanceBatch } = useDataStore();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewingDossier, setViewingDossier] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Permission'>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const myCourses = courses.filter(c => c.teacherId === currentUser?.id);
  const activeCourseId = selectedCourse || (myCourses.length > 0 ? myCourses[0].id : '');
  const classStudents = students.filter(s => s.enrolledCourseIds.includes(activeCourseId));

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Permission') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const getStatus = (studentId: string): 'Present' | 'Absent' | 'Permission' => {
    if (attendance[studentId]) return attendance[studentId];
    const saved = dbAttendance.find(r => r.studentId === studentId && r.courseId === activeCourseId && r.date === date);
    return saved?.status ?? 'Present';
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setAttendance({});
  };

  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourse(newCourseId);
    setAttendance({});
  };

  const handleSave = async () => {
    if (!activeCourseId || classStudents.length === 0) return;
    setSaving(true);
    // Use stable IDs: studentId + courseId + date — never creates duplicates on re-save
    const records: Attendance[] = classStudents.map(s => ({
      id: `att_${s.id}_${activeCourseId}_${date}`,
      studentId: s.id,
      courseId: activeCourseId,
      date,
      status: getStatus(s.id),
    }));
    await addAttendanceBatch(records);
    setSaving(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  const presentCount = classStudents.filter(s => getStatus(s.id) === 'Present').length;
  const absentCount = classStudents.filter(s => getStatus(s.id) === 'Absent').length;
  const permissionCount = classStudents.filter(s => getStatus(s.id) === 'Permission').length;

  return (
    <div className="space-y-6">

      {/* ── Controls Bar ── */}
      <div className={`${PANEL} p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}>
        <div className="flex gap-3 flex-wrap w-full md:w-auto">
          <select
            value={activeCourseId}
            onChange={e => handleCourseChange(e.target.value)}
            className="flex-1 md:w-64 py-2.5 px-4 bg-black/30 border border-[#d4af37]/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm font-medium [&>option]:bg-[#064e3b]"
          >
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {myCourses.length === 0 && <option value="">No courses assigned</option>}
          </select>
          <input
            type="date"
            value={date}
            onChange={e => handleDateChange(e.target.value)}
            className="py-2.5 px-4 bg-black/30 border border-[#d4af37]/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={classStudents.length === 0 || saving}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] px-6 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          <BookCheck size={16} /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* ── Summary ── */}
      {classStudents.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Present', value: presentCount, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
            { label: 'Absent', value: absentCount, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
            { label: 'Permission', value: permissionCount, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
          ].map(m => (
            <motion.div key={m.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`${PANEL} border ${m.border} p-4 text-center`}>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-white/50 text-xs mt-1">{m.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Success Banner ── */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/25 rounded-xl px-5 py-3 text-emerald-400 text-sm font-medium"
        >
          <CheckCircle size={18} />
          Attendance for {classStudents.length} students saved successfully and is now visible to the Admin.
        </motion.div>
      )}

      {/* ── Attendance Table ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className={`${PANEL} p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/15 bg-black/20">
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Student Name</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student, idx) => (
                <motion.tr key={student.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold text-xs shrink-0">
                        {student.fullName.charAt(0)}
                      </div>
                      <button 
                        onClick={() => setViewingDossier(student)} 
                        className="text-left hover:text-[#d4af37] underline-offset-4 hover:underline transition-all outline-none"
                      >
                        <p className="text-white text-sm font-semibold">{student.fullName}</p>
                        <p className="text-white/40 text-xs">{student.registrationNumber}</p>
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {(['Present', 'Absent', 'Permission'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.id, status)}
                          className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all border ${
                            getStatus(student.id) === status
                              ? status === 'Present'
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                                : status === 'Absent'
                                ? 'bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                : 'bg-amber-500 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {classStudents.length === 0 && (
                <tr><td colSpan={2} className="p-10 text-center text-white/30 text-sm">No students enrolled in this course.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <StudentDossier student={viewingDossier} onClose={() => setViewingDossier(null)} />
    </div>
  );
}
