import { useState, useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import StudentDossier from '../../components/StudentDossier';
import type { Student } from '../../lib/sampleData';
import { GraduationCap, BookCheck, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PANEL = 'glass-card';
const INPUT = 'w-full py-1.5 px-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-center text-white text-sm';

export default function Gradebook() {
  const { currentUser } = useAppStore();
  const { students, courses, grades, updateGrades } = useDataStore();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [viewingDossier, setViewingDossier] = useState<Student | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const myCourses = courses.filter(c => c.teacherId === currentUser?.id);
  const activeCourseId = selectedCourse || (myCourses.length > 0 ? myCourses[0].id : '');
  const classStudents = students.filter(s => s.enrolledCourseIds.includes(activeCourseId));

  // Local grade state keyed by studentId
  const [localGrades, setLocalGrades] = useState<Record<string, {
    quiz1: number | ''; quiz2: number | ''; midExam: number | ''; finalExam: number | ''; comment: string;
  }>>({});

  // Load saved grades whenever course or grades store changes
  useEffect(() => {
    const loaded: typeof localGrades = {};
    classStudents.forEach(s => {
      const existing = grades.find(g => g.studentId === s.id && g.courseId === activeCourseId);
      loaded[s.id] = {
        quiz1: existing?.scores?.quiz1 ?? '',
        quiz2: existing?.scores?.quiz2 ?? '',
        midExam: existing?.scores?.midExam ?? '',
        finalExam: existing?.scores?.finalExam ?? '',
        comment: existing?.comments ?? '',
      };
    });
    setLocalGrades(loaded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourseId, grades.length]);

  const handleScoreChange = (id: string, field: 'quiz1' | 'quiz2' | 'midExam' | 'finalExam', val: string, max: number) => {
    const score = val === '' ? '' : Number(val);
    if (score !== '' && (score < 0 || score > max)) return;
    setLocalGrades(prev => {
      const cur = prev[id] || { quiz1: '', quiz2: '', midExam: '', finalExam: '', comment: '' };
      return { ...prev, [id]: { ...cur, [field]: score } };
    });
  };

  const handleCommentChange = (id: string, comment: string) => {
    setLocalGrades(prev => {
      const cur = prev[id] || { quiz1: '', quiz2: '', midExam: '', finalExam: '', comment: '' };
      return { ...prev, [id]: { ...cur, comment } };
    });
  };

  const calculateTotal = (id: string) => {
    const s = localGrades[id];
    if (!s) return 0;
    return (Number(s.quiz1) || 0) + (Number(s.quiz2) || 0) + (Number(s.midExam) || 0) + (Number(s.finalExam) || 0);
  };

  const getGrade = (total: number) => {
    if (total >= 90) return { label: 'A+', color: 'text-emerald-400' };
    if (total >= 80) return { label: 'A', color: 'text-emerald-400' };
    if (total >= 70) return { label: 'B', color: 'text-blue-400' };
    if (total >= 60) return { label: 'C', color: 'text-[#d4af37]' };
    if (total >= 50) return { label: 'D', color: 'text-amber-500' };
    return { label: 'F', color: 'text-red-400' };
  };

  const handleSave = async () => {
    if (!activeCourseId || classStudents.length === 0) return;
    setSaving(true);
    const records = classStudents.map(s => {
      const g = localGrades[s.id] || { quiz1: 0, quiz2: 0, midExam: 0, finalExam: 0, comment: '' };
      const total = (Number(g.quiz1) || 0) + (Number(g.quiz2) || 0) + (Number(g.midExam) || 0) + (Number(g.finalExam) || 0);
      const existing = grades.find(gr => gr.studentId === s.id && gr.courseId === activeCourseId);
      return {
        id: existing?.id || `grd_${s.id}_${activeCourseId}`,
        studentId: s.id,
        courseId: activeCourseId,
        scores: {
          quiz1: Number(g.quiz1) || 0,
          quiz2: Number(g.quiz2) || 0,
          midExam: Number(g.midExam) || 0,
          finalExam: Number(g.finalExam) || 0,
        },
        totalScore: total,
        comments: g.comment || '',
      };
    });
    await updateGrades(records);
    setSaving(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className={`${PANEL} p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Gradebook</h2>
            <p className="text-white/40 text-xs">Enter marks and save — synced to database</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap w-full md:w-auto">
          <select
            value={activeCourseId}
            onChange={e => setSelectedCourse(e.target.value)}
            className="flex-1 md:w-64 py-2.5 px-4 bg-black/30 border border-[#d4af37]/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm font-medium [&>option]:bg-[#064e3b]"
          >
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {myCourses.length === 0 && <option value="">No courses assigned</option>}
          </select>
          <button
            onClick={handleSave}
            disabled={classStudents.length === 0 || saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] px-6 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            <BookCheck size={16} />
            {saving ? 'Saving...' : 'Save Grades'}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/25 rounded-xl px-5 py-3 text-emerald-400 text-sm font-medium"
          >
            <CheckCircle size={18} />
            Grades for {classStudents.length} students saved successfully to the database!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grades Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className={`${PANEL} p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/15 bg-black/40">
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Student Name</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center w-24">Quiz 1 /15</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center w-24">Quiz 2 /15</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center w-24">Mid /30</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center w-24">Final /40</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center w-20">Total</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center w-16">Grade</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Comments</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student, idx) => {
                const total = calculateTotal(student.id);
                const gradeInfo = getGrade(total);
                return (
                  <motion.tr key={student.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
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
                    <td className="p-3">
                      <input type="number" min="0" max="15" placeholder="0"
                        value={localGrades[student.id]?.quiz1 ?? ''}
                        onChange={e => handleScoreChange(student.id, 'quiz1', e.target.value, 15)}
                        className={INPUT} />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" max="15" placeholder="0"
                        value={localGrades[student.id]?.quiz2 ?? ''}
                        onChange={e => handleScoreChange(student.id, 'quiz2', e.target.value, 15)}
                        className={INPUT} />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" max="30" placeholder="0"
                        value={localGrades[student.id]?.midExam ?? ''}
                        onChange={e => handleScoreChange(student.id, 'midExam', e.target.value, 30)}
                        className={INPUT} />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" max="40" placeholder="0"
                        value={localGrades[student.id]?.finalExam ?? ''}
                        onChange={e => handleScoreChange(student.id, 'finalExam', e.target.value, 40)}
                        className={INPUT} />
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-white text-sm">{total}</span>
                      <span className="text-white/40 text-xs">/100</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-black text-base ${gradeInfo.color}`}>{gradeInfo.label}</span>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="Add comment..."
                        value={localGrades[student.id]?.comment ?? ''}
                        onChange={e => handleCommentChange(student.id, e.target.value)}
                        className="w-full py-1.5 px-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-white text-sm placeholder-white/30"
                      />
                    </td>
                  </motion.tr>
                );
              })}
              {classStudents.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-white/30 text-sm">No students enrolled in this course.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <StudentDossier student={viewingDossier} onClose={() => setViewingDossier(null)} />
    </div>
  );
}
