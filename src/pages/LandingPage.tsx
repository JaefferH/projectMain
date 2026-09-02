import { motion } from 'framer-motion';
import { Key } from 'lucide-react';
import { useAppStore, Language } from '../store/useAppStore';
import { translations } from '../lib/translations';
import ScripturalQuote from '../components/ScripturalQuote';

const CornerArch = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`absolute w-32 h-32 opacity-40 drop-shadow-lg ${className}`}
  >
    <path 
      d="M100 0H0V100C0 44.7715 44.7715 0 100 0Z" 
      stroke="#10b981"
      strokeWidth="2" 
      fill="url(#emerald-gradient-corner)"
      fillOpacity="0.15"
    />
    <path 
      d="M100 20H20V100C20 55.8172 55.8172 20 100 20Z" 
      stroke="#10b981" 
      strokeWidth="1" 
      strokeDasharray="4 4"
    />
    <defs>
      <linearGradient id="emerald-gradient-corner" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" />
        <stop offset="1" stopColor="#059669" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

const NavigationHeader = () => {
  const { currentLanguage, setLanguage, setScreen } = useAppStore();

  return (
    <header className="relative z-50 w-full max-w-7xl px-6 py-6 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.4)] bg-[#042f22] flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Logo" className="h-full w-full object-cover scale-[1.25]" style={{ clipPath: 'circle(46% at 50% 50%)' }} />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg md:text-xl tracking-wide">Al-Imam Hassen Meddressa</h1>
          <p className="text-[#34d399] text-xs tracking-widest uppercase font-semibold">School Management System</p>
        </div>
      </div>

      {/* Right Controls: Staff Button + Languages */}
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="hidden sm:flex gap-1 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[#10b981]/40 shadow-lg">
          {(['en', 'am', 'ar'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-1.5 rounded-full transition-all font-medium text-xs tracking-wide ${
                currentLanguage === lang 
                  ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.6)]' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {lang === 'en' ? 'EN' : lang === 'am' ? 'አማ' : 'عربي'}
            </button>
          ))}
        </div>

        {/* STAFF PORTAL LOGIN BUTTON */}
        <button
          onClick={() => setScreen('auth')}
          className="group relative px-6 py-2.5 rounded-full overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-105 border border-[#10b981]/60"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857]"></div>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative flex items-center gap-2 text-white font-extrabold text-sm uppercase tracking-wider">
            <span>Staff Portal</span>
            <Key size={14} />
          </span>
        </button>
      </div>
    </header>
  );
};

export default function LandingPage() {
  const { setScreen } = useAppStore();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-between overflow-hidden bg-[#021a12] font-sans selection:bg-[#10b981] selection:text-white">
      
      {/* Background Layer: Institute Photo */}
      <div className="absolute inset-0 z-0 bg-black">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-60"
          style={{ backgroundImage: 'url("/school-building.jpg")' }}
        ></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/65 to-transparent"></div>
      </div>

      {/* Geometric Framing Accents */}
      <CornerArch className="top-0 left-0" />
      <CornerArch className="top-0 right-0 transform scale-x-[-1]" />
      <CornerArch className="bottom-0 left-0 transform scale-y-[-1]" />
      <CornerArch className="bottom-0 right-0 transform scale-x-[-1] scale-y-[-1]" />

      {/* Top Header Navigation */}
      <NavigationHeader />

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center w-full px-6 py-12">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center space-y-16 w-full"
        >
          {/* Titles Stack */}
          <div className="inline-flex flex-col items-center p-8 md:p-12 rounded-3xl bg-[#042f22]/70 backdrop-blur-md border border-[#10b981]/40 shadow-2xl">
            
            {/* Arabic Title */}
            <div className="relative py-8 px-12 border-b border-[#10b981]/30 mb-8">
              <h1 
                className="relative text-5xl md:text-7xl lg:text-8xl font-extrabold font-arabic leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-[#34d399]"
                dir="rtl"
              >
                {translations.title.ar}
              </h1>
            </div>

            {/* Amharic Title */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-white font-serif tracking-wide drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] mb-6">
              {translations.title.am}
            </h2>

            {/* English Title */}
            <h3 className="text-lg md:text-2xl lg:text-3xl text-emerald-100/90 font-light tracking-[0.3em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {translations.title.en}
            </h3>

          </div>

          {/* Scriptural Quotation Engine */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.9 }}
          >
            <ScripturalQuote variant="card" />
          </motion.div>

          {/* Entry Button */}
          <motion.div 
            className="pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            <button
              onClick={() => setScreen('auth')}
              className="group relative px-10 md:px-14 py-5 md:py-6 rounded-full overflow-hidden shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] border border-[#10b981]/60"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#059669] via-[#10b981] to-[#047857]"></div>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
              <span className="relative flex items-center justify-center gap-3 md:gap-5 text-white font-extrabold text-xl md:text-2xl tracking-wider drop-shadow-sm">
                Enter Portal <span className="text-white/40 text-2xl md:text-3xl font-light">|</span> ገፅ <span className="text-white/40 text-2xl md:text-3xl font-light">|</span> ادخل
              </span>
            </button>
          </motion.div>

        </motion.div>
      </main>

      {/* Fixed Immutable Signature Footer */}
      <footer className="relative z-10 w-full text-center pb-8 pt-4 bg-gradient-to-t from-black/60 to-transparent opacity-25 hover:opacity-75 transition-opacity">
        <div className="inline-block text-white/70 text-[10px] leading-relaxed tracking-wider font-light">
          <p><a href="mailto:Jaefferhussein@gmail.com" className="hover:underline font-medium">Jaefferhussein@gmail.com™</a></p>
        </div>
      </footer>
    </div>
  );
}
