import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Landmark, ArrowUpRight, ArrowDownRight, Search, Activity, Plus, CheckCircle, Edit2, Trash2,
  FileText, DollarSign, Wallet, PieChart
} from 'lucide-react';
import SlideModal, { FormField, SelectField, SubmitBtn } from '../../components/SlideModal';
import type { FinancialTransaction } from '../../lib/sampleData';

const PANEL = 'glass-card';
const BLANK = { category: '', description: '', type: 'Income' as 'Income' | 'Outcome', amount: 0, date: '' };

type TabType = 'all' | 'invoices' | 'payroll' | 'revenues' | 'expenses';

export default function InstituteFinanceTracker() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useDataStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Open modal for ADD ──
  const handleOpenAdd = () => {
    setEditing(null);
    setForm({ ...BLANK, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  // ── Open modal for EDIT ──
  const handleOpenEdit = (tx: FinancialTransaction) => {
    setEditing(tx);
    setForm({
      category: tx.category,
      description: tx.description,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
    });
    setModalOpen(true);
  };

  const handleClose = () => { setModalOpen(false); setEditing(null); };

  // ── Save (Add or Update) ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, {
          category: form.category,
          description: form.description,
          type: form.type,
          amount: Number(form.amount),
          date: form.date,
        });
      } else {
        await addTransaction({
          id: `tx_${Date.now()}`,
          category: form.category,
          description: form.description,
          type: form.type,
          amount: Number(form.amount),
          date: form.date,
        });
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); handleClose(); }, 1200);
    } catch (err: any) {
      alert(`Failed to save: ${err?.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  // ── Delete ──
  const handleDelete = async (tx: FinancialTransaction) => {
    if (!window.confirm(`Delete this "${tx.category}" transaction?`)) return;
    try {
      await deleteTransaction(tx.id);
    } catch (err: any) {
      alert(`Failed to delete: ${err?.response?.data?.error || err.message}`);
    }
  };

  const setField = (k: keyof typeof form, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const safe = transactions || [];

  // Filter transactions by sub-module tabs & search query
  const filteredByTab = safe.filter(t => {
    if (activeTab === 'invoices') return t.category.toLowerCase().includes('fee') || t.category.toLowerCase().includes('tuition');
    if (activeTab === 'payroll') return t.category.toLowerCase().includes('salary') || t.category.toLowerCase().includes('payroll');
    if (activeTab === 'revenues') return t.type === 'Income';
    if (activeTab === 'expenses') return t.type === 'Outcome';
    return true;
  });

  const filtered = filteredByTab.filter(t =>
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncome  = safe.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const totalOutcome = safe.filter(t => t.type === 'Outcome').reduce((s, t) => s + t.amount, 0);
  const netCashFlow  = totalIncome - totalOutcome;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className={`${PANEL} p-5 flex items-center justify-between flex-wrap gap-4`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]"><Landmark size={22} /></div>
          <div>
            <h2 className="text-xl font-bold text-[#d4af37]">Institute Finance & Ledger</h2>
            <p className="text-white/60 text-sm mt-0.5">Central master ledger — Invoices, Payroll, Revenues and Expenses</p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:scale-105 transition-all text-sm shrink-0"
        >
          <Plus size={18} /> Add Entry
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue & Fees', value: `ETB ${totalIncome.toLocaleString()}`, color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: ArrowUpRight },
          { label: 'Total Payroll & Expenses', value: `ETB ${totalOutcome.toLocaleString()}`, color: 'text-red-400', bg: 'bg-red-400/10', icon: ArrowDownRight },
          { label: 'Net Cash Flow', value: `ETB ${netCashFlow.toLocaleString()}`, color: netCashFlow >= 0 ? 'text-[#d4af37]' : 'text-red-400', bg: netCashFlow >= 0 ? 'bg-[#d4af37]/10' : 'bg-red-400/10', icon: Activity },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`${PANEL} p-5 flex items-center gap-4`}>
              <div className={`p-3 rounded-xl ${m.bg} ${m.color} shrink-0`}><Icon size={22} /></div>
              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{m.label}</p>
                <p className={`text-2xl font-bold ${m.color} leading-tight mt-1`}>{m.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Module Sub-Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Master Transactions', icon: PieChart },
          { id: 'invoices', label: 'Student Invoices & Fees', icon: FileText },
          { id: 'payroll', label: 'Faculty Payroll', icon: Wallet },
          { id: 'revenues', label: 'Revenues & Donations', icon: DollarSign },
          { id: 'expenses', label: 'Expenses & Bills', icon: ArrowDownRight },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#d4af37] text-[#064e3b] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                  : 'bg-black/30 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={`${PANEL} p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Search category or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-[#d4af37]/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className={`${PANEL} p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/15 bg-black/40">
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Date</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Category</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm">Description</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Type</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-right">Amount</th>
                <th className="p-4 text-[#d4af37] font-semibold text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((tx, idx) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 text-sm text-emerald-100/70 font-mono">
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm font-semibold text-white">{tx.category}</td>
                    <td className="p-4 text-sm text-emerald-100 max-w-xs truncate">{tx.description}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        tx.type === 'Income' ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'
                      }`}>
                        {tx.type === 'Income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`p-4 text-sm font-bold text-right ${
                      tx.type === 'Income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'Income' ? '+' : '−'} ETB {tx.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="p-2 rounded-lg text-[#d4af37]/60 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx)}
                          className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-white/40 text-sm">
                    No transactions found in this sub-module.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add / Edit Modal */}
      <SlideModal open={modalOpen} onClose={handleClose} title={editing ? 'Edit Entry' : 'Add Financial Entry'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <SelectField
            label="Transaction Type *"
            required
            value={form.type}
            onChange={e => setField('type', e.target.value)}
          >
            <option value="Income">Income / Revenue (+)</option>
            <option value="Outcome">Expense / Payroll (−)</option>
          </SelectField>

          <FormField
            label="Category *"
            required
            value={form.category}
            onChange={e => setField('category', e.target.value)}
            placeholder="e.g. Tuition Fee, Teacher Salary, Utility Bill"
          />
          <FormField
            label="Description"
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            placeholder="Brief description..."
          />
          <FormField
            type="number"
            label="Amount (ETB) *"
            required
            value={String(form.amount)}
            onChange={e => setField('amount', e.target.value)}
            placeholder="0.00"
          />
          <FormField
            type="date"
            label="Date *"
            required
            value={form.date}
            onChange={e => setField('date', e.target.value)}
          />

          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3"
              >
                <CheckCircle size={16} />
                {editing ? 'Entry updated!' : 'Entry saved!'}
              </motion.div>
            )}
          </AnimatePresence>

          <SubmitBtn label={loading ? 'Saving…' : editing ? 'Save Changes' : 'Save Entry'} />
        </form>
      </SlideModal>
    </div>
  );
}
