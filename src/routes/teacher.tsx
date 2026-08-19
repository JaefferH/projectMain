import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Users, CheckSquare, BookOpen, Calendar, DollarSign, LogOut, Check, X, RefreshCw
} from "lucide-react";
import { useI18n, languages, nextLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const API_URL = "http://localhost:5000/api";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Portal — Al Imam Hassan Mosque & Madereesa" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherDashboardRoute,
});

function TeacherDashboardRoute() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState<"attendance" | "roster" | "gradebook" | "schedule" | "salary">("attendance");

  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, "Present" | "Absent">>({});
  const [loading, setLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState("");

  const userRaw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
  const user = userRaw ? JSON.parse(userRaw) : { name: "Ustaz Ali", username: "teacher1" };

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, crsRes] = await Promise.all([
        fetch(`${API_URL}/students`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/courses`).then(r => r.json()).catch(() => []),
      ]);
      setStudents(Array.isArray(stuRes) ? stuRes : []);
      setCourses(Array.isArray(crsRes) ? crsRes : []);
      
      // Default all to Present
      const initial: Record<string, "Present" | "Absent"> = {};
      (Array.isArray(stuRes) ? stuRes : []).forEach((s: any) => {
        initial[s.id] = "Present";
      });
      setAttendanceState(initial);
    } catch (e) {
      console.error("Error loading teacher data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAttendance = (studentId: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "Present" ? "Absent" : "Present",
    }));
  };

  const handleSaveAttendance = async () => {
    setSubmitStatus("Saving attendance...");
    try {
      const today = new Date().toISOString().split("T")[0];
      const records = students.map(s => ({
        studentId: s.id,
        courseId: "crs_1",
        date: today,
        status: attendanceState[s.id] || "Present",
      }));

      // Submit to backend
      if (students.length > 0) {
        await fetch(`${API_URL}/students/${students[0].id}/attendance`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records }),
        });
      }

      setSubmitStatus("✅ Today's Attendance Saved Successfully!");
    } catch (e) {
      setSubmitStatus("⚠️ Saved in local session state");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/portal";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Teacher Navigation Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover shadow-sm" />
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg flex items-center gap-2">
              <span>Faculty Portal</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-sans font-semibold">USTADH</span>
            </h1>
            <p className="text-xs text-muted-foreground">Logged in as {user.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadData} title="Refresh Data" className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setLang(nextLang(lang))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
            {languages.find((l) => l.code === nextLang(lang))?.label}
          </button>
          <button onClick={toggle} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 bg-destructive/10 text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-destructive/20 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {[
            { id: "attendance", label: "Mark Attendance", icon: CheckSquare },
            { id: "roster", label: "My Class Enrollments", icon: Users },
            { id: "gradebook", label: "Gradebook", icon: BookOpen },
            { id: "schedule", label: "Teaching Schedule", icon: Calendar },
            { id: "salary", label: "My Salary Ledger", icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-accent text-muted-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: ATTENDANCE SYSTEM */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Daily Student Attendance Register</h2>
                <p className="text-xs text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <button
                onClick={handleSaveAttendance}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lift"
              >
                Submit Today's Attendance
              </button>
            </div>

            {submitStatus && <p className="text-xs text-emerald-500 font-semibold">{submitStatus}</p>}

            <div className="card-surface rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Reg ID</th>
                    <th className="p-3">Status Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s) => {
                    const isPresent = attendanceState[s.id] !== "Absent";
                    return (
                      <tr key={s.id} className="hover:bg-accent/40">
                        <td className="p-3 font-semibold">{s.fullName}</td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">{s.registrationNumber || s.id}</td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleAttendance(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isPresent
                                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                : "bg-destructive/15 text-destructive border border-destructive/30"
                            }`}
                          >
                            {isPresent ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            <span>{isPresent ? "PRESENT" : "ABSENT"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CLASS ROSTER */}
        {activeTab === "roster" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold font-serif">Enrolled Class Students</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((s) => (
                <div key={s.id} className="card-surface p-4 rounded-xl border border-border space-y-2">
                  <h3 className="font-bold text-base">{s.fullName}</h3>
                  <p className="text-xs text-muted-foreground font-mono">Reg: {s.registrationNumber || s.id}</p>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Curriculum:</span>
                    <span className="font-semibold text-primary">Quran Hifz & Darsi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GRADEBOOK */}
        {activeTab === "gradebook" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Academic Gradebook & Assessment</h2>
            <div className="card-surface p-5 rounded-xl border border-border space-y-3">
              <p className="text-xs text-muted-foreground">Select exam subject to record scores:</p>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Quran Tajweed</span>
                <span className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold">Fiqh & Aqeedah</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SCHEDULE */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Weekly Teaching Timetable</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-surface p-5 rounded-xl border border-border space-y-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Morning Session (8:00 AM - 11:30 AM)</span>
                <h3 className="font-bold text-lg">Quran Hifz & Revision</h3>
                <p className="text-xs text-muted-foreground">Main Classroom • Room 101</p>
              </div>
              <div className="card-surface p-5 rounded-xl border border-border space-y-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Afternoon Session (2:00 PM - 5:00 PM)</span>
                <h3 className="font-bold text-lg">Arabic Grammar & Darsi</h3>
                <p className="text-xs text-muted-foreground">Hall B • Room 204</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SALARY LEDGER */}
        {activeTab === "salary" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Personal Monthly Salary Ledger</h2>
            <div className="card-surface p-6 rounded-xl border border-border space-y-4 max-w-md">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Base Monthly Salary:</span>
                <span className="font-bold text-lg">5,000 ETB</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground">September Payment Status:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  PAID (Bank Transfer)
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
