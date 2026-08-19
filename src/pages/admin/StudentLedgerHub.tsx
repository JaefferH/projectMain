import { useState, useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { Search, Plus, Edit2, Trash2, CheckCircle, Users, Wallet, BookOpen, Eye, LayoutGrid, ListFilter, Phone, ChevronLeft, ChevronRight, Award, ScrollText, BookCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideModal, { FormField, SubmitBtn } from '../../components/SlideModal';
import StudentDossier from '../../components/StudentDossier';
import type { Student } from '../../lib/sampleData';

const BLANK: Omit<Student, 'id'> = {
  fullName: '', fathersName: '', mothersName: '', phone: '', address: '', registrationNumber: '',
  enrolledCourseIds: [], academicHistory: [], totalFee: 1500, amountPaid: 0, monthlyFees: {}, telegramChatId: '',
};

const SCHOOL_MONTHS = [
  'September', 'October', 'November', 'December',
  'January', 'February', 'March', 'April', 'May', 'June'
];

export default function StudentLedgerHub() {
  const { students, courses, addStudent, updateStudent, deleteStudent, payStudentFee } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'status'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewingDossier, setViewingDossier] = useState<Student | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState(false);

  // Category Filtering
  const filteredByCategory = students.filter(s => {
    if (categoryFilter === 'All') return true;
    if (categoryFilter === 'Hifz Program') return s.enrolledCourseIds.some(id => id.includes('crs_1') || id.includes('crs_2'));
    if (categoryFilter === 'Primary') return s.enrolledCourseIds.some(id => id.includes('crs_3') || id.includes('crs_4'));
    if (categoryFilter === 'Middle School') return s.enrolledCourseIds.some(id => id.includes('crs_5') || id.includes('crs_6'));
    if (categoryFilter === 'High School') return s.enrolledCourseIds.some(id => id.includes('crs_7') || id.includes('crs_8'));
    return true;
  });

  // Search Filtering
  const filtered = filteredByCategory.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || '').includes(searchTerm) ||
    (s.fathersName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
    if (sortBy === 'id') return a.registrationNumber.localeCompare(b.registrationNumber);
    if (sortBy === 'status') return (b.totalFee - b.amountPaid) - (a.totalFee - a.amountPaid);
    return 0;
  });

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginatedStudents = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalFeeCollected = students.reduce((acc, s) => acc + s.amountPaid, 0);
  const fullyPaidCount = students.filter(s => s.amountPaid >= s.totalFee).length;
  const activeClassCount = courses.length;

  const openAdd = () => { setEditing(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (s: Student) => { setEditing(s); setForm({ ...s }); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  // Auto-generate ID when names change
  useEffect(() => {
    if (!editing && form.fullName && form.fathersName) {
      const fNameInit = form.fullName.charAt(0).toUpperCase();
      const fatherInit = form.fathersName.charAt(0).toUpperCase();
      const currentCount = students.length + 1;
      const newId = `S${fNameInit}${fatherInit}${currentCount.toString().padStart(4, '0')}`;
      if (form.registrationNumber !== newId) {
        setForm(prev => ({ ...prev, registrationNumber: newId }));
      }
    }
  }, [form.fullName, form.fathersName, editing, students.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateStudent({ ...form, id: editing.id } as Student);
    } else {
      addStudent({
        ...form,
        id: `stu_${Date.now()}`,
        registrationNumber: form.registrationNumber || `REG-${Date.now()}`,
      } as Student);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 1200);
  };

  const setF = (k: keyof typeof form, v: string | number | string[]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">

      {/* ── 1. Stats Overview Dashboard Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Enrolled Students', value: students.length, sub: 'Active Student Roster', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
          { label: 'Active Classes & Courses', value: activeClassCount, sub: 'Assigned Madrasah Terms', icon: BookOpen, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', border: 'border-[#d4af37]/20' },
          { label: 'Hifz / Quran Progress', value: '18 Juz Avg', sub: 'Tajweed & Memorization', icon: Award, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
          { label: 'Attendance & Fees Rate', value: `${fullyPaidCount} Paid`, sub: `ETB ${totalFeeCollected.toLocaleString()} Collected`, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-5 border ${m.border} flex items-center gap-4`}
            >
              <div className={`p-3 rounded-xl ${m.bg} ${m.color} shrink-0`}><Icon size={22} /></div>
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{m.label}</p>
                <h3 className={`text-2xl font-bold ${m.color} leading-tight mt-0.5`}>{m.value}</h3>
                <p className="text-white/30 text-[11px] mt-0.5">{m.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 2. Scalable Filter & Search Toolbar ── */}
      <div className="glass-card p-5 space-y-4">
        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-white/40 text-xs font-semibold mr-2 shrink-0 flex items-center gap-1">
            <ListFilter size={14} /> Programs:
          </span>
          {['All', 'Hifz Program', 'Primary', 'Middle School', 'High School'].map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? 'bg-[#d4af37] text-[#064e3b] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                  : 'bg-black/30 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search, Sort & View Switcher Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
          {/* Live Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search by student name, ID, parent contact..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-[#d4af37]/25 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Sorting Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="py-2.5 px-4 bg-black/30 border border-[#d4af37]/25 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-xs font-semibold [&>option]:bg-[#06141b]"
            >
              <option value="name">Sort by: Name (A-Z)</option>
              <option value="id">Sort by: Student ID</option>
              <option value="status">Sort by: Tuition Balance</option>
            </select>

            {/* View Switcher Toggle (Grid vs Table) */}
            <div className="flex items-center rounded-xl p-1 bg-black/30 border border-white/15">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-[#d4af37] text-[#064e3b]' : 'text-white/50 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-[#d4af37] text-[#064e3b]' : 'text-white/50 hover:text-white'
                }`}
                title="High-Density Table View"
              >
                <ScrollText size={16} />
              </button>
            </div>

            {/* Register Student Action */}
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:scale-105 transition-all text-xs shrink-0 cursor-pointer"
            >
              <Plus size={16} /> Register Student
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Student Content View (Grid Cards vs High-Density Table) ── */}
      {viewMode === 'grid' ? (
        /* Glassmorphic Student Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedStudents.map((student, idx) => {
            const balance = student.totalFee - student.amountPaid;
            const feeStatus = balance <= 0 ? 'Paid' : student.amountPaid > 0 ? 'Partial' : 'Unpaid';
            const hifzJuz = Math.min(30, Math.max(1, (idx * 5 + 7) % 30));

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                className="glass-card p-6 relative overflow-hidden group border border-[#d4af37]/20 flex flex-col justify-between"
              >
                {/* Top Gold Accent Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10b981] via-[#d4af37] to-[#10b981]" />

                <div>
                  {/* Card Header: Avatar & Badges */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-lg shadow-md shrink-0">
                        {student.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-base leading-tight group-hover:text-[#d4af37] transition-colors">{student.fullName}</h4>
                        <span className="text-xs font-mono text-[#d4af37]">{student.registrationNumber}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      feeStatus === 'Paid' ? 'emerald-badge' : feeStatus === 'Partial' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30' : 'bg-red-400/15 text-red-400 border border-red-400/30'
                    }`}>
                      {feeStatus}
                    </span>
                  </div>

                  {/* Hifz Progress Indicator */}
                  <div className="space-y-1.5 my-4 bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60 font-medium flex items-center gap-1"><Award size={13} className="text-[#d4af37]" /> Hifz Memorization</span>
                      <span className="text-[#d4af37] font-bold">Juz {hifzJuz} / 30</span>
                    </div>
                    <div className="hifz-progress-bar">
                      <div className="hifz-progress-fill" style={{ width: `${(hifzJuz / 30) * 100}%` }} />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-emerald-100/70 mb-4">
                    <p className="flex items-center gap-2"><Phone size={13} className="text-[#d4af37]" /> Parent: <strong className="text-white">{student.fathersName || 'Guardian'}</strong> ({student.phone || 'N/A'})</p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-2">
                  <button
                    onClick={() => setViewingDossier(student)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-[#d4af37] text-white hover:text-[#064e3b] font-bold text-xs transition-all border border-white/10 cursor-pointer"
                  >
                    <Eye size={14} /> Profile
                  </button>
                  <button
                    onClick={() => openEdit(student)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10 cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Are you sure you want to remove this student record?')) deleteStudent(student.id); }}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {paginatedStudents.length === 0 && (
            <div className="col-span-full glass-card p-12 text-center text-white/30 text-sm">
              No students found matching your criteria.
            </div>
          )}
        </div>
      ) : (
        /* High-Density Table View */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#d4af37]/15 bg-black/40 text-[#d4af37] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Student ID</th>
                  <th className="p-4 font-bold">Student Name</th>
                  <th className="p-4 font-bold">Parent Contact</th>
                  <th className="p-4 font-bold">Address</th>
                  <th className="p-4 font-bold text-center">Fee Status</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student, idx) => {
                  const balance = student.totalFee - student.amountPaid;
                  const feeStatus = balance <= 0 ? 'Paid' : student.amountPaid > 0 ? 'Partial' : 'Unpaid';
                  return (
                    <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-xs font-mono text-[#d4af37] font-semibold">{student.registrationNumber}</td>
                      <td className="p-4 font-bold text-white text-sm">
                        <button onClick={() => setViewingDossier(student)} className="hover:text-[#d4af37] transition-colors outline-none text-left">
                          {student.fullName}
                        </button>
                      </td>
                      <td className="p-4 text-xs text-emerald-100/70">{student.fathersName || 'Guardian'} ({student.phone})</td>
                      <td className="p-4 text-xs text-white/50">{student.address || 'Addis Ababa'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          feeStatus === 'Paid' ? 'emerald-badge' : feeStatus === 'Partial' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30' : 'bg-red-400/15 text-red-400 border border-red-400/30'
                        }`}>{feeStatus}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewingDossier(student)} className="p-1.5 text-[#d4af37] hover:bg-[#d4af37]/15 rounded-lg transition-all"><Eye size={15} /></button>
                          <button onClick={() => openEdit(student)} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Edit2 size={15} /></button>
                          <button onClick={() => deleteStudent(student.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── 4. Pagination Controls ── */}
      <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex items-center gap-3 text-white/60">
          <span>Showing {paginatedStudents.length} of {sorted.length} students</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="py-1 px-2 bg-black/30 border border-white/15 rounded-lg text-white text-xs focus:outline-none [&>option]:bg-[#06141b]"
          >
            <option value={6}>6 per page</option>
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="font-bold text-white px-3">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── 5. Add / Edit Student Slide Modal ── */}
      <SlideModal open={modalOpen} onClose={handleClose} title={editing ? 'Edit Student Record' : 'Register New Student'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="First Name *" required value={form.fullName} onChange={e => setF('fullName', e.target.value)} placeholder="e.g. Bilal" />
          <FormField label="Father's Name *" required value={form.fathersName || ''} onChange={e => setF('fathersName', e.target.value)} placeholder="e.g. Ibrahim" />
          <FormField label="Mother's Name *" required value={form.mothersName || ''} onChange={e => setF('mothersName', e.target.value)} placeholder="e.g. Fatima" />
          
          <div className="space-y-1">
            <label className="block text-xs font-bold text-white/80">Registration ID</label>
            <input 
              type="text" 
              value={form.registrationNumber} 
              readOnly
              className="w-full bg-black/40 border border-[#d4af37]/25 rounded-xl px-4 py-2.5 text-[#d4af37] font-mono text-sm focus:outline-none cursor-not-allowed opacity-80" 
              placeholder="Auto-generated" 
            />
          </div>

          <FormField label="Parent / Guardian Contact" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+251 9xx xxx xxx" />
          <FormField label="Address" value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Addis Ababa, Sub-city…" />
          <FormField label="Total Fee (ETB)" type="number" value={form.totalFee} onChange={e => setF('totalFee', Number(e.target.value))} />
          <FormField label="Amount Paid (ETB)" type="number" value={form.amountPaid} onChange={e => setF('amountPaid', Number(e.target.value))} />

          <AnimatePresence>
            {saved && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
                <CheckCircle size={16} /> Student record successfully saved!
              </motion.div>
            )}
          </AnimatePresence>
          <SubmitBtn label={editing ? 'Save Changes' : 'Register Student'} />
        </form>
      </SlideModal>

      <StudentDossier student={viewingDossier} onClose={() => setViewingDossier(null)} />
    </div>
  );
}
