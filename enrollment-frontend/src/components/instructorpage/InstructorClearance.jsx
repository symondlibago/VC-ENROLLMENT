import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Clock, Check, CalendarRange, AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';
import MotionDropdown from '../idreleasing/MotionDropdown';

/** The day a line was signed, written the way a person reads it. */
const signedOn = (value) => {
  if (!value) return '';

  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** A ring showing how far along the clearance is. */
const ProgressRing = ({ approved, total, cleared }) => {
  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total ? approved / total : 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={stroke} fill="none" className="stroke-gray-200"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={stroke} fill="none" strokeLinecap="round"
          className={cleared ? 'stroke-green-500' : 'stroke-amber-500'}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {cleared ? (
          <>
            <ShieldCheck className="w-8 h-8 text-green-600" />
            <span className="text-xs font-semibold text-green-700 mt-1">Cleared</span>
          </>
        ) : (
          <>
            <span className="text-3xl font-bold heading-bold text-gray-900 leading-none">
              {approved}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">of {total} signed</span>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * An instructor's own faculty clearance, read-only.
 *
 * Deliberately the same page as the student's own clearance — same ring,
 * same two columns, outstanding offices leading — because it answers the
 * same two questions: am I cleared, and who do I still need. The only thing
 * missing is the code, which is a student's to present and not a staff
 * member's.
 */
const InstructorClearance = () => {
  const [payload, setPayload] = useState(null);
  const [termId, setTermId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await enrollmentAPI.facultyClearance.mine();
      setPayload(response.data);
      // Opens on the newest term, which is the one being worked on
      setTermId((current) => current || String(response.data?.clearances?.[0]?.id ?? ''));
      setError('');
    } catch (err) {
      setError(err.message || 'Your clearance could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const terms = payload?.clearances ?? [];

  const current = useMemo(
    () => terms.find((term) => String(term.id) === termId) ?? terms[0] ?? null,
    [terms, termId]
  );

  const items = current?.items ?? [];
  const signed = items.filter((item) => item.status === 'approved');
  const outstanding = items.filter((item) => item.status !== 'approved');
  const total = items.length;
  const cleared = current?.status === 'cleared';

  if (loading) {
    return <div className="py-24 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-800">That could not be loaded.</p>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">{error}</p>
        <Button variant="outline" className="mt-4 cursor-pointer" onClick={load}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="gradient-soft rounded-2xl p-5 sm:p-7 border border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-bold heading-bold text-gray-900 flex items-center">
          <ShieldCheck className="w-7 h-7 text-[var(--dominant-red)] mr-2.5 shrink-0" />
          My Clearance
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {[payload?.instructor?.name, payload?.instructor?.title, payload?.instructor?.department]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {terms.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-gray-500">
            <ShieldCheck className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="font-semibold text-gray-700">No clearance yet.</p>
            <p className="text-sm">One is created at the start of each semester.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Term picker, only when there is more than one to choose between */}
          {terms.length > 1 && (
            <div className="sm:max-w-xs">
              <MotionDropdown
                value={String(current?.id ?? '')}
                onChange={setTermId}
                options={terms.map((term) => ({
                  value: String(term.id),
                  label: `${term.term_label}${term.status === 'cleared' ? ' · Cleared' : ''}`,
                }))}
                icon={CalendarRange}
                className="w-full"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-5 items-start">
            {/* Left: status, held in view while the list scrolls */}
            <div className="space-y-5 lg:sticky lg:top-6">
              <Card className={cleared ? 'border-green-200' : ''}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <ProgressRing approved={signed.length} total={total} cleared={cleared} />

                  <p className="font-bold text-gray-900 mt-4">{current?.term_label}</p>

                  {cleared ? (
                    <>
                      <p className="text-sm text-green-700 mt-1">
                        Every office has signed. Nothing left to do.
                      </p>
                      {current?.cleared_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Cleared on {signedOn(current.cleared_at)}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      {outstanding.length} office{outstanding.length === 1 ? '' : 's'} still to sign
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: who is left, then who has signed */}
            <div className="space-y-5">
              {outstanding.length > 0 && (
                <Card className="border-amber-200">
                  <CardContent className="p-0">
                    <div className="px-5 py-3.5 border-b bg-amber-50/60 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <h3 className="font-bold text-amber-900 text-sm">
                        Still to sign ({outstanding.length})
                      </h3>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {outstanding.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-white"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-gray-800 leading-tight">
                              {item.role_name}
                            </span>
                            {item.is_final && (
                              <span className="block text-[10px] font-semibold text-gray-400 uppercase mt-0.5">
                                signs last
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {signed.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <div className="px-5 py-3.5 border-b bg-green-50/60 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <h3 className="font-bold text-green-900 text-sm">
                        Signed ({signed.length})
                      </h3>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {signed.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2.5 p-3 rounded-xl border border-green-100 bg-green-50/40"
                        >
                          <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={12} strokeWidth={3} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-gray-800 leading-tight">
                              {item.role_name}
                            </span>
                            <span className="block text-xs text-gray-500 mt-0.5">
                              {signedOn(item.approved_at)}
                              {item.approver_name ? ` · ${item.approver_name}` : ''}
                              {item.on_behalf && (
                                <span className="text-amber-600"> · signed by admin</span>
                              )}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InstructorClearance;
