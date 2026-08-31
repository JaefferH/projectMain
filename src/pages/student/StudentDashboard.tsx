import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { BookOpen, GraduationCap, DollarSign, ShieldCheck, Bell, MessageSquare, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { IslamicQuoteBanner } from '../../components/ArabicDecoration';

const defaultAnnouncements = [
  { id: 'anc_1', title: 'Parent-Teacher Conference', category: 'Academic', content: 'Term assessment review meeting scheduled this Friday after Asr prayer.', date: '2026-09-05' },
  { id: 'anc_2', title: 'Quran Hifz Recitation Contest', category: 'Events', content: 'Annual Tajweed and Hifz recitation competition for all registered students.', date: '2026-09-12' }
];

export default function StudentDashboard() {
  const { currentUser } = useAppStore();
  const { students, courses } = useDataStore();
  const announcements = defaultAnnouncements;

  const student = students.find(s => s.id === currentUser?.id || s.registrationNumber === currentUser?.username || s.fullName.toLowerCase() === currentUser?.name?.toLowerCase());
  const myCourses = courses.filter(c => student?.enrolledCourseIds.includes(c.id));

  const totalFee = student?.totalFee || 1500;
  const amountPaid = student?.amountPaid || 0;
  const balance = totalFee - amountPaid;

  const stats = [
    { label: 'Enrolled Courses', value: myCourses.length, sub: 'Active Madrasah Subjects', icon: BookOpen, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', border: 'border-[#d4af37]/20' },
    { label: 'Attendance Rate', value: '96%', sub: 'Regular Attendance Record', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'Tuition Fee Balance', value: balance <= 0 ? 'Paid' : `ETB ${balance.toLocaleString()}`, sub: `ETB ${amountPaid.toLocaleString()} Paid of ${totalFee.toLocaleString()}`, icon: DollarSign, color: balance <= 0 ? 'text-emerald-400' : 'text-amber-400', bg: balance <= 0 ? 'bg-emerald-400/10' : 'bg-amber-400/10', border: balance <= 0 ? 'border-emerald-400/20' : 'border-amber-400/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Islamic Calligraphy Banner */}
      <IslamicQuoteBanner 
        quote="“رَبِّ زِدْنِي عِلْمًا وَفَهْمًا”"
        translation="“My Lord, increase me in knowledge and true understanding.”"
      />

      {/* Student Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-7 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-[#d4af37]/20 border-2 border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-3xl shadow-[0_0_24px_rgba(212,175,55,0.2)] shrink-0">
          {student?.fullName.charAt(0) ?? 'S'}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">Welcome back, {student?.fullName ?? 'Student'}</h2>
          <p className="text-emerald-100/70 mt-1">Registration ID: <span className="font-mono text-[#d4af37] font-semibold">{student?.registrationNumber}</span> · Student &amp; Guardian Portal</p>
          <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start text-xs text-emerald-100/70">
            <span className="flex items-center gap-1.5"><Phone size={13} className="text-[#d4af37]" /> Father/Guardian: <strong className="text-white">{student?.fathersName || 'Registered'}</strong> ({student?.phone || '+251 911 000 000'})</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-400" /> Address: <strong className="text-white">{student?.address || 'Addis Ababa'}</strong></span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
              className={`glass-card p-6 border ${s.border} flex items-center gap-4`}
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

      {/* Grid: Guardian Info & Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parent & Guardian Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-6 space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-400/10 text-blue-400"><ShieldCheck size={20} /></div>
            <h3 className="text-[#d4af37] font-semibold text-base">Parent &amp; Guardian Profile</h3>
          </div>

          <div className="space-y-3 bg-black/20 border border-white/10 rounded-xl p-4 text-xs text-emerald-100/80">
            <div>
              <p className="text-white/40 uppercase tracking-wider text-[10px]">Father / Primary Guardian</p>
              <p className="text-white font-bold text-sm mt-0.5">{student?.fathersName || `${student?.fullName}'s Father`}</p>
            </div>
            <div>
              <p className="text-white/40 uppercase tracking-wider text-[10px]">Mother's Name</p>
              <p className="text-white font-semibold mt-0.5">{student?.mothersName || 'Registered'}</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5"><Phone size={13} className="text-[#d4af37]" /> {student?.phone || '+251 911 000 000'}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <MessageSquare size={11} /> Telegram Linked
              </span>
            </div>
          </div>
        </motion.div>

        {/* School Notices & Announcements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-6 space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]"><Bell size={20} /></div>
            <h3 className="text-[#d4af37] font-semibold text-base">Madrasah Announcements</h3>
          </div>

          <div className="space-y-3">
            {(announcements || []).map(a => (
              <div key={a.id} className="bg-black/20 border border-white/10 rounded-xl p-4 hover:border-[#d4af37]/30 transition-all">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-white font-bold text-xs">{a.title}</h4>
                  <span className="text-[10px] text-[#d4af37] bg-[#d4af37]/15 px-2 py-0.5 rounded font-semibold">{a.category}</span>
                </div>
                <p className="text-emerald-100/70 text-xs mt-1 leading-relaxed">{a.content}</p>
                <p className="text-white/30 text-[10px] mt-2 font-mono">{a.date}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Registered Courses Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]"><BookOpen size={20} /></div>
          <h3 className="text-[#d4af37] font-semibold text-base">My Enrolled Courses</h3>
        </div>

        {myCourses.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-6">No courses currently enrolled.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.map((c) => (
              <div key={c.id} className="bg-black/20 border border-white/10 rounded-xl p-4 space-y-2 hover:border-[#d4af37]/30 transition-all">
                <div className="flex justify-between items-start">
                  <h4 className="text-white font-bold text-sm">{c.name}</h4>
                  <span className="text-[10px] font-mono text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded">{c.id}</span>
                </div>
                <p className="text-xs text-white/50">{c.description}</p>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px] text-emerald-100/70">
                  <span>Room: {c.classroom}</span>
                  <span className="text-[#d4af37] font-semibold">{c.schedule}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
