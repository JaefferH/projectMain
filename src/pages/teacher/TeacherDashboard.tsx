import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Users, Calendar, ScrollText, BookOpen, Phone, TrendingUp, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { IslamicQuoteBanner } from '../../components/ArabicDecoration';

export default function TeacherDashboard() {
  const { currentUser } = useAppStore();
  const { teachers, courses, students } = useDataStore();

  const teacher = teachers.find(t => t.id === currentUser?.id);
  const myCourses = courses.filter(c => c.teacherId === teacher?.id);
  const myCourseIds = myCourses.map(c => c.id);
  const myStudents = students.filter(s =>
    s.enrolledCourseIds.some(cId => myCourseIds.includes(cId))
  );

  const stats = [
    {
      label: 'My Enrolled Students',
      value: myStudents.length,
      sub: 'Enrolled in assigned courses',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      label: 'My Assigned Courses',
      value: myCourses.length,
      sub: 'Active teaching timetable',
      icon: BookOpen,
      color: 'text-[#d4af37]',
      bg: 'bg-[#d4af37]/10',
      border: 'border-[#d4af37]/20',
    },
    {
      label: 'Next Upcoming Class',
      value: myCourses[0]?.name || 'N/A',
      sub: myCourses[0]?.schedule || 'No class scheduled',
      icon: Calendar,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Arabic Calligraphy Banner */}
      <IslamicQuoteBanner 
        quote="“طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ”"
        translation="“Seeking knowledge is a duty upon every Muslim.” — Prophet Muhammad (PBUH)"
      />

      {/* ── Teacher Profile Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-7 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-[#d4af37]/20 border-2 border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-3xl shadow-[0_0_24px_rgba(212,175,55,0.2)] shrink-0">
          {teacher?.fullName.charAt(0) ?? 'U'}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">Welcome, {teacher?.fullName ?? 'Ustadh'}</h2>
          <p className="text-emerald-100/70 mt-1">@{teacher?.username} · Employee ID: <span className="font-mono text-[#d4af37] font-semibold">{teacher?.nationalId}</span></p>
          <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start text-xs">
            <div className="flex items-center gap-1.5 text-emerald-100/70">
              <Phone size={14} className="text-[#d4af37]" />
              <span>{teacher?.contact || 'No contact'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-100/70">
              <BookOpen size={14} className="text-[#d4af37]" />
              <span>{myCourses.length} Assigned Course{myCourses.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <TrendingUp size={14} />
              <span>ETB {teacher?.baseSalary?.toLocaleString() ?? '—'}/mo</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
              className={`glass-card border ${s.border} p-6 flex items-center gap-4`}
            >
              <div className={`p-3 rounded-xl ${s.bg} ${s.color} shrink-0`}><Icon size={22} /></div>
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{s.label}</p>
                <h3 className={`text-2xl font-bold ${s.color} leading-tight mt-0.5`}>{s.value}</h3>
                <p className="text-white/30 text-[11px] mt-0.5">{s.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── My Courses Overview ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]"><ScrollText size={18} /></div>
          <h3 className="text-[#d4af37] font-semibold text-base">My Assigned Courses &amp; Classroom Schedule</h3>
        </div>
        {myCourses.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">No courses assigned yet by the admin.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCourses.map((course, idx) => {
              const enrolled = students.filter(s => s.enrolledCourseIds.includes(course.id)).length;
              return (
                <motion.div key={course.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + idx * 0.07 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#d4af37]/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-semibold text-sm">{course.name}</h4>
                    <span className="text-xs text-[#d4af37] bg-[#d4af37]/15 px-2 py-0.5 rounded font-mono font-bold">{course.id}</span>
                  </div>
                  <div className="space-y-2 text-xs text-emerald-100/80">
                    <p className="flex items-center gap-2"><Clock size={13} className="text-[#d4af37]" /> {course.schedule || 'Schedule TBA'}</p>
                    <p className="flex items-center gap-2"><MapPin size={13} className="text-emerald-400" /> {course.classroom || 'Main Campus'}</p>
                    <p className="flex items-center gap-2 text-emerald-400 font-semibold pt-1 border-t border-white/10">
                      <Users size={13} /> {enrolled} Enrolled Students
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
