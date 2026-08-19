import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Wallet, CheckCircle, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const PANEL = 'glass-card';

export default function StudentFees() {
  const { currentUser } = useAppStore();
  const { students } = useDataStore();

  const student = students.find(s => s.id === currentUser?.id || s.registrationNumber === currentUser?.username) || students[0];

  const totalFee = student?.totalFee || 1500;
  const amountPaid = student?.amountPaid || 0;
  const balance = totalFee - amountPaid;
  const isFullyPaid = balance <= 0;

  return (
    <div className="space-y-6">
      {/* Metric Header */}
      <div className={`${PANEL} p-8 flex flex-col md:flex-row justify-between items-center gap-6`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Tuition Fee Ledger</p>
            <h2 className="text-3xl font-bold text-[#d4af37] mt-0.5">ETB {totalFee.toLocaleString()}</h2>
            <p className="text-emerald-400 text-xs mt-1">Paid: ETB {amountPaid.toLocaleString()} · Balance: ETB {balance.toLocaleString()}</p>
          </div>
        </div>

        <button
          onClick={() => alert(`Downloading Official Tuition Fee Receipt for ${student?.fullName || 'Student'}...`)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.35)] font-bold text-sm cursor-pointer"
        >
          <Download size={18} />
          <span>Download Fee Receipt</span>
        </button>
      </div>

      {/* Payment Voucher Table */}
      <div className={`${PANEL} overflow-hidden`}>
        <div className="p-5 border-b border-[#d4af37]/15 bg-black/40 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#d4af37]">Semester Invoice &amp; Payment History</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isFullyPaid ? 'bg-emerald-400/15 text-emerald-400' : 'bg-amber-400/15 text-amber-400'}`}>
            {isFullyPaid ? 'Settled In Full' : 'Pending Installment'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/15 bg-black/20 text-[#d4af37] text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Payment Date</th>
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 font-bold text-white text-sm">Madrasah Tuition Fee — Semester 1</td>
                <td className="p-4 text-xs text-emerald-100/70">2026-01-15</td>
                <td className="p-4 text-xs font-mono text-white/50">INV-2026-{student?.registrationNumber || '001'}</td>
                <td className="p-4 font-bold text-emerald-400 text-right text-sm">ETB {amountPaid.toLocaleString()}</td>
                <td className="p-4 text-center">
                  <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
                    <CheckCircle size={12} /> Paid
                  </span>
                </td>
              </motion.tr>

              {balance > 0 && (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 font-bold text-white text-sm">Remaining Tuition Installment</td>
                  <td className="p-4 text-xs text-amber-400 font-medium">Due End of Term</td>
                  <td className="p-4 text-xs font-mono text-white/50">BAL-2026-{student?.registrationNumber || '001'}</td>
                  <td className="p-4 font-bold text-amber-400 text-right text-sm">ETB {balance.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 bg-amber-400/15 text-amber-400 border border-amber-400/30">
                      <Clock size={12} /> Pending
                    </span>
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
