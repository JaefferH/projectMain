import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppStore, Role } from '../store/useAppStore';
import { t } from '../lib/translations';
import { useDataStore } from '../store/useDataStore';
import ScripturalQuote from '../components/ScripturalQuote';

export default function Authentication() {
  const { setScreen, login, currentLanguage, rtlMode } = useAppStore();
  const { dataLoaded } = useDataStore();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleForgotPassword = async () => {
    if (!username) {
      setError(currentLanguage === 'ar' ? 'الرجاء إدخال اسم المستخدم أولاً.' : currentLanguage === 'am' ? 'እባክዎ መጀመሪያ የተጠቃሚ ስምዎን ያስገቡ።' : 'Please enter your username first.');
      return;
    }
    setIsResetting(true);
    setResetMessage('');
    setError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await axios.post(`${API_URL}/auth/forgot-password`, {
        username,
      });
      setResetMessage(res.data.message || 'Password recovery instructions have been sent to the registered administrator email.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send password recovery email. Check .env config.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!dataLoaded) {
      setError('System is loading data from server, please wait...');
      return;
    }

    const success = login(username, password);
    if (!success) {
      if (selectedRole === 'admin') {
        setError(currentLanguage === 'ar' ? 'بيانات اعتماد المسؤول غير صالحة.'
          : currentLanguage === 'am' ? 'የአስተዳዳሪ መረጃ ልክ አይደለም።'
            : 'Invalid admin credentials.');
      } else {
        setError(currentLanguage === 'ar' ? 'بيانات اعتماد المعلم غير صالحة.'
          : currentLanguage === 'am' ? 'የመምህር መረጃ ልክ አይደለም።'
            : 'Invalid faculty credentials.');
      }
    }
  };

  const renderCard = (role: 'admin' | 'teacher', title: string, subtitle: string, Icon: React.ElementType) => {
    const isSelected = selectedRole === role;

    return (
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all duration-500 h-full w-full ${isSelected
            ? 'border-[#d4af37]/50 shadow-[0_0_50px_rgba(212,175,55,0.15)] bg-black/40 backdrop-blur-2xl'
            : 'border-white/10 shadow-2xl bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-[#d4af37]/30 cursor-pointer group'
          }`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-50"></div>

        {!isSelected ? (
          // UNSELECTED STATE
          <div
            className="p-8 md:p-12 h-full flex flex-col items-center justify-center text-center gap-6"
            onClick={() => {
              setSelectedRole(role);
              setError('');
              setUsername('');
              setPassword('');
            }}
          >
            <div className="w-24 h-24 rounded-full bg-[#064e3b]/50 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-500">
              <Icon size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#d4af37] transition-colors">{title}</h3>
              <p className="text-[#d4af37]/70 text-sm tracking-widest uppercase">{subtitle}</p>
            </div>
          </div>
        ) : (
          // SELECTED STATE (LOGIN FORM)
          <motion.div
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4 }}
            className="p-8 md:p-12 flex flex-col items-center h-full justify-center"
          >
            <div className="w-full flex justify-start mb-6">
              <button
                onClick={() => setSelectedRole(null)}
                className="text-white/50 hover:text-[#d4af37] flex items-center gap-2 transition-colors font-medium"
              >
                {rtlMode ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                {currentLanguage === 'ar' ? 'خلف' : currentLanguage === 'am' ? 'ተመለስ' : 'Back'}
              </button>
            </div>

            <div className="w-20 h-20 rounded-full bg-[#064e3b]/50 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-6 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <Icon size={36} />
            </div>

            <h2 className="text-3xl font-bold text-white mb-2 text-center">{title}</h2>
            <p className="text-[#d4af37]/70 text-sm tracking-widest uppercase mb-10 text-center">{subtitle}</p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  {t('username', currentLanguage)}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/20 border border-[#d4af37]/30 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all"
                  placeholder={t('username', currentLanguage)}
                  dir={rtlMode ? 'rtl' : 'ltr'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  {t('password', currentLanguage)}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-[#d4af37]/30 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-transparent transition-all"
                  placeholder={t('password', currentLanguage)}
                  dir={rtlMode ? 'rtl' : 'ltr'}
                />
                {selectedRole === 'admin' && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isResetting}
                      className="text-sm text-[#d4af37] hover:text-[#e0c25c] transition-colors"
                    >
                      {isResetting ? 'Sending...' : 'Forgot Password?'}
                    </button>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {resetMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-emerald-400 text-sm text-center bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/20 mt-2">
                      {resetMessage}
                    </p>
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-red-400 text-sm text-center bg-red-400/10 p-4 rounded-xl border border-red-400/20 mt-2">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="w-full relative overflow-hidden group bg-gradient-to-r from-[#d4af37] via-[#e0c25c] to-[#d4af37] text-[#064e3b] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                <span className="relative flex items-center justify-center gap-2 text-lg tracking-wide">
                  {t('login', currentLanguage)}
                </span>
              </button>
            </form>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      dir={rtlMode ? 'rtl' : 'ltr'}
      className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden ${rtlMode ? 'font-arabic' : 'font-sans'}`}
    >
      {/* Background with dark overlay */}
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/5877690125452512689_120.jpg")' }}
        />
      </div>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      {/* Radial gold accent glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d4af37]/10 via-transparent to-transparent" />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: rtlMode ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => setScreen('landing')}
        className={`absolute top-8 ${rtlMode ? 'right-8' : 'left-8'} text-[#d4af37] hover:text-[#e0c25c] flex items-center gap-3 z-20 font-medium tracking-wide transition-all hover:scale-105`}
      >
        {rtlMode ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        {currentLanguage === 'ar' ? 'العودة إلى الغلاف الرئيسي' : currentLanguage === 'am' ? 'ወደ ዋናው ገጽ ተመለስ' : 'Back to Main Cover'}
      </motion.button>

      {/* Cards Container */}
      <div className="w-full max-w-6xl z-10 relative flex flex-col gap-6 justify-center items-center min-h-[600px] py-12">

        {/* Scriptural Banner — above the login choice cards */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <ScripturalQuote variant="banner" />
        </motion.div>

        {/* Role cards row */}
        <div className="w-full flex flex-col md:flex-row gap-8 justify-center items-stretch flex-1">
        <AnimatePresence mode="popLayout">
          {(!selectedRole || selectedRole === 'admin') && (
            <motion.div
              layout
              key="admin"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              transition={{ duration: 0.4 }}
              className={`w-full ${selectedRole ? 'max-w-2xl mx-auto' : 'md:w-1/2'}`}
            >
              {renderCard(
                'admin',
                t('adminPortal', currentLanguage),
                currentLanguage === 'ar' ? '(وصول كامل)' : currentLanguage === 'am' ? '(ሙሉ መዳረሻ)' : '(Full Access)',
                Shield
              )}
            </motion.div>
          )}

          {(!selectedRole || selectedRole === 'teacher') && (
            <motion.div
              layout
              key="teacher"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              transition={{ duration: 0.4 }}
              className={`w-full ${selectedRole ? 'max-w-2xl mx-auto' : 'md:w-1/2'}`}
            >
              {renderCard(
                'teacher',
                t('facultyPortal', currentLanguage),
                currentLanguage === 'ar' ? '(وصول مقيد)' : currentLanguage === 'am' ? '(የተገደበ መዳረሻ)' : '(Restricted Access)',
                Users
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

    </motion.div>
  );
}
