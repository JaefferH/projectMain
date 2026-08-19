import { useState, useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Search, Plus, CheckCircle, Users, Phone, UserCheck, ShieldCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideModal, { FormField, SubmitBtn } from '../../components/SlideModal';
import StudentDossier from '../../components/StudentDossier';
import type { Student } from '../../lib/sampleData';

const PANEL = 'glass-card';

const BLANK: Omit<Student, 'id'> = {
  fullName: '', fathersName: '', mothersName: '', phone: '', address: '', registrationNumber: '',
  enrolledCourseIds: [], academicHistory: [], totalFee: 1500, amountPaid: 0,
};

export default function StudentRoster() {
  const { currentUser } = useAppStore();
  const { students, courses, addStudent } = useDataStore();
  const [activeTab, setActiveTab] = useState<'students' | 'guardians'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingDossier, setViewingDossier] = useState<Student | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState(false);

  // Only teacher's assigned courses
  const myCourses = courses.filter(c => c.teacherId === currentUser?.id);
  const myCourseIds = myCourses.map(c => c.id);

  const myStudents = students.filter(s => {
    const isEnrolledInMyCourse = s.enrolledCourseIds.some(cId => myCourseIds.includes(cId));
    if (!isEnrolledInMyCourse) return false;
    if (selectedCourse !== 'all' && !s.enrolledCourseIds.includes(selectedCourse)) return false;
    return s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (s.fathersName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (s.mothersName || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleClose = () => { setModalOpen(false); setForm(BLANK); };

  const toggleEnroll = (cId: string) =>
    setForm(prev => ({
      ...prev,
      enrolledCourseIds: prev.enrolledCourseIds.includes(cId)
        ? prev.enrolledCourseIds.filter(id => id !== cId)
        : [...prev.enrolledCourseIds, cId],
    }));

  // Auto-generate ID when names change
  useEffect(() => {
    if (form.fullName && form.fathersName) {
      const fNameInit = form.fullName.charAt(0).toUpperCase();
      const fatherInit = form.fathersName.charAt(0).toUpperCase();
      const currentCount = students.length + 1;
      const newId = `S${fNameInit}${fatherInit}${currentCount.toString().padStart(4, '0')}`;
      if (form.registrationNumber !== newId) {
        setForm(prev => ({ ...prev, registrationNumber: newId }));
      }
    }
  }, [form.fullName, form.fathersName, students.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    let coursesToEnroll = form.enrolledCourseIds.filter(cId => myCourseIds.includes(cId));
    if (coursesToEnroll.length === 0) {
      coursesToEnroll = myCourseIds.length > 0 ? myCourseIds : ['crs_1'];
    }
    addStudent({
      ...form,
      id: `stu_${Date.now()}`,
      registrationNumber: form.registrationNumber || `REG-${Date.now()}`,
      enrolledCourseIds: coursesToEnroll,
    } as Student);
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 1200);
  };

  const setF = (k: keyof typeof form, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'My Students', value: myStudents.length, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'My Courses', value: myCourses.length, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10' },
          { label: 'Guardians Reached', value: myStudents.length, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`${PANEL} p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-lg ${m.bg} ${m.color} shrink-0`}><Users size={18} /></div>
            <div>
              <p className="text-white/50 text-xs">{m.label}</p>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Sub-Module Tabs ── */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#d4af37] text-[#064e3b] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
              : 'bg-black/30 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          <UserCheck size={16} />
          My Class Enrollments
        </button>
        <button
          onClick={() => setActiveTab('guardians')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'guardians'
              ? 'bg-[#d4af37] text-[#064e3b] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
              : 'bg-black/30 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          <ShieldCheck size={16} />
          Parent & Guardian Contacts
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className={`${PANEL} p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}>
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'students' ? 'Search student name or ID...' : 'Search guardian or parent name...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-[#d4af37]/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm"
            />
          </div>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="py-2.5 px-4 bg-black/30 border border-[#d4af37]/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm [&>option]:bg-[#064e3b]"
          >
            <option value="all">All My Courses</option>
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Active Tab View ── */}
      {activeTab === 'students' ? (
        /* Students Table */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className={`${PANEL} p-0 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#d4af37]/15 bg-black/20">
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Student ID</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Student Name</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Enrolled Courses</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Contact</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Fee Status</th>
                </tr>
              </thead>
              <tbody>
                {myStudents.map((student, idx) => {
                  const balance = student.totalFee - student.amountPaid;
                  const status = balance === 0 ? 'Paid' : student.amountPaid > 0 ? 'Partial' : 'Unpaid';
                  const enrolledNames = courses.filter(c => student.enrolledCourseIds.includes(c.id)).map(c => c.name).join(', ');
                  return (
                    <motion.tr key={student.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-emerald-100/70 font-medium">{student.registrationNumber}</td>
                      <td className="p-4 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold text-xs shrink-0">
                            {student.fullName.charAt(0)}
                          </div>
                          <button 
                            onClick={() => setViewingDossier(student)} 
                            className="text-left hover:text-[#d4af37] underline-offset-4 hover:underline transition-all outline-none text-white"
                            title="Open Dossier"
                          >
                            {student.fullName}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-emerald-300/80">{enrolledNames || 'General Madrasah'}</td>
                      <td className="p-4 text-sm text-emerald-100">{student.phone}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          status === 'Paid' ? 'bg-emerald-400/15 text-emerald-400' :
                          status === 'Partial' ? 'bg-amber-400/15 text-amber-400' :
                          'bg-red-400/15 text-red-400'
                        }`}>{status}</span>
                      </td>
                    </motion.tr>
                  );
                })}
                {myStudents.length === 0 && (
                  <tr><td colSpan={5} className="p-10 text-center text-white/30 text-sm">No students found in your courses.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        /* Guardians Table */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className={`${PANEL} p-0 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#d4af37]/15 bg-black/20">
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Guardian / Parent Name</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Relationship</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Linked Student</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm">Emergency Contact</th>
                  <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Telegram Gateway</th>
                </tr>
              </thead>
              <tbody>
                {myStudents.map((student, idx) => (
                  <motion.tr key={`gua_${student.id}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-400/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {(student.fathersName || student.fullName).charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">{student.fathersName || `${student.fullName}'s Father`}</p>
                          <p className="text-white/40 text-xs">{student.address || 'Addis Ababa'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-bold text-[#d4af37]">Father / Guardian</td>
                    <td className="p-4 text-sm text-emerald-100 font-medium">{student.fullName} ({student.registrationNumber})</td>
                    <td className="p-4 text-sm text-emerald-100 flex items-center gap-1.5 mt-2">
                      <Phone size={13} className="text-[#d4af37]" /> {student.phone || '+251 911 000 000'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <MessageSquare size={12} /> Active Linked
                      </span>
                    </td>
                  </motion.tr>
                ))}
                {myStudents.length === 0 && (
                  <tr><td colSpan={5} className="p-10 text-center text-white/30 text-sm">No guardians found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Add Student Modal ── */}
      <SlideModal open={modalOpen} onClose={handleClose} title="Add New Student">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="First Name *" required value={form.fullName} onChange={e => setF('fullName', e.target.value)} placeholder="e.g. Samuel" />
          <FormField label="Father's Name *" required value={form.fathersName || ''} onChange={e => setF('fathersName', e.target.value)} placeholder="e.g. David" />
          <FormField label="Mother's Name *" required value={form.mothersName || ''} onChange={e => setF('mothersName', e.target.value)} placeholder="e.g. Fatima Ali" />
          
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-white/80">Student ID</label>
            <input 
              type="text" 
              value={form.registrationNumber} 
              readOnly
              className="w-full bg-black/40 border border-[#d4af37]/25 rounded-xl px-4 py-2.5 text-[#d4af37] font-mono focus:outline-none cursor-not-allowed opacity-80" 
              placeholder="Auto-generated" 
            />
          </div>

          <FormField label="Phone" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+251 9xx xxx xxx" />
          <FormField label="Address" value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Addis Ababa, Sub-city…" />
          <FormField label="Total Fee (ETB)" type="number" value={form.totalFee} onChange={e => setF('totalFee', Number(e.target.value))} />
          <FormField label="Amount Paid (ETB)" type="number" value={form.amountPaid} onChange={e => setF('amountPaid', Number(e.target.value))} />

          {/* Enroll into MY courses only */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">Enroll in Course (your assigned courses only)</label>
            {myCourses.length === 0 ? (
              <p className="text-white/30 text-xs italic px-3">No courses assigned to you yet.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-[#d4af37]/15 bg-black/20 p-3">
                {myCourses.map(c => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                    <input type="checkbox" checked={form.enrolledCourseIds.includes(c.id)} onChange={() => toggleEnroll(c.id)} className="accent-[#d4af37] w-4 h-4" />
                    <span className="text-sm text-white">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {saved && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
                <CheckCircle size={16} /> Student added and enrolled successfully!
              </motion.div>
            )}
          </AnimatePresence>
          <SubmitBtn label="Add Student" />
        </form>
      </SlideModal>

      <StudentDossier student={viewingDossier} onClose={() => setViewingDossier(null)} />
    </div>
  );
}
