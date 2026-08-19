import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../lib/translations';
import * as XLSX from 'xlsx';
import { Users, UserCog, BookOpen, Wallet, Activity, Download, CheckCircle2, XCircle, Clock, TrendingUp, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { IslamicQuoteBanner } from '../../components/ArabicDecoration';

const CARD = 'glass-card p-6';

export default function AdminDashboard() {
  const { students, teachers, courses, attendance, teacherAttendance, transactions } = useDataStore();
  const { currentLanguage } = useAppStore();
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'Present' | 'Absent' | 'Permission'>('all');

  const handleExportAll = () => {
    const confirmText = window.prompt('Are you sure you want to export all data? Type "I am sure" to confirm.');
    if (confirmText?.trim().toLowerCase() !== 'i am sure') {
      alert('Export cancelled.');
      return;
    }

    const wb = XLSX.utils.book_new();

    const flattenStudents = students.map(s => ({
      ID: s.id,
      'Registration Number': s.registrationNumber,
      'Full Name': s.fullName,
      'Father Name': s.fathersName,
      'Mother Name': s.mothersName || '',
      Phone: s.phone,
      Address: s.address,
      'Total Fee': s.totalFee,
      'Amount Paid': s.amountPaid,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flattenStudents), 'Students');

    const flattenTeachers = teachers.map(t => ({
      ID: t.id,
      'National ID': t.nationalId,
      'Full Name': t.fullName,
      Username: t.username,
      'Father Name': t.fathersName,
      'Mother Name': t.mothersName || '',
      Contact: t.contact,
      'Base Salary': t.baseSalary,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flattenTeachers), 'Teachers');

    const flattenCourses = courses.map(c => ({
      ID: c.id,
      Name: c.name,
      Schedule: c.schedule,
      Classroom: c.classroom,
      Term: c.term,
      'Teacher ID': c.teacherId || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flattenCourses), 'Courses');

    const flattenFinance = transactions.map(f => ({
      ID: f.id,
      Date: f.date,
      Type: f.type,
      Category: f.category,
      Amount: f.amount,
      Description: f.description,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flattenFinance), 'Finance Ledger');

    const flattenAttendance = attendance.map(a => ({
      ID: a.id,
      Date: a.date,
      'Student ID': a.studentId,
      'Course ID': a.courseId,
      Status: a.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flattenAttendance), 'Student Attendance');

    const flattenTeacherAttendance = teacherAttendance.map(a => ({
      ID: a.id,
      Date: a.date,
      'Teacher ID': a.teacherId,
      Status: a.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flattenTeacherAttendance), 'Teacher Attendance');

    XLSX.writeFile(wb, `Madrasah_Data_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalFeeDue = students.reduce((acc, s) => acc + s.totalFee, 0);
  const totalFeePaid = students.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalSalaryBudget = teachers.reduce((acc, t) => acc + t.baseSalary, 0);

  const stats = [
    {
      label: t('totalStudents', currentLanguage),
      value: students.length,
      sub: `${students.filter(s => s.amountPaid === s.totalFee).length} fully paid`,
      icon: Users,
      gradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-400/20',
      iconColor: 'text-blue-400',
    },
    {
      label: t('totalTeachers', currentLanguage),
      value: teachers.length,
      sub: `ETB ${totalSalaryBudget.toLocaleString()} payroll`,
      icon: UserCog,
      gradient: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-400/20',
      iconColor: 'text-purple-400',
    },
    {
      label: t('activeCourses', currentLanguage),
      value: courses.length,
      sub: `${courses.filter(c => c.teacherId).length} with teacher`,
      icon: BookOpen,
      gradient: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-400/20',
      iconColor: 'text-[#d4af37]',
    },
    {
      label: t('revenueBalance', currentLanguage),
      value: `ETB ${totalFeePaid.toLocaleString()}`,
      sub: `of ETB ${totalFeeDue.toLocaleString()} due`,
      icon: Wallet,
      gradient: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-400/20',
      iconColor: 'text-emerald-400',
    },
    {
      label: t('attendancePercentage', currentLanguage),
      value: attendance.length > 0
        ? `${Math.round((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100)}%`
        : '—',
      sub: `${attendance.length} records logged`,
      icon: Activity,
      gradient: 'from-rose-500/20 to-rose-600/10',
      border: 'border-rose-400/20',
      iconColor: 'text-rose-400',
    },
  ];

  // Recent attendance for mini audit panel
  const recentAttendance = [...attendance]
    .filter(a => attendanceFilter === 'all' || a.status === attendanceFilter)
    .slice(-20)
    .reverse();

  return (
    <div className="space-y-6">
      {/* ── Islamic Calligraphy Banner & Export Row ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full">
          <IslamicQuoteBanner />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleExportAll}
          className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg text-xs"
        >
          <Download size={16} /> Export All Institute Data
        </button>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              key={index}
              className={`relative overflow-hidden rounded-xl border ${stat.border} p-5 bg-gradient-to-br ${stat.gradient} backdrop-blur-xl`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-white/5 ${stat.iconColor}`}>
                  <Icon size={20} />
                </div>
                <TrendingUp size={14} className="text-white/20 mt-1" />
              </div>
              <p className="text-white/60 text-xs font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <p className="text-white/40 text-xs mt-1">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Student & Teacher Summary Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Student Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className={CARD}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-400/10 text-blue-400"><Users size={18} /></div>
              <h3 className="text-[#d4af37] font-semibold text-base">Student Summary</h3>
            </div>
            <span className="text-white/40 text-xs">{students.length} total</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Active', value: students.length, color: 'text-emerald-400' },
              { label: 'Fully Paid', value: students.filter(s => s.amountPaid >= s.totalFee).length, color: 'text-[#d4af37]' },
              { label: 'Pending', value: students.filter(s => s.amountPaid < s.totalFee).length, color: 'text-red-400' },
            ].map(m => (
              <div key={m.label} className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-white/50 text-xs mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {students.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 hover:bg-white/5 transition-colors rounded px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold text-xs shrink-0">
                    {s.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium leading-none">{s.fullName}</p>
                    <p className="text-white/40 text-xs mt-0.5">{s.registrationNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-white/30" />
                  <span className="text-emerald-100 text-xs">{s.phone}</span>
                </div>
              </div>
            ))}
            {students.length > 4 && (
              <p className="text-white/30 text-xs text-center pt-1">+{students.length - 4} more students</p>
            )}
          </div>
        </motion.div>

        {/* Teacher Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className={CARD}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-400/10 text-purple-400"><UserCog size={18} /></div>
              <h3 className="text-[#d4af37] font-semibold text-base">Teacher Summary</h3>
            </div>
            <span className="text-white/40 text-xs">{teachers.length} total</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Active', value: teachers.length, color: 'text-emerald-400' },
              { label: 'Assigned', value: teachers.filter(t => (t.assignedCourseIds || []).length > 0).length, color: 'text-[#d4af37]' },
              { label: 'Courses', value: courses.length, color: 'text-purple-400' },
            ].map(m => (
              <div key={m.label} className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-white/50 text-xs mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {teachers.slice(0, 4).map(tc => (
              <div key={tc.id} className="flex items-center justify-between py-2 border-b border-white/5 hover:bg-white/5 transition-colors rounded px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-400/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {tc.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium leading-none">{tc.fullName}</p>
                    <p className="text-white/40 text-xs mt-0.5">@{tc.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-white/30" />
                  <span className="text-emerald-100 text-xs">{tc.contact}</span>
                </div>
              </div>
            ))}
            {teachers.length > 4 && (
              <p className="text-white/30 text-xs text-center pt-1">+{teachers.length - 4} more teachers</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Attendance Audit Panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className={CARD}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]"><Activity size={18} /></div>
            <h3 className="text-[#d4af37] font-semibold text-base">Attendance Audit</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'Present', 'Absent', 'Permission'] as const).map(f => (
              <button
                key={f}
                onClick={() => setAttendanceFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  attendanceFilter === f
                    ? 'bg-[#d4af37] text-[#064e3b]'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'All Records' : f}
              </button>
            ))}
          </div>
        </div>

        {attendance.length === 0 ? (
          <div className="py-12 text-center text-white/30 text-sm">
            No attendance records yet. Teachers submit attendance from their portal.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Student</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Course</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Date</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((rec) => {
                  const student = students.find(s => s.id === rec.studentId);
                  const course = courses.find(c => c.id === rec.courseId);
                  return (
                    <tr key={rec.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white text-sm font-medium">{student?.fullName ?? rec.studentId}</td>
                      <td className="p-4 text-emerald-100 text-sm">{course?.name ?? rec.courseId}</td>
                      <td className="p-4 text-emerald-100 text-sm">{rec.date}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit mx-auto ${
                          rec.status === 'Present' ? 'bg-emerald-400/15 text-emerald-400' :
                          rec.status === 'Absent' ? 'bg-red-400/15 text-red-400' :
                          'bg-amber-400/15 text-amber-400'
                        }`}>
                          {rec.status === 'Present' ? <CheckCircle2 size={12} /> : rec.status === 'Absent' ? <XCircle size={12} /> : <Clock size={12} />}
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Recent Enrollments ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className={CARD}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400"><Users size={18} /></div>
          <h3 className="text-[#d4af37] font-semibold text-base">Recent Enrollments</h3>
        </div>
        <div className="space-y-2">
          {students.slice(-6).reverse().map(student => (
            <div key={student.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold text-sm">
                  {student.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{student.fullName}</p>
                  <p className="text-white/40 text-xs">{student.registrationNumber}</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-400/15 text-emerald-400 px-2.5 py-1 rounded-full">New</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
