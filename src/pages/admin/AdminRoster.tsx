import { useState, useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Search, Plus, Edit2, Trash2, CheckCircle, ShieldAlert, Shield, Phone, MapPin, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideModal, { FormField, SubmitBtn } from '../../components/SlideModal';
import type { SystemAdmin } from '../../lib/sampleData';

const PANEL = 'glass-card';
const BLANK: Omit<SystemAdmin, 'id'> = {
  nationalId: '', fullName: '', fathersName: '', mothersName: '', phone: '', address: '', email: '', username: '', password: '', role: 'Admin'
};

export default function AdminRoster() {
  const { admins, addAdmin, updateAdmin, deleteAdmin } = useDataStore();
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'admins' | 'roles'>('admins');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemAdmin | null>(null);
  const [viewingProfile, setViewingProfile] = useState<SystemAdmin | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState(false);

  const filteredAdmins = admins.filter(a => 
    a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.nationalId && a.nationalId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAdd = () => { setEditing(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (a: SystemAdmin) => { setEditing(a); setForm({ ...a }); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  // Auto-generate Mudir ID when names change
  useEffect(() => {
    if (!editing && form.fullName && form.fathersName) {
      const fNameInit = form.fullName.charAt(0).toUpperCase();
      const fatherInit = form.fathersName.charAt(0).toUpperCase();
      const currentCount = admins.length + 1;
      const newId = `${fNameInit}${fatherInit}${currentCount.toString().padStart(3, '0')}`;
      if (form.nationalId !== newId) {
        setForm(prev => ({ ...prev, nationalId: newId }));
      }
    }
  }, [form.fullName, form.fathersName, editing, admins.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateAdmin(editing.id, form);
    } else {
      addAdmin({ ...form, id: `adm_${Date.now()}` });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    handleClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${PANEL} p-5 flex items-center justify-between flex-wrap gap-4`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><ShieldAlert size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-red-400">System Administrators Roster</h2>
            <p className="text-white/40 text-sm mt-0.5">Cold registration layer. Manage platform superusers.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-5 py-2.5 rounded-xl font-semibold transition-all border border-red-500/20 shadow-sm">
          <Plus size={18} /> Add Administrator
        </button>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
            <CheckCircle size={16} /> Administrator account successfully {editing ? 'updated' : 'provisioned'}.
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${PANEL} p-0 overflow-hidden`}>
        <div className="p-4 border-b border-white/5">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search administrators…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-[#d4af37]/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/15 bg-black/20">
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Administrator</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Username</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Phone</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Role Security</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin, idx) => (
                <motion.tr
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                  key={admin.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 border border-red-500/30">
                        {admin.fullName.charAt(0)}
                      </div>
                      <button 
                        onClick={() => setViewingProfile(admin)} 
                        className="text-left hover:text-[#d4af37] underline-offset-4 hover:underline transition-all outline-none"
                        title="Open Profile"
                      >
                        {admin.fullName}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-white/70">
                    <div>@{admin.username}</div>
                    <div className="text-emerald-100/50 text-xs">{admin.nationalId}</div>
                  </td>
                  <td className="p-4 text-sm text-emerald-100/70">{admin.phone}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-bold w-fit">
                      <Shield size={12} /> {admin.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(admin)} className="p-2 text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteAdmin(admin.id)} 
                        disabled={admin.id === currentUser?.id || admins.length === 1}
                        className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredAdmins.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-white/30 text-sm">No administrators found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlideModal open={modalOpen} onClose={handleClose} title={editing ? 'Edit Administrator' : 'Provision Administrator'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="First Name *" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="e.g. Yusuf" />
          <FormField label="Father's Name *" required value={form.fathersName} onChange={e => setForm({...form, fathersName: e.target.value})} placeholder="e.g. Ahmad" />
          <FormField label="Mother's Name" value={form.mothersName || ''} onChange={e => setForm({...form, mothersName: e.target.value})} placeholder="e.g. Fatima Ali" />
          
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-white/80">Mudir ID</label>
            <input 
              type="text" 
              value={form.nationalId} 
              readOnly
              className="w-full bg-black/40 border border-[#d4af37]/25 rounded-xl px-4 py-2.5 text-[#d4af37] font-mono focus:outline-none cursor-not-allowed opacity-80" 
              placeholder="Auto-generated" 
            />
          </div>

          <FormField label="Phone" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+251 9xx xxx xxx" />
          <FormField label="Email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="admin@madrasah.edu" />
          <FormField label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Physical Address..." />
          
          <div className="border-t border-white/10 pt-4 mt-2">
            <h4 className="text-sm font-bold text-[#d4af37] mb-4">Authentication Credentials</h4>
            <div className="space-y-4">
              <FormField label="Username *" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="e.g. admin" />
              <FormField label="Password *" type="password" required={!editing} value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} placeholder={editing ? 'Leave blank to keep unchanged' : 'Minimum 6 characters'} />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-white/80">Security Level</label>
            <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between text-red-400">
              <span className="font-semibold flex items-center gap-2"><Shield size={18}/> Role: {form.role}</span>
              <span className="text-xs uppercase tracking-widest opacity-70">Locked</span>
            </div>
          </div>

          <SubmitBtn label={editing ? 'Save Changes' : 'Provision Account'} />
        </form>
      </SlideModal>

      {/* ── Mudir Profile Modal ── */}
      <SlideModal open={!!viewingProfile} onClose={() => setViewingProfile(null)} title="Mudir 360° Profile Card">
        {viewingProfile && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-black/20 p-5 rounded-xl border border-red-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-2xl shrink-0 border border-red-500/40 relative z-10 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                {viewingProfile.fullName.charAt(0)}
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white">{viewingProfile.fullName} {viewingProfile.fathersName}</h3>
                <p className="text-red-400 text-sm font-bold tracking-widest uppercase mt-0.5">{viewingProfile.nationalId}</p>
                <p className="text-emerald-100/60 text-sm">@{viewingProfile.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-[#d4af37] font-semibold text-sm flex items-center gap-2 mb-3"><UserCog size={16}/> Identity Metrics</h4>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Mother's Name</p>
                  <p className="text-white font-medium">{viewingProfile.mothersName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">System Role</p>
                  <p className="text-red-400 font-bold flex items-center gap-1"><ShieldAlert size={14}/> Master Administrator</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-[#d4af37] font-semibold text-sm flex items-center gap-2 mb-3"><Phone size={16}/> Contact Registry</h4>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Phone Number</p>
                  <p className="text-emerald-300 font-medium">{viewingProfile.phone}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Email Address</p>
                  <p className="text-emerald-300 font-medium break-all">{viewingProfile.email || 'N/A'}</p>
                </div>
              </div>

              <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="text-[#d4af37] font-semibold text-sm flex items-center gap-2 mb-3"><MapPin size={16}/> Physical Address</h4>
                <p className="text-white font-medium">{viewingProfile.address || 'No address registered.'}</p>
              </div>
            </div>
          </div>
        )}
      </SlideModal>
    </div>
  );
}
