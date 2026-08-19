import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { BookCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const PANEL = 'glass-card';

export default function StudentAttendance() {
  const { currentUser } = useAppStore();
  const { students, courses, attendance } = useDataStore();

  const student = students.find(s => s.id === currentUser?.id || s.registrationNumber === currentUser?.username) || students[0];
  const myAttendance = attendance.filter(a => a.studentId === student?.id);

  const presentCount = myAttendance.filter(a => a.status === 'Present').length;
  const absentCount = myAttendance.filter(a => a.status === 'Absent').length;
  const permissionCount = myAttendance.filter(a => a.status === 'Permission').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${PANEL} p-6 flex items-center justify-between flex-wrap gap-4`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-400/10 text-emerald-400"><BookCheck size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-[#d4af37]">My Attendance Register</h2>
            <p className="text-white/60 text-sm mt-0.5">Daily class presence logged by your Ustadhs</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Present Days', value: presentCount, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Absent Days', value: absentCount, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'Permission Days', value: permissionCount, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`${PANEL} p-5 text-center`}
          >
            <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-white/50 text-xs mt-1 font-medium">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Attendance History Table */}
      <div className={`${PANEL} overflow-hidden`}>
        <div className="p-5 border-b border-[#d4af37]/15 bg-black/40">
          <h3 className="text-base font-bold text-[#d4af37]">Recent Class Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/15 bg-black/20 text-[#d4af37]">
                <th className="p-4 font-semibold text-sm">Date</th>
                <th className="p-4 font-semibold text-sm">Course</th>
                <th className="p-4 font-semibold text-sm text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {myAttendance.map((record, idx) => {
                const course = courses.find(c => c.id === record.courseId);
                return (
                  <motion.tr
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                    key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm text-white">{record.date}</td>
                    <td className="p-4 font-semibold text-emerald-100">{course?.name || record.courseId}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        record.status === 'Present' ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30' :
                        record.status === 'Absent' ? 'bg-red-400/15 text-red-400 border border-red-400/30' :
                        'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                      }`}>
                        {record.status === 'Present' && <CheckCircle size={12} />}
                        {record.status === 'Absent' && <XCircle size={12} />}
                        {record.status === 'Permission' && <Clock size={12} />}
                        {record.status}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {myAttendance.length === 0 && (
                <tr><td colSpan={3} className="p-10 text-center text-white/30 text-sm">No attendance logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
