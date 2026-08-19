import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Clock, MapPin, Edit2, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideModal, { FormField, SubmitBtn } from '../../components/SlideModal';
import type { Course } from '../../lib/sampleData';

const PANEL = 'glass-card';

export default function MySchedule() {
  const { currentUser } = useAppStore();
  const { courses, updateCourse } = useDataStore();

  const myCourses = courses.filter(c => c.teacherId === currentUser?.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [schedule, setSchedule] = useState('');
  const [classroom, setClassroom] = useState('');
  const [saved, setSaved] = useState(false);

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setSchedule(course.schedule);
    setClassroom(course.classroom);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    updateCourse({
      ...editingCourse,
      schedule,
      classroom,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className={`${PANEL} p-5`}>
        <h2 className="text-xl font-bold text-[#d4af37]">My Weekly Schedule</h2>
        <p className="text-white/50 text-sm mt-1">Click "Modify" to update the time or location of your courses. Changes are reflected globally.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {myCourses.map((course, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            key={course.id}
            className={`${PANEL} p-6 relative overflow-hidden group hover:border-[#d4af37]/40 transition-all`}
          >
            {/* Gold left bar */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4af37] to-[#d4af37]/10" />

            <div className="pl-3">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">{course.name}</h3>
                  <span className="text-xs text-[#d4af37]/70 mt-0.5 block">{course.id}</span>
                </div>
                <button
                  onClick={() => openEdit(course)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37]/15 text-[#d4af37] hover:bg-[#d4af37]/25 text-xs font-semibold transition-all border border-[#d4af37]/20 shrink-0"
                >
                  <Edit2 size={12} /> Modify
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#d4af37]/10 rounded-lg text-[#d4af37] shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 font-medium">Schedule</p>
                    <p className="font-semibold text-white text-sm">{course.schedule || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-400/10 rounded-lg text-emerald-400 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 font-medium">Location</p>
                    <p className="font-semibold text-emerald-100 text-sm">{course.classroom || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {myCourses.length === 0 && (
          <div className={`col-span-full p-12 text-center text-white/30 text-sm ${PANEL}`}>
            You have no assigned courses at this time.
          </div>
        )}
      </div>

      {/* ── Modify Schedule Modal ── */}
      <SlideModal
        open={modalOpen}
        onClose={handleClose}
        title={`Modify: ${editingCourse?.name ?? ''}`}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white/5 border border-[#d4af37]/15 rounded-xl p-4 mb-2">
            <p className="text-white/40 text-xs mb-1">Editing course</p>
            <p className="text-white font-semibold">{editingCourse?.name}</p>
            <p className="text-[#d4af37]/70 text-xs mt-0.5">{editingCourse?.id}</p>
          </div>

          <FormField
            label="New Schedule *"
            required
            value={schedule}
            onChange={e => setSchedule(e.target.value)}
            placeholder="e.g. Mon/Wed 4:00 PM"
          />
          <FormField
            label="New Classroom *"
            required
            value={classroom}
            onChange={e => setClassroom(e.target.value)}
            placeholder="e.g. Room 103"
          />

          <p className="text-white/40 text-xs flex items-center gap-1.5 pt-1">
            <Info size={14} className="text-[#d4af37] shrink-0" />
            <span>This change will update the course globally — the Admin and other students will see the updated schedule.</span>
          </p>

          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3"
              >
                <CheckCircle size={16} /> Schedule updated globally!
              </motion.div>
            )}
          </AnimatePresence>

          <SubmitBtn label="Save Schedule" />
        </form>
      </SlideModal>
    </div>
  );
}
