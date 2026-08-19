import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const PANEL = 'glass-card';

export default function StudentTimetable() {
  const { currentUser } = useAppStore();
  const { students, courses, teachers } = useDataStore();

  const student = students.find(s => s.id === currentUser?.id || s.registrationNumber === currentUser?.username) || students[0];
  const myCourses = courses.filter(c => student?.enrolledCourseIds.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${PANEL} p-6 flex items-center justify-between flex-wrap gap-4`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#d4af37]/10 text-[#d4af37]"><Calendar size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-[#d4af37]">My Class Schedule &amp; Timetable</h2>
            <p className="text-white/60 text-sm mt-0.5">Weekly course timetables, rooms, and assigned Ustadhs</p>
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {myCourses.map((course, idx) => {
          const teacher = teachers.find(t => t.id === course.teacherId);
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              key={course.id}
              className={`${PANEL} p-6 relative overflow-hidden group hover:border-[#d4af37]/40 transition-all`}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4af37] to-[#d4af37]/10" />

              <div className="pl-3 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{course.name}</h3>
                    <span className="text-xs font-mono text-[#d4af37] bg-[#d4af37]/15 px-2 py-0.5 rounded font-bold mt-1 inline-block">{course.id}</span>
                  </div>
                  <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded font-semibold">{course.term || 'Semester 1'}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2.5 text-emerald-100">
                    <Clock size={15} className="text-[#d4af37] shrink-0" />
                    <span className="font-semibold">{course.schedule || 'Mon / Wed 4:00 PM'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-emerald-100">
                    <MapPin size={15} className="text-emerald-400 shrink-0" />
                    <span>{course.classroom || 'Main Campus Room 102'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-emerald-100/70 pt-2 border-t border-white/10">
                    <User size={15} className="text-[#d4af37]/60 shrink-0" />
                    <span>Ustadh: <strong className="text-white">{teacher?.fullName || 'Assigned Instructor'}</strong></span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {myCourses.length === 0 && (
          <div className={`col-span-full p-12 text-center text-white/30 text-sm ${PANEL}`}>
            No course timetables available.
          </div>
        )}
      </div>
    </div>
  );
}
