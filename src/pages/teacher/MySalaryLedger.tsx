import { useDataStore } from '../../store/useDataStore';
import { useAppStore } from '../../store/useAppStore';
import { Download, ScrollText, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const PANEL = 'glass-card';

export default function MySalaryLedger() {
  const { currentUser } = useAppStore();
  const { teachers } = useDataStore();

  const teacher = teachers.find(t => t.id === currentUser?.id);
  const monthlySalaries = teacher?.monthlySalaries || {};

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Real or derived disbursement history from store
  const history = months.map(m => {
    const record = monthlySalaries[m];
    const isPaid = record?.status === 'Paid';
    return {
      month: `${m} 2026`,
      amount: teacher?.baseSalary || 5000,
      status: isPaid ? 'Paid' : 'Pending',
      date: isPaid ? '2026-01-30' : '—',
      ref: isPaid ? `SAL-MAIN-2026-${teacher?.nationalId || '001'}` : '—',
      method: record?.method || 'Cash'
    };
  });

  const totalEarned = history.filter(h => h.status === 'Paid').reduce((acc, h) => acc + h.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Metric */}
      <div className={`${PANEL} p-8 flex flex-col md:flex-row justify-between items-center gap-6`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
            <ScrollText size={28} />
          </div>
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Monthly Base Salary</p>
            <h2 className="text-3xl font-bold text-[#d4af37] mt-0.5">ETB {teacher?.baseSalary?.toLocaleString() ?? '0'}</h2>
            <p className="text-emerald-400 text-xs mt-1">Total Disbursed: ETB {totalEarned.toLocaleString()}</p>
          </div>
        </div>

        <button 
          onClick={() => alert(`Downloading official Salary Statement for ${teacher?.fullName || 'Ustadh'}...`)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#064e3b] px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.35)] font-bold text-sm cursor-pointer"
        >
          <Download size={18} />
          <span>Download Payslip Statement</span>
        </button>
      </div>

      {/* Payment History Table */}
      <div className={`${PANEL} overflow-hidden`}>
        <div className="p-5 border-b border-[#d4af37]/15 bg-black/40 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#d4af37]">Personal Salary & Payroll Statements</h3>
          <span className="text-xs text-white/50">{history.filter(h => h.status === 'Paid').length} Months Paid</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d4af37]/40 bg-emerald-100/90 dark:bg-[#042c22] text-[#047857] dark:text-[#fef08a] text-xs uppercase tracking-wider font-black">
                <th className="p-4 text-[#047857] dark:text-[#fef08a] font-black">Payment Period</th>
                <th className="p-4 text-[#047857] dark:text-[#fef08a] font-black">Method</th>
                <th className="p-4 text-[#047857] dark:text-[#fef08a] font-black">Reference</th>
                <th className="p-4 text-right text-[#047857] dark:text-[#fef08a] font-black">Net Amount</th>
                <th className="p-4 text-center text-[#047857] dark:text-[#fef08a] font-black">Status</th>
                <th className="p-4 text-center text-[#047857] dark:text-[#fef08a] font-black">Payslip</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, idx) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  key={idx} 
                  className="border-b border-emerald-500/20 hover:bg-emerald-500/10 transition-colors"
                >
                  <td className="p-4 font-extrabold text-[#042c22] dark:text-white text-sm">{record.month}</td>
                  <td className="p-4 text-xs font-semibold text-[#047857] dark:text-emerald-200">{record.method}</td>
                  <td className="p-4 text-xs font-mono text-[#047857] dark:text-emerald-300">{record.ref}</td>
                  <td className="p-4 font-extrabold text-[#059669] dark:text-[#34d399] text-right text-sm">ETB {record.amount.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                      record.status === 'Paid' 
                        ? 'bg-emerald-500/20 text-[#047857] dark:text-emerald-300 border border-emerald-500/40' 
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                    }`}>
                      {record.status === 'Paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {record.status === 'Paid' ? (
                      <button 
                        onClick={() => alert(`Payslip Voucher:\nTeacher: ${teacher?.fullName}\nPeriod: ${record.month}\nAmount: ETB ${record.amount}\nRef: ${record.ref}`)}
                        className="text-[#d4af37] hover:underline font-bold text-xs cursor-pointer"
                      >
                        View Slip
                      </button>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
