import { useState } from 'react';
import { MessageSquare, Send, Users, AlertCircle, CalendarClock, Info, CheckCircle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PANEL = 'glass-card';

export default function TelegramHub() {
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [targetType, setTargetType] = useState('all_students');
  const [targetId, setTargetId] = useState('');

  const templates = [
    { id: 'custom', label: 'Custom Message', icon: MessageSquare, text: '' },
    { id: 'attendance', label: 'Attendance Alert', icon: CalendarClock, text: 'As-salamu alaykum [Parent Name], this is an automated alert from Al Imam Hassen Madrasah. Your child [Student Name] was marked absent today.' },
    { id: 'urgent', label: 'Urgent Announcement', icon: AlertCircle, text: 'URGENT: Madrasah classes are cancelled tomorrow due to unforeseen circumstances. We will resume normal schedule next week.' },
    { id: 'general', label: 'General Notice', icon: Info, text: 'As-salamu alaykum, please be reminded that tuition fees for the current month are now due.' },
  ];

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id);
    const tmpl = templates.find(t => t.id === id);
    if (tmpl) setMessage(tmpl.text);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const axios = (await import('axios')).default;
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      await axios.post(`${API_URL}/notifications/send`, {
        targetType,
        targetId: targetType === 'course' ? targetId : undefined,
        message
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setMessage('');
        setSelectedTemplate('custom');
      }, 3000);
    } catch (err) {
      console.error('Failed to dispatch broadcast', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${PANEL} p-5 flex items-center gap-3`}>
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><MessageSquare size={20} /></div>
        <div>
          <h2 className="text-xl font-bold text-[#d4af37]">Parent Telegram Broadcast Hub</h2>
          <p className="text-white/40 text-sm mt-0.5">Configure and dispatch bulk notifications directly to parents' Telegram accounts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Templates & Audience */}
        <div className="space-y-6 lg:col-span-1">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${PANEL} p-5`}>
            <h3 className="text-[#d4af37] font-semibold mb-4 flex items-center gap-2"><Users size={16} /> Target Audience</h3>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="w-full bg-black/40 border border-[#d4af37]/25 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 text-sm [&>option]:bg-[#042f22]">
              <option value="all_students">All Students (Broadcast)</option>
              <option value="all_teachers">All Teachers (Broadcast)</option>
              <option value="course">Specific Course Group</option>
            </select>
            {targetType === 'course' && (
              <div className="mt-3">
                <input type="text" placeholder="Enter Course Name (e.g. Mathematics)" value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full bg-black/40 border border-[#d4af37]/25 rounded-xl px-4 py-2 text-white focus:outline-none text-sm" />
              </div>
            )}
            <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 flex gap-2">
              <Info size={14} className="shrink-0 text-blue-400" />
              <p>Broadcasts will be queued and sent via the secure Telegram API integration. Standard message rates may apply.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className={`${PANEL} p-5`}>
            <h3 className="text-[#d4af37] font-semibold mb-3">Telegram Link Code Generator</h3>
            <p className="text-white/60 text-xs mb-3">Generate code for parents/guardians to connect their Telegram account:</p>
            <button
              onClick={() => {
                const code = `IHM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                alert(`Generated Link Code: ${code}\n\nShare with parent: Send /link ${code} to @MadrasahBot on Telegram.`);
              }}
              className="w-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] font-bold py-2 px-3 rounded-xl hover:bg-[#d4af37]/30 transition-all text-xs cursor-pointer mb-4 flex items-center justify-center gap-1.5"
            >
              <Key size={14} /> Generate New Link Code
            </button>

            <h3 className="text-[#d4af37] font-semibold mb-4">Message Templates</h3>
            <div className="space-y-2">
              {templates.map(t => {
                const Icon = t.icon;
                const active = selectedTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                      active
                        ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]'
                        : 'bg-black/20 border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-[#d4af37]' : 'text-white/40'} />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Composer */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`${PANEL} p-6 h-full flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#d4af37] font-semibold text-lg">Composer</h3>
              <span className="text-xs font-mono text-white/30">{message.length} / 4096 chars</span>
            </div>
            
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message here... Use [Parent Name] or [Student Name] as dynamic placeholders."
              className="w-full flex-1 min-h-[250px] bg-black/40 border border-[#d4af37]/25 rounded-xl p-5 text-white placeholder-white/30
                focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 resize-none text-sm leading-relaxed"
            />

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-white/40 flex flex-wrap gap-2">
                Available tags: 
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">[Parent Name]</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">[Student Name]</span>
              </div>
              
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className={`relative overflow-hidden group flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] shrink-0 ${
                  !message.trim() || sending
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#d4af37] via-[#e0c25c] to-[#d4af37] text-[#064e3b] hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {sending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#064e3b]/30 border-t-[#064e3b] rounded-full animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Dispatch Broadcast
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {sent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl py-3"
                >
                  <CheckCircle size={16} />
                  Messages queued successfully for Telegram dispatch!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
