import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { GraduationCap, Award, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const PANEL = 'glass-card';

export default function StudentGrades() {
  const { currentUser } = useAppStore();
  const { students, courses, grades } = useDataStore();

  const student = students.find(s => s.id === currentUser?.id || s.registrationNumber === currentUser?.username) || students[0];
  const myCourses = courses.filter(c => student?.enrolledCourseIds.includes(c.id));

  const getGradeInfo = (total: number) => {
    if (total >= 90) return { label: 'A+', color: 'text-emerald-400', bg: 'bg-emerald-400/15' };
    if (total >= 80) return { label: 'A', color: 'text-emerald-400', bg: 'bg-emerald-400/15' };
    if (total >= 70) return { label: 'B', color: 'text-blue-400', bg: 'bg-blue-400/15' };
    if (total >= 60) return { label: 'C', color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/15' };
    if (total >= 50) return { label: 'D', color: 'text-amber-500', bg: 'bg-amber-500/15' };
    return { label: 'F', color: 'text-red-400', bg: 'bg-red-400/15' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${PANEL} p-6 flex items-center justify-between flex-wrap gap-4`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#d4af37]/10 text-[#d4af37]"><GraduationCap size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-[#d4af37]">My Grades &amp; Assessment Report</h2>
            <p className="text-white/60 text-sm mt-0.5">Official examination scores, quizzes, and Ustadh evaluation</p>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className={`${PANEL} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/15 bg-black/40 text-[#d4af37]">
                <th className="p-4 font-semibold text-sm">Course Name</th>
                <th className="p-4 font-semibold text-sm text-center">Quiz 1 (/15)</th>
                <th className="p-4 font-semibold text-sm text-center">Quiz 2 (/15)</th>
                <th className="p-4 font-semibold text-sm text-center">Mid Exam (/30)</th>
                <th className="p-4 font-semibold text-sm text-center">Final Exam (/40)</th>
                <th className="p-4 font-semibold text-sm text-center">Total Score</th>
                <th className="p-4 font-semibold text-sm text-center">Grade</th>
                <th className="p-4 font-semibold text-sm">Ustadh Comments</th>
              </tr>
            </thead>
            <tbody>
              {myCourses.map((course, idx) => {
                const record = grades.find(g => g.studentId === student?.id && g.courseId === course.id);
                const q1 = record?.scores?.quiz1 ?? 0;
                const q2 = record?.scores?.quiz2 ?? 0;
                const mid = record?.scores?.midExam ?? 0;
                const final = record?.scores?.finalExam ?? 0;
                const total = record?.totalScore ?? (q1 + q2 + mid + final);
                const grade = getGradeInfo(total);

                return (
                  <motion.tr
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                    key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-bold text-white">
                      {course.name}
                      <span className="block text-xs text-[#d4af37] font-normal">{course.id}</span>
                    </td>
                    <td className="p-4 text-center font-semibold text-white">{q1}</td>
                    <td className="p-4 text-center font-semibold text-white">{q2}</td>
                    <td className="p-4 text-center font-semibold text-white">{mid}</td>
                    <td className="p-4 text-center font-semibold text-white">{final}</td>
                    <td className="p-4 text-center font-bold text-white text-base">
                      {total}<span className="text-white/40 text-xs">/100</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${grade.bg} ${grade.color}`}>
                        {grade.label}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-emerald-100/70 italic">
                      {record?.comments || 'Regular progress.'}
                    </td>
                  </motion.tr>
                );
              })}
              {myCourses.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-white/30 text-sm">No grade records available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
