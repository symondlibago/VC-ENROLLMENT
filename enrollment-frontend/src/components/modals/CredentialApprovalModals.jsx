import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, AlertCircle, Wallet, ShieldCheck, Undo2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CustomCalendar from '../layout/CustomCalendar';
import { STEP_LABELS, peso } from '@/lib/credentialOptions';
import { toIsoDate, todayIso } from '@/lib/dateFormat';

/**
 * The two small dialogs the credential board shares: the cashier's payment
 * form, and the confirmation that stands behind every clearance signature.
 */

const inputClass =
  'h-11 text-base border-2 border-gray-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20';

/** A short recap of the request, shown in both dialogs. */
const RequestSummary = ({ request }) => (
  <div className="rounded-lg border bg-gray-50 p-4 text-sm space-y-1">
    <div className="flex items-center justify-between gap-3">
      <p className="font-semibold text-gray-900 uppercase">{request.student?.name}</p>
      <span className="text-xs font-mono text-gray-400 shrink-0">{request.request_number}</span>
    </div>
    <p className="text-xs text-gray-500">
      {[request.student?.student_id_number, request.student?.course].filter(Boolean).join(' · ')}
    </p>
    <div className="pt-2 border-t mt-2">
      <p className="text-xs text-gray-500 mb-1">Requesting</p>
      <div className="flex flex-wrap gap-1.5">
        {(request.credentials ?? []).map((line, index) => (
          <span key={index} className="rounded-md bg-white border px-2 py-0.5 text-xs text-gray-700">
            {line.label}{line.pages ? ` (${line.pages}p)` : ''}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/** Cashier records the fee and the O.R., which also files their clearance. */
export const CredentialPaymentModal = ({ isOpen, onClose, request, onSubmit, isSaving }) => {
  const [amount, setAmount] = useState('');
  const [orNumber, setOrNumber] = useState('');
  const [date, setDate] = useState(todayIso());
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setAmount('');
    setOrNumber('');
    setDate(todayIso());
    setRemarks('');
    setError('');
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const submit = () => {
    const total = parseFloat(amount) || 0;
    if (!total || total <= 0) return setError('Enter the amount paid.');
    if (!orNumber.trim()) return setError('Enter the O.R. number.');
    if (!remarks.trim()) return setError('Remarks are required.');

    onSubmit({
      amount: total,
      or_number: orNumber.trim(),
      payment_date: date,
      remarks: remarks.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="bg-(--dominant-red) text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <h2 className="text-lg font-bold heading-bold">Process Credential Payment</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/15 rounded-lg p-1 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
          <RequestSummary request={request} />

          <div>
            <label className="text-sm font-medium text-gray-700">Amount Paid</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
              <Input
                type="number" min="0" step="0.01" value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder="0.00"
                className={`${inputClass} pl-7 font-semibold`}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">O.R. Number</label>
            <Input
              value={orNumber}
              onChange={(e) => { setOrNumber(e.target.value); setError(''); }}
              placeholder="e.g. 9613"
              className={`${inputClass} mt-1 font-semibold`}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Payment Date</label>
            <CustomCalendar
              value={date}
              onChange={(picked) => setDate(toIsoDate(picked))}
              placeholder="Select payment date"
              position="above"
              className="mt-1"
              triggerClassName="border-gray-300 py-2.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Remarks <span className="text-(--dominant-red)">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => { setRemarks(e.target.value); setError(''); }}
              rows={2}
              placeholder="e.g. credential fee settled in full"
              className="mt-1 w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm focus:border-red-800 focus:ring-2 focus:ring-red-800/20 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Recording the payment also files the cashier's clearance. The registrar can then release the documents.
          </p>
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
          <Button onClick={submit} disabled={isSaving} className="bg-green-600 hover:bg-green-700 cursor-pointer min-w-[140px]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Process ${amount ? peso(amount) : ''}`.trim()}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Confirmation behind a clearance. A signature on a credential form is a real
 * commitment, so it never happens on a stray click — and it carries a remark.
 */
export const CredentialApprovalConfirmModal = ({ isOpen, action, onClose, onConfirm, isSaving }) => {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setRemarks('');
    setError('');
  }, [isOpen]);

  if (!isOpen || !action) return null;

  const { request, step, mode } = action;
  const stepLabel = STEP_LABELS[step] ?? step;
  const isRevoke = mode === 'revoke';

  const submit = () => {
    if (!isRevoke && !remarks.trim()) return setError('Remarks are required before signing.');
    onConfirm(remarks.trim());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className={`px-6 py-4 flex items-center gap-2 text-white ${isRevoke ? 'bg-amber-600' : 'bg-green-600'}`}>
          {isRevoke ? <Undo2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          <h2 className="text-lg font-bold heading-bold">
            {isRevoke ? `Withdraw ${stepLabel} clearance` : `Sign as ${stepLabel}`}
          </h2>
        </div>

        <div data-lenis-prevent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-700">
            {isRevoke ? (
              <>
                You are about to withdraw the <b>{stepLabel}</b> clearance. Anything that came after it —
                payment and release included — is withdrawn too, and the request has to travel again.
              </>
            ) : (
              <>
                You are clearing this credential request as <b>{stepLabel}</b>. Your name and the date are
                recorded on the form.
              </>
            )}
          </p>

          <RequestSummary request={request} />

          {!isRevoke && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Remarks <span className="text-(--dominant-red)">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => { setRemarks(e.target.value); setError(''); }}
                rows={3}
                placeholder={`Note from the ${stepLabel.toLowerCase()} — e.g. no outstanding accountability…`}
                className="mt-1 w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm focus:border-red-800 focus:ring-2 focus:ring-red-800/20 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Recorded against your clearance on this form.</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
          <Button
            onClick={submit}
            disabled={isSaving}
            className={`cursor-pointer min-w-[150px] text-white ${
              isRevoke ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isRevoke ? 'Withdraw clearance' : `Sign as ${stepLabel}`}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
