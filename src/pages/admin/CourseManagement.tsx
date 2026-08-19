import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { Search, Plus, MapPin, Clock, User, Edit2, Trash2, CheckCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideModal, { FormField, SelectField, SubmitBtn } from '../../components/SlideModal';
import type { Course } from '../../lib/sampleData';

const PANEL = 'glass-card';
const BLANK: Omit<Course, 'id'> = { name: '', schedule: '', classroom: '', teacherId: '', term: 'Summer 2026' };

export default function CourseManagement() {
  const { courses, teachers, addCourse, updateCourse, deleteCourse } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(BLANK);
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState('35');
  const [saved, setSaved] = useState(false);

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code && code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const assignedCourses = courses.filter(c => c.teacherId).length;

  const openAdd = () => { setEditing(null); setForm(BLANK); setCode(''); setCapacity('35'); setModalOpen(true); };
  const openEdit = (c: Course) => { setEditing(c); setForm({ ...c }); setCode(c.id || ''); setCapacity('35'); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateCourse({ ...form, id: code || editing.id } as Course);
    } else {
      addCourse({ ...form, id: code ? code.trim().toUpperCase() : `crs_${Date.now()}` } as Course);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 1200);
  };

  const setField = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Courses', value: courses.length, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10' },
          { label: 'Assigned', value: assignedCourses, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Unassigned', value: courses.length - assignedCourses, color: 'text-red-400', bg: 'bg-red-400/10' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`${PANEL} p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-lg ${m.bg} ${m.color} shrink-0`}><BookOpen size={18} /></div>
            <div>
              <p className="text-white/50 text-xs">{m.label}</p>
              <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className={`${PANEL} p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input type="text" placeholder="Search courses…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-[#d4af37]/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm" />
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:scale-105 transition-all text-sm shrink-0">
          <Plus size={18} /> Add Course
        </button>
      </div>

      {/* ── Course Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((course, idx) => {
          const teacher = teachers.find(t => t.id === course.teacherId);
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(idx * 0.04, 0.4) }} key={course.id}
              className={`${PANEL} relative overflow-hidden p-6 hover:border-[#d4af37]/40 transition-all group`}>
              {/* Gold left accent bar */}
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4af37] to-[#d4af37]/20" />

              <div className="flex justify-between items-start mb-3 pl-3">
                <div>
                  <h3 className="text-base font-bold text-white leading-tight pr-2">{course.name}</h3>
                  <span className="inline-block bg-[#d4af37]/15 text-[#d4af37] px-2 py-0.5 rounded text-xs font-bold mt-1">{course.id}</span>
                  <span className="inline-block bg-blue-400/15 text-blue-400 px-2 py-0.5 rounded text-xs font-bold mt-1 ml-2">{course.term}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(course)} className="p-1.5 text-[#d4af37]/60 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all"><Edit2 size={14} /></button>
                  <button onClick={() => { if (window.confirm('Are you sure you want to remove this course?')) deleteCourse(course.id); }} className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="space-y-2.5 pl-3">
                <div className="flex items-center gap-2.5 text-emerald-100 text-sm">
                  <Clock size={14} className="text-[#d4af37]/60 shrink-0" />
                  <span>{course.schedule || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-emerald-100 text-sm">
                  <MapPin size={14} className="text-[#d4af37]/60 shrink-0" />
                  <span>{course.classroom || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm pt-2 border-t border-white/10">
                  <User size={14} className="text-[#d4af37]/60 shrink-0" />
                  <span className={`font-medium ${teacher ? 'text-white' : 'text-white/30 italic'}`}>
                    {teacher ? teacher.fullName : 'Unassigned'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className={`col-span-full p-12 text-center text-white/30 text-sm ${PANEL}`}>
            No courses found.
          </div>
        )}
      </div>

      {/* ── Slide Modal ── */}
      <SlideModal open={modalOpen} onClose={handleClose} title={editing ? 'Edit Course' : 'Add New Course'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Course Name *" required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Fiqh Al-Ibadat" />
          <FormField label="Course Code" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. FIQH-101" />
          <FormField label="Schedule *" required value={form.schedule} onChange={e => setField('schedule', e.target.value)} placeholder="e.g. Mon/Wed 4:00 PM" />
          <FormField label="Classroom *" required value={form.classroom} onChange={e => setField('classroom', e.target.value)} placeholder="e.g. Room 102" />
          <FormField label="Class Capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="35" />
          <SelectField label="Term *" required value={form.term} onChange={e => setField('term', e.target.value)}>
            {(() => {
              const startYear = 2020;
              const endYear = new Date().getFullYear() + 10;
              const options: React.ReactNode[] = [];
              for (let y = startYear; y <= endYear; y++) {
                options.push(<option key={`sum-${y}`} value={`Summer ${y}`}>Summer {y}</option>);
                options.push(<option key={`win-${y}`} value={`Winter ${y}`}>Winter {y}</option>);
              }
              return options;
            })()}
          </SelectField>
          <SelectField label="Assign Teacher" value={form.teacherId || ''} onChange={e => setField('teacherId', e.target.value)}>
            <option value="">— Unassigned —</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </SelectField>
          <AnimatePresence>
            {saved && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
                <CheckCircle size={16} /> Saved!
              </motion.div>
            )}
          </AnimatePresence>
          <SubmitBtn label={editing ? 'Save Changes' : 'Add Course'} />
        </form>
      </SlideModal>
    </div>
  );
}
