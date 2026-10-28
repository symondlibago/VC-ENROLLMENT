import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, ShieldCheck, Clock, Loader2, UserCheck, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

/**
 * The day a line was signed.
 *
 * The date only: timestamps recorded before the app's timezone was corrected
 * read eight hours early, and the day is the part anyone actually needs.
 */
const signedOn = (value) => {
  if (!value) return '';

  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Every signature line on one student's clearance.
 *
 * Slides up from the bottom, which on a phone puts the lines under the
 * thumb; on a wider screen it settles into a centred panel.
 */
const ClearanceDetailSheet = ({ clearanceId, canApproveAll, notify, onClose, onChanged }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState(null);
  const [signingAll, setSigningAll] = useState(false);

  // Only the sheet scrolls while it is open
  useBodyScrollLock();

  const load = useCallback(async () => {
    try {
      const response = await enrollmentAPI.clearance.show(clearanceId);
      setData(response.data);
    } catch (error) {
      notify(error.message || 'Could not load that clearance.', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [clearanceId, notify, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sign = async (item) => {
    setBusyItem(item.id);
    try {
      const response = await enrollmentAPI.clearance.approve(item.id);
      notify(response.message, 'success');
      await load();
      onChanged?.();
    } catch (error) {
      notify(error.message || 'Could not sign that line.', 'error');
    } finally {
      setBusyItem(null);
    }
  };

  const signEverything = async () => {
    setSigningAll(true);
    try {
      const response = await enrollmentAPI.clearance.approveAll({ clearance_ids: [clearanceId] });
      notify(response.message, 'success');
      await load();
      onChanged?.();
    } catch (error) {
      notify(error.message || 'Could not sign every line.', 'error');
    } finally {
      setSigningAll(false);
    }
  };

  const outstanding = data?.outstanding ?? [];
  const approvedCount = data?.items?.filter((item) => item.status === 'approved').length ?? 0;
  const totalCount = data?.items?.length ?? 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Student clearance"
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            <div className="p-4 border-b flex items-start gap-3 shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
                  {data.student.name}
                </h2>
                <p className="text-sm text-gray-500 font-mono">{data.student.student_id_number}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.student.course} · {data.student.year_level} · {data.term_label}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 cursor-pointer" onClick={onClose}>
                <X size={18} />
              </Button>
            </div>

            <div className="px-4 py-3 border-b bg-gray-50 shrink-0">
              <div className="flex items-center justify-between gap-3">
                {data.status === 'cleared' ? (
                  <Badge className="bg-green-100 text-green-800 border border-green-200">
                    <ShieldCheck size={12} className="mr-1" /> Fully cleared
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                    <Clock size={12} className="mr-1" /> {outstanding.length} outstanding
                  </Badge>
                )}
                <span className="text-sm font-medium text-gray-600">
                  {approvedCount} / {totalCount} signed
                </span>
              </div>

              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={data.status === 'cleared' ? 'h-full bg-green-500' : 'h-full bg-amber-500'}
                  initial={{ width: 0 }}
                  animate={{ width: totalCount ? `${(approvedCount / totalCount) * 100}%` : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y">
              {data.items.map((item) => {
                const approved = item.status === 'approved';
                const blocked = item.is_final && !approved && outstanding.length > 1;

                return (
                  <div key={item.id} className="p-4 flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${
                        approved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {approved ? <Check size={16} /> : <Clock size={16} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm leading-tight">
                        {item.role_name}
                        {item.is_final && (
                          <span className="ml-1.5 text-[10px] font-semibold text-gray-400 uppercase">
                            signs last
                          </span>
                        )}
                      </p>

                      {approved ? (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.approver_name ? `${item.approver_name} · ` : ''}
                          {signedOn(item.approved_at)}
                          {item.on_behalf && (
                            <span className="ml-1 text-amber-600">(signed by admin)</span>
                          )}
                        </p>
                      ) : blocked ? (
                        <p className="text-xs text-amber-600 mt-0.5">
                          Waiting on {outstanding.length - 1} other line(s)
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">Not yet signed</p>
                      )}
                    </div>

                    {!approved && item.can_sign && (
                      <Button
                        size="sm"
                        disabled={busyItem === item.id || blocked}
                        onClick={() => sign(item)}
                        className="gradient-primary text-white h-9 px-4 shrink-0 cursor-pointer disabled:opacity-40"
                      >
                        {busyItem === item.id ? <Loader2 size={14} className="animate-spin" /> : 'Sign'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {canApproveAll && data.status !== 'cleared' && (
              <div className="p-4 border-t bg-gray-50 shrink-0">
                <div className="flex items-start gap-2 mb-3 text-xs text-gray-500">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    Signs every outstanding line on this student's behalf. Each one is recorded
                    as an admin signature.
                  </span>
                </div>
                <Button
                  className="w-full gradient-primary text-white h-11 cursor-pointer"
                  disabled={signingAll}
                  onClick={signEverything}
                >
                  {signingAll ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <UserCheck size={16} className="mr-2" />
                  )}
                  Sign all {outstanding.length} remaining
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ClearanceDetailSheet;
