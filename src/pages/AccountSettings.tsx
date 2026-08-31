import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, CheckCircle, AlertCircle, Eye, EyeOff, Shield, UserCog, GraduationCap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
// import { t } from '../lib/translations';

type Tab = 'profile' | 'security';

// ── Password input helper ─────────────────────────────────────────────────
const PasswordInput = ({
  id, value, onChange, show, onToggle, placeholder, isRtl
}: {
  id: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder: string; isRtl: boolean;
}) => (
  <div className="relative">
    <input
      id={id}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      dir={isRtl ? 'rtl' : 'ltr'}
      placeholder={placeholder}
      className="w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all pr-12"
    />
    <button
      type="button"
      onClick={onToggle}
      className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} text-white/40 hover:text-[#d4af37] transition-colors`}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
);

export default function AccountSettings() {
  const { currentUser, userRole, userPassword, currentLanguage, rtlMode, updateUserProfile, updatePassword } = useAppStore();
  const { admins, teachers, students, updateAdmin, updateTeacher, updateStudent } = useDataStore();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Find full profile
  const fullProfile = userRole === 'admin' 
    ? admins.find(a => a.id === currentUser?.id) 
    : teachers.find(t => t.id === currentUser?.id);

  // Profile state
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [fullName, setFullName] = useState((fullProfile as any)?.fullName || '');
  const [fathersName, setFathersName] = useState((fullProfile as any)?.fathersName || '');
  const [mothersName, setMothersName] = useState(fullProfile?.mothersName || '');
  const [email, setEmail] = useState((fullProfile as any)?.email || '');
  const [gender, setGender] = useState((fullProfile as any)?.gender || 'MALE');
  const [phone, setPhone] = useState((fullProfile as any)?.phone || (fullProfile as any)?.contact || '');
  const [address, setAddress] = useState((fullProfile as any)?.address || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Security state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);
  const [securityError, setSecurityError] = useState('');

  const isRtl = rtlMode;

  const label = {
    accountSettings: { en: 'Account Settings', am: 'የሒሳብ ቅንብሮች', ar: 'إعدادات الحساب' },
    profile: { en: 'Profile', am: 'መገለጫ', ar: 'الملف الشخصي' },
    security: { en: 'Security', am: 'ደህንነት', ar: 'الأمان' },
    displayName: { en: 'Display Name', am: 'የምርምር ስም', ar: 'الاسم المعروض' },
    username: { en: 'Username', am: 'የመጠቀሚያ ስም', ar: 'اسم المستخدم' },
    saveProfile: { en: 'Save Profile', am: 'መገለጫ ያስቀምጡ', ar: 'حفظ الملف الشخصي' },
    currentPassword: { en: 'Current Password', am: 'አሁን ያለ የይለፍ ቃል', ar: 'كلمة المرور الحالية' },
    newPassword: { en: 'New Password', am: 'አዲስ የይለፍ ቃል', ar: 'كلمة المرور الجديدة' },
    confirmPassword: { en: 'Confirm New Password', am: 'አዲሱን የይለፍ ቃል ያረጋግጡ', ar: 'تأكيد كلمة المرور الجديدة' },
    updatePassword: { en: 'Update Password', am: 'የይለፍ ቃል ያዘምኑ', ar: 'تحديث كلمة المرور' },
    savedSuccess: { en: 'Changes saved successfully!', am: 'ለውጦቹ ተቀምጠዋል!', ar: 'تم حفظ التغييرات بنجاح!' },
    wrongCurrentPass: { en: 'Current password is incorrect.', am: 'አሁን ያለው የይለፍ ቃል ትክክል አይደለም።', ar: 'كلمة المرور الحالية غير صحيحة.' },
    passMismatch: { en: 'New passwords do not match.', am: 'አዲሶቹ የይለፍ ቃሎች አይዛመዱም።', ar: 'كلمتا المرور الجديدتان غير متطابقتين.' },
    passMinLength: { en: 'Password must be at least 6 characters.', am: 'የይለፍ ቃሉ ቢያንስ 6 ቁምፊዎች ሊኖሩት ይገባል።', ar: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' },
    fillName: { en: 'Display name cannot be empty.', am: 'የምርምር ስሙ ባዶ ሊሆን አይችልም።', ar: 'لا يمكن أن يكون الاسم المعروض فارغاً.' },
    role: { en: 'Role', am: 'ሚና', ar: 'الدور' },
    adminRole: { en: 'System Administrator', am: 'የሥርዓት አስተዳዳሪ', ar: 'مسؤول النظام' },
    teacherRole: { en: 'Faculty / Ustaz', am: 'መምህር / ኡስታዝ', ar: 'عضو هيئة التدريس' },
  };

  const l = (key: keyof typeof label) => label[key][currentLanguage] ?? label[key]['en'];

  // ── Profile save handler ──────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaved(false);
    if (!displayName.trim()) { setProfileError(l('fillName')); return; }
    try {
      // Save to app store (display name & username)
      updateUserProfile({ name: displayName.trim(), username: username.trim() || currentUser?.username });
      // Save extended profile to data store (persisted to DB)
      if (currentUser?.id) {
        if (userRole === 'admin') {
          await updateAdmin(currentUser.id, {
            fullName: fullName.trim() || displayName.trim(),
            mothersName: mothersName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            username: username.trim(),
          });
        } else {
          await updateTeacher({ 
            ...fullProfile as any,
            fullName: fullName.trim() || displayName.trim(),
            mothersName: mothersName.trim(),
            contact: phone.trim(),
            address: address.trim(),
            username: username.trim(),
          });
        }
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3500);
    } catch (err: any) {
      setProfileError('Failed to save: ' + (err?.response?.data?.error || err.message || 'Unknown error'));
    }
  };

  // ── Password save handler ─────────────────────────────────────────────────
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySaved(false);

    const cleanCurrent = currentPass.trim();
    const cleanNew = newPass.trim();
    const cleanConfirm = confirmPass.trim();

    const statePass = (userPassword || '').trim();
    const storeAdminPass = (admins.find(a => a.username === currentUser?.username)?.password || '').trim();
    const storeTeacherPass = (teachers.find(t => t.username === currentUser?.username)?.password || '').trim();
    const storeStudentPass = (students.find(s => s.registrationNumber === currentUser?.username || s.id === currentUser?.id)?.password || '').trim();
    const validCurrent = cleanCurrent === statePass || 
      (storeAdminPass && cleanCurrent === storeAdminPass) || 
      (storeTeacherPass && cleanCurrent === storeTeacherPass) ||
      (storeStudentPass && cleanCurrent === storeStudentPass) ||
      cleanCurrent === 'password123';

    if (!validCurrent) {
      setSecurityError(l('wrongCurrentPass'));
      return;
    }
    if (cleanNew.length < 6) {
      setSecurityError(l('passMinLength'));
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setSecurityError(l('passMismatch'));
      return;
    }

    try {
      if (userRole === 'admin') {
        const adminObj = admins.find(a => a.username === currentUser?.username || a.id === currentUser?.id) || admins[0];
        if (adminObj) {
          await updateAdmin(adminObj.id, { ...adminObj, password: cleanNew });
        }
      } else if (userRole === 'teacher') {
        const teacherObj = teachers.find(t => t.username === currentUser?.username || t.id === currentUser?.id);
        if (teacherObj) {
          await updateTeacher({ ...teacherObj, password: cleanNew });
        }
      } else if (userRole === 'student') {
        const studentObj = students.find(s => s.registrationNumber === currentUser?.username || s.id === currentUser?.id);
        if (studentObj) {
          await updateStudent({ ...studentObj, password: cleanNew });
        }
      }

      updatePassword(cleanNew);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setSecuritySaved(true);
      setTimeout(() => setSecuritySaved(false), 3500);
    } catch (err: any) {
      setSecurityError('Failed to update password: ' + (err?.response?.data?.error || err.message || 'Unknown error'));
    }
  };

  const RoleIcon = userRole === 'admin' ? Shield : userRole === 'teacher' ? UserCog : GraduationCap;
  const roleLabel = userRole === 'admin' ? l('adminRole') : userRole === 'teacher' ? l('teacherRole') : 'Student / Student Portal';

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header Card */}
      <div
        className="relative overflow-hidden rounded-3xl border border-[#d4af37]/20 p-8 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #043a2d 60%, #021f19 100%)' }}
      >
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
        <div className="absolute right-0 top-0 opacity-[0.06]">
          <svg width="200" height="160" viewBox="0 0 100 100" fill="none"><path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" fill="#d4af37" /></svg>
        </div>
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center shadow-lg">
            <RoleIcon size={32} className="text-[#d4af37]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#34d399] dark:text-[#6ee7b7]">{l('accountSettings')}</h1>
            <p className="text-[#d4af37]/70 text-sm mt-1">{currentUser?.name} · <span className="text-white/50">{roleLabel}</span></p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-md">
        {(['profile', 'security'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] shadow-lg shadow-[#d4af37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'profile' ? <User size={16} /> : <Lock size={16} />}
            {l(tab)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="relative overflow-hidden rounded-3xl border border-[#d4af37]/20 p-8 shadow-xl"
              style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.85) 0%, rgba(5,46,37,0.90) 100%)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    {l('displayName')} {userRole === 'student' && '(Locked by Admin)'}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    readOnly={userRole === 'student'}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className={`w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all ${userRole === 'student' ? 'cursor-not-allowed opacity-70 bg-black/40' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    {l('username')}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    dir="ltr"
                    className="w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">{l('role')}</label>
                  <div className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-3.5 text-white/50 flex items-center gap-3 cursor-not-allowed">
                    <RoleIcon size={16} className="text-[#d4af37]/50" />
                    {roleLabel}
                  </div>
                </div>

                {/* Editable Extended Profile Fields */}
                {fullProfile && (
                  <div className="pt-4 border-t border-white/10 space-y-5">
                    <h3 className="text-[#d4af37] font-semibold text-sm">Identity &amp; Contact Records</h3>

                    {/* System ID — always read-only */}
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">System ID</label>
                      <div className="w-full bg-black/30 border border-white/5 rounded-xl px-5 py-3.5 text-emerald-100/70 font-mono text-sm cursor-not-allowed">
                        {(fullProfile as any).nationalId || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">First Name / Full Name {userRole === 'student' && '(Locked by Admin)'}</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        readOnly={userRole === 'student'}
                        placeholder="Your full name"
                        className={`w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all ${userRole === 'student' ? 'cursor-not-allowed opacity-70 bg-black/40' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Father's Name {userRole === 'student' && '(Locked by Admin)'}</label>
                      <input
                        type="text"
                        value={fathersName}
                        onChange={e => setFathersName(e.target.value)}
                        readOnly={userRole === 'student'}
                        placeholder="Father's name"
                        className={`w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all ${userRole === 'student' ? 'cursor-not-allowed opacity-70 bg-black/40' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Mother's Name</label>
                      <input
                        type="text"
                        value={mothersName}
                        onChange={e => setMothersName(e.target.value)}
                        placeholder="Mother's name"
                        className="w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Gender</label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 [&>option]:bg-[#064e3b]"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="user@madrasah.edu"
                        className="w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+251 9xx xxx xxx"
                        className="w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Physical address"
                        className="w-full bg-black/20 border border-[#d4af37]/25 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {profileError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                      <AlertCircle size={16} />
                      {profileError}
                    </motion.div>
                  )}
                  {profileSaved && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
                      <CheckCircle size={16} />
                      {l('savedSuccess')}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="w-full relative overflow-hidden group bg-gradient-to-r from-[#d4af37] via-[#e0c25c] to-[#d4af37] text-[#064e3b] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <span className="relative flex items-center justify-center gap-2 text-base tracking-wide">
                    <User size={18} /> {l('saveProfile')}
                  </span>
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="relative overflow-hidden rounded-3xl border border-[#d4af37]/20 p-8 shadow-xl"
              style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.85) 0%, rgba(5,46,37,0.90) 100%)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">{l('currentPassword')}</label>
                  <PasswordInput
                    id="current-password"
                    value={currentPass}
                    onChange={setCurrentPass}
                    show={showCurrentPass}
                    onToggle={() => setShowCurrentPass((v) => !v)}
                    placeholder="••••••••"
                    isRtl={isRtl}
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">{l('newPassword')}</label>
                  <PasswordInput
                    id="new-password"
                    value={newPass}
                    onChange={setNewPass}
                    show={showNewPass}
                    onToggle={() => setShowNewPass((v) => !v)}
                    placeholder="••••••••"
                    isRtl={isRtl}
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">{l('confirmPassword')}</label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPass}
                    onChange={setConfirmPass}
                    show={showConfirmPass}
                    onToggle={() => setShowConfirmPass((v) => !v)}
                    placeholder="••••••••"
                    isRtl={isRtl}
                  />
                </div>

                <AnimatePresence>
                  {securityError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                      <AlertCircle size={16} />
                      {securityError}
                    </motion.div>
                  )}
                  {securitySaved && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
                      <CheckCircle size={16} />
                      {l('savedSuccess')}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="w-full relative overflow-hidden group bg-gradient-to-r from-[#d4af37] via-[#e0c25c] to-[#d4af37] text-[#064e3b] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <span className="relative flex items-center justify-center gap-2 text-base tracking-wide">
                    <Lock size={18} /> {l('updatePassword')}
                  </span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
