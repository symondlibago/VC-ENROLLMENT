import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import {
  ShieldCheck, Clock, Check, QrCode, Download, Maximize2, X, Printer,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

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
 * The student's own clearance, and the code they show to be signed off.
 *
 * Built around the two questions a student actually has — am I cleared, and
 * who do I still need — so the outstanding offices lead and the signatures
 * already collected sit quietly underneath. The code is drawn in the browser
 * from a token the server issued; it is the same code every term, so it can
 * be printed once and kept.
 */
const StudentClearance = () => {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [termId, setTermId] = useState('');
  const [enlarged, setEnlarged] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useBodyScrollLock(enlarged);

  const load = useCallback(async () => {
    try {
      const response = await enrollmentAPI.clearance.mine();
      setPayload(response);
      setTermId(String(response.data?.[0]?.id ?? ''));
    } catch (err) {
      setError(err.message || 'Could not load your clearance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Drawn large so a phone screen still scans from across a counter
  useEffect(() => {
    if (!payload?.qr_token) return;

    QRCode.toDataURL(payload.qr_token, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [payload]);

  const terms = payload?.data ?? [];
  const current = useMemo(
    () => terms.find((term) => String(term.id) === termId) ?? terms[0],
    [terms, termId]
  );

  const [outstanding, signed] = useMemo(() => {
    const items = current?.items ?? [];
    return [
      items.filter((item) => item.status !== 'approved'),
      items.filter((item) => item.status === 'approved'),
    ];
  }, [current]);

  const download = () => {
    if (!qrUrl) return;

    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `clearance-code-${payload.student.student_id_number || 'student'}.png`;
    link.click();
  };

  if (loading) {
    return <div className="p-6 py-24 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-24">
        <ShieldCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Clearance</h1>
        <p className="text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  const total = current?.items?.length ?? 0;
  const cleared = current?.status === 'cleared';

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="gradient-soft rounded-2xl p-5 sm:p-7 border border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-bold heading-bold text-gray-900 flex items-center">
          <ShieldCheck className="w-7 h-7 text-[var(--dominant-red)] mr-2.5 shrink-0" />
          My Clearance
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {payload.student.name} · {payload.student.student_id_number}
          {payload.student.course ? ` · ${payload.student.course}` : ''}
        </p>
      </div>

      {terms.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-gray-500">
            <ShieldCheck className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="font-semibold text-gray-700">No clearance yet.</p>
            <p className="text-sm">One is created when you are enrolled for a term.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Term tabs, only when there is more than one to choose between */}
          {terms.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {terms.map((term) => (
                <button
                  key={term.id}
                  onClick={() => setTermId(String(term.id))}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border-2 cursor-pointer transition-all ${
                    String(term.id) === termId
                      ? 'border-[var(--dominant-red)] bg-red-50 text-[var(--dominant-red)]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {term.term_label}
                  <span className={`ml-2 text-xs ${term.status === 'cleared' ? 'text-green-600' : 'text-amber-600'}`}>
                    {term.status === 'cleared' ? '✓' : '•'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-5 items-start">
            {/* Left: status and the code, held in view while the list scrolls */}
            <div className="space-y-5 lg:sticky lg:top-6">
              <Card className={cleared ? 'border-green-200' : ''}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <ProgressRing approved={signed.length} total={total} cleared={cleared} />

                  <p className="font-bold text-gray-900 mt-4">{current.term_label}</p>

                  {cleared ? (
                    <p className="text-sm text-green-700 mt-1">
                      Every office has signed. Nothing left to do.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      {outstanding.length} office{outstanding.length === 1 ? '' : 's'} still to sign
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <button
                    onClick={() => setEnlarged(true)}
                    className="relative cursor-pointer group"
                    title="Tap to enlarge"
                  >
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt="Your clearance code"
                        className="w-48 h-48 rounded-xl border border-gray-200"
                      />
                    ) : (
                      <div className="w-48 h-48 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                        <QrCode className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-white/95 rounded-full p-1.5 shadow group-hover:scale-110 transition-transform">
                      <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
                    </span>
                  </button>

                  <h2 className="font-bold text-gray-900 mt-4 text-sm">
                    Show this when you are being cleared
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Each office scans it and signs their own line. The same code works every term.
                  </p>

                  <div className="flex gap-2 mt-4 w-full">
                    <Button variant="outline" className="flex-1 cursor-pointer" onClick={download} disabled={!qrUrl}>
                      <Download className="w-4 h-4 mr-1.5" /> Save
                    </Button>
                    <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setEnlarged(true)}>
                      <Printer className="w-4 h-4 mr-1.5" /> Show
                    </Button>
                  </div>
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
                          <span className="text-sm font-medium text-gray-800 leading-tight">
                            {item.role_name}
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

      {enlarged && qrUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Your clearance code"
          className="fixed inset-0 z-[90] bg-black/85 flex items-center justify-center p-6"
          onClick={() => setEnlarged(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl relative max-w-sm w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={qrUrl} alt="Your clearance code" className="w-full rounded-lg" />
            <p className="text-center font-bold text-gray-900 mt-4">{payload.student.name}</p>
            <p className="text-center text-sm text-gray-500 font-mono">
              {payload.student.student_id_number}
            </p>
            {current && (
              <p className="text-center text-xs text-gray-400 mt-1">{current.term_label}</p>
            )}
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-3 -right-3 rounded-full h-9 w-9 cursor-pointer"
              onClick={() => setEnlarged(false)}
            >
              <X size={18} />
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentClearance;
