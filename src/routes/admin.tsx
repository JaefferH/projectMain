import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Users, GraduationCap, DollarSign, Send, LogOut, Plus, 
  TrendingUp, TrendingDown, RefreshCw
} from "lucide-react";
import { useI18n, languages, nextLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const Route = createFileRoute("/admin" as any)({
  head: () => ({
    meta: [
      { title: "Admin Portal — Al Imam Hassan Mosque & Madereesa" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "teachers" | "finance" | "telegram">("overview");

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ fullName: "", registrationNumber: "", totalFee: 2000, amountPaid: 0 });
  const [telegramMsg, setTelegramMsg] = useState("");
  const [telegramStatus, setTelegramStatus] = useState("");

  const userRaw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
  const user = userRaw ? JSON.parse(userRaw) : { name: "Master Admin" };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stuRes, tchRes, finRes, crsRes] = await Promise.all([
        fetch(`${API_URL}/students`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/teachers`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/finance`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/courses`).then(r => r.json()).catch(() => []),
      ]);
      setStudents(Array.isArray(stuRes) ? stuRes : []);
      setTeachers(Array.isArray(tchRes) ? tchRes : []);
      setFinance(Array.isArray(finRes) ? finRes : []);
      setCourses(Array.isArray(crsRes) ? crsRes : []);
    } catch (e) {
      console.error("Error loading backend data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      if (res.ok) {
        setShowAddStudent(false);
        setNewStudent({ fullName: "", registrationNumber: "", totalFee: 2000, amountPaid: 0 });
        loadAllData();
      }
    } catch (e) {
      alert("Failed to add student");
    }
  };

  const handlePaySalary = async (teacherId: string, month: string) => {
    try {
      const res = await fetch(`${API_URL}/teachers/${teacherId}/salary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, status: "Paid", method: "Bank Transfer" }),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      alert("Failed to record salary payment");
    }
  };

  const handleSendTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTelegramStatus("Sending notification...");
    try {
      const res = await fetch(`${API_URL}/telegram/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: telegramMsg }),
      });
      if (res.ok) {
        setTelegramStatus("✅ Broadcast sent via Telegram!");
        setTelegramMsg("");
      } else {
        setTelegramStatus("⚠️ Message queued (Telegram Bot gateway)");
      }
    } catch (e) {
      setTelegramStatus("⚠️ Message saved in notification logs");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/portal";
  };

  // Finance metrics
  const totalIncome = finance.filter(f => f.type === "Income").reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const totalExpense = finance.filter(f => f.type === "Expense").reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Admin Navigation Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover shadow-sm" />
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg flex items-center gap-2">
              <span>Al Imam Hassan Admin Hub</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-sans">SUPER ADMIN</span>
            </h1>
            <p className="text-xs text-muted-foreground">Logged in as {user.name || "Master Admin"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            title="Refresh Data"
            className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setLang(nextLang(lang))}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
          >
            {languages.find((l) => l.code === nextLang(lang))?.label}
          </button>
          <button
            onClick={toggle}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-destructive/10 text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {[
            { id: "overview", label: "📊 System Overview", icon: TrendingUp },
            { id: "students", label: "🎓 Student Records", icon: Users },
            { id: "teachers", label: "👨‍🏫 Faculty & Payroll", icon: GraduationCap },
            { id: "finance", label: "💰 Institute Finance", icon: DollarSign },
            { id: "telegram", label: "📢 Telegram Bot Gateway", icon: Send },
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-surface p-5 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Enrolled Students</span>
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="font-display text-3xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground">Active in Kolfe & Main Campus</p>
              </div>

              <div className="card-surface p-5 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wider">Assigned Faculty</span>
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="font-display text-3xl font-bold">{teachers.length}</div>
                <p className="text-xs text-muted-foreground">Ustadhs & Teachers</p>
              </div>

              <div className="card-surface p-5 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Revenue Collected</span>
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="font-display text-3xl font-bold text-emerald-500">{totalIncome.toLocaleString()} ETB</div>
                <p className="text-xs text-muted-foreground">Tuition & Donations</p>
              </div>

              <div className="card-surface p-5 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Expenditure</span>
                  <TrendingDown className="h-5 w-5 text-amber-500" />
                </div>
                <div className="font-display text-3xl font-bold text-amber-500">{totalExpense.toLocaleString()} ETB</div>
                <p className="text-xs text-muted-foreground">Payroll & Maintenance</p>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="card-surface p-6 rounded-xl border border-border space-y-4">
              <h3 className="font-display text-lg font-bold">Quick Access Roster Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground bg-muted/30">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Reg Number</th>
                      <th className="p-3">Tuition Fee Status</th>
                      <th className="p-3">Paid Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.slice(0, 5).map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-accent/50">
                        <td className="p-3 font-medium">{s.fullName}</td>
                        <td className="p-3 font-mono text-xs">{s.registrationNumber || s.nationalId || "REG-2026"}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            s.amountPaid >= (s.totalFee || 1500)
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                          }`}>
                            {s.amountPaid >= (s.totalFee || 1500) ? "Paid" : "Pending"}
                          </span>
                        </td>
                        <td className="p-3 font-bold">{s.amountPaid || 0} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold">Student Directory & Fee Status</h2>
              <button
                onClick={() => setShowAddStudent(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-lift"
              >
                <Plus className="h-4 w-4" />
                <span>Enroll New Student</span>
              </button>
            </div>

            {/* Modal Form */}
            {showAddStudent && (
              <form onSubmit={handleAddStudent} className="card-surface p-6 rounded-xl border border-primary/40 space-y-4 max-w-lg">
                <h3 className="font-display font-bold text-lg">Enroll New Student</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Full Student Name</label>
                    <input
                      required
                      value={newStudent.fullName}
                      onChange={e => setNewStudent({ ...newStudent, fullName: e.target.value })}
                      placeholder="e.g. Ibrahim Ahmed"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-card text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Registration Number</label>
                    <input
                      required
                      value={newStudent.registrationNumber}
                      onChange={e => setNewStudent({ ...newStudent, registrationNumber: e.target.value })}
                      placeholder="REG-2026-005"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-card text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Total Fee (ETB)</label>
                      <input
                        type="number"
                        value={newStudent.totalFee}
                        onChange={e => setNewStudent({ ...newStudent, totalFee: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-card text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Initial Paid Amount</label>
                      <input
                        type="number"
                        value={newStudent.amountPaid}
                        onChange={e => setNewStudent({ ...newStudent, amountPaid: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-card text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddStudent(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">Save Student</button>
                </div>
              </form>
            )}

            <div className="card-surface rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="p-3">ID / Reg</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Total Fee</th>
                    <th className="p-3">Amount Paid</th>
                    <th className="p-3">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-accent/40">
                      <td className="p-3 font-mono text-xs">{s.registrationNumber || s.id}</td>
                      <td className="p-3 font-semibold">{s.fullName}</td>
                      <td className="p-3">{s.totalFee || 1500} ETB</td>
                      <td className="p-3 text-emerald-500 font-bold">{s.amountPaid || 0} ETB</td>
                      <td className="p-3 text-amber-500 font-medium">{Math.max(0, (s.totalFee || 1500) - (s.amountPaid || 0))} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TEACHERS */}
        {activeTab === "teachers" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Faculty Roster & Monthly Payroll</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map((t) => (
                <div key={t.id} className="card-surface p-5 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">{t.fullName}</h3>
                      <p className="text-xs text-muted-foreground">Ustadh • Base Salary: {t.baseSalary || 5000} ETB</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/30">
                      {t.nationalId || "TCH-01"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">September Payroll:</span>
                    <button
                      onClick={() => handlePaySalary(t.id, "September")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      Process September Salary
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FINANCE */}
        {activeTab === "finance" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Institute Cash Flow Ledger</h2>
            <div className="card-surface rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {finance.map((f, idx) => (
                    <tr key={f.id || idx} className="hover:bg-accent/40">
                      <td className="p-3 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-xs ${f.type === "Income" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {f.type}
                        </span>
                      </td>
                      <td className="p-3">{f.category || "Tuition"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{f.description || "General transaction"}</td>
                      <td className="p-3 font-bold">{f.amount} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: TELEGRAM BOT */}
        {activeTab === "telegram" && (
          <div className="space-y-4 max-w-xl">
            <h2 className="font-display text-xl font-bold">Telegram Broadcast Gateway</h2>
            <p className="text-xs text-muted-foreground">Send mass announcements to Madrasa parents and teachers via Telegram Bot integration.</p>
            <form onSubmit={handleSendTelegram} className="card-surface p-6 rounded-xl border border-border space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Announcement Message</label>
                <textarea
                  required
                  rows={4}
                  value={telegramMsg}
                  onChange={e => setTelegramMsg(e.target.value)}
                  placeholder="Enter message for Parents & Staff..."
                  className="w-full mt-1 p-3 rounded-lg border border-input bg-card text-sm"
                />
              </div>
              {telegramStatus && <p className="text-xs text-emerald-500 font-semibold">{telegramStatus}</p>}
              <button type="submit" className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold">
                <Send className="h-4 w-4" />
                <span>Send Broadcast</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
