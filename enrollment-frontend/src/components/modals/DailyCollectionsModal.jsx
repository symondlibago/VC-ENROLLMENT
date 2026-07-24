import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, ChevronLeft, ChevronRight, Wallet, Users, Loader2 } from 'lucide-react';
import { paymentAPI } from '../../services/api';
import CustomCalendar from '../layout/CustomCalendar';

// ₱ currency formatter
const peso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(Number(n) || 0);

// Local YYYY-MM-DD (avoids UTC off-by-one from toISOString)
const localISO = (d) => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
};
const todayStr = () => localISO(new Date());

const shiftDay = (str, delta) => {
  const [y, m, d] = str.split('-').map(Number);
  return localISO(new Date(y, m - 1, d + delta));
};

const prettyDate = (str) => {
  if (!str) return '';
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

// Bridge between our internal ISO (YYYY-MM-DD) and CustomCalendar's MM/DD/YYYY
const isoToUS = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};
const usToISO = (us) => {
  const [m, d, y] = (us || '').split('/');
  if (!m || !d || !y) return todayStr();
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

const DailyCollectionsModal = ({ isOpen, onClose }) => {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentAPI.getByDate(d);
      if (res.success) {
        setRows(res.data.payments || []);
        setGrandTotal(res.data.grand_total || 0);
      } else {
        setError(res.message || 'Failed to load collections.');
        setRows([]);
        setGrandTotal(0);
      }
    } catch (e) {
      setError(e.message || 'Failed to load collections.');
      setRows([]);
      setGrandTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to today each time the modal is opened
  useEffect(() => {
    if (isOpen) setDate(todayStr());
  }, [isOpen]);

  // Fetch whenever the modal is open and the date changes
  useEffect(() => {
    if (isOpen) fetchData(date);
  }, [isOpen, date, fetchData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-(--dominant-red) text-white px-6 py-5 flex items-start justify-between shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold heading-bold">Daily Collections</h2>
                  <p className="text-white/80 text-sm">Payments received on the selected day</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date controls */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setDate((d) => shiftDay(d, -1))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 shadow-sm cursor-pointer"
                  title="Previous day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <CustomCalendar
                  value={isoToUS(date)}
                  onChange={(us) => setDate(us ? usToISO(us) : todayStr())}
                  className="w-56"
                />

                <button
                  onClick={() => setDate((d) => shiftDay(d, 1))}
                  disabled={date >= todayStr()}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Next day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="ml-auto text-sm text-gray-500">{prettyDate(date)}</span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-[360px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  Loading collections…
                </div>
              ) : error ? (
                <div className="py-16 text-center text-red-500">{error}</div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <CalendarDays className="w-12 h-12 mb-3 opacity-40" />
                  <p className="font-medium text-gray-500">No payments recorded on this date.</p>
                  <p className="text-sm">Try another day using the date picker above.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#f1f1f1]">
                    <tr className="text-left text-gray-500">
                      <th className="px-6 py-3 font-semibold w-10">#</th>
                      <th className="px-3 py-3 font-semibold">Student Name</th>
                      <th className="px-3 py-3 font-semibold">Course</th>
                      <th className="px-3 py-3 font-semibold">O.R. No.</th>
                      <th className="px-6 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id} className="border-t border-gray-50 hover:bg-(--whitish-pink)/50 transition-colors">
                        <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-gray-800 uppercase">{r.name}</div>
                          {r.student_id_number && (
                            <div className="text-xs text-gray-400 font-mono">{r.student_id_number}</div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center rounded-md bg-(--whitish-pink) text-(--dominant-red) font-semibold px-2 py-0.5 text-xs">
                            {r.course_code}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-600 font-mono">{r.or_number || '—'}</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-800 whitespace-nowrap">{peso(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer: grand total */}
            <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between shrink-0 rounded-b-2xl">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Users className="w-4 h-4" />
                {rows.length} payment{rows.length === 1 ? '' : 's'}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Grand Total</span>
                <span className="text-2xl font-extrabold text-(--dominant-red)">{peso(grandTotal)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DailyCollectionsModal;
