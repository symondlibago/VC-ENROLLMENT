import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Loader2, AlertCircle, Send, CalendarCheck, Mail, PackageCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CustomCalendar from '../layout/CustomCalendar';
import CustomTimePicker from '../layout/CustomTimePicker';
import { longDate } from '@/lib/credentialOptions';
import { toIsoDate, isoDaysFromNow } from '@/lib/dateFormat';

/**
 * The registrar's last step: sign the form, set when the documents can be
 * picked up, and send the claim stub to the student. The preview shows exactly
 * what will land in their inbox.
 */

const inputClass =
  'h-10 border-2 border-gray-200 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 bg-white';

const CredentialReleaseModal = ({ isOpen, onClose, request, onSubmit, isSaving }) => {
  const [claimDate, setClaimDate] = useState('');
  const [claimTime, setClaimTime] = useState('9:00 AM');
  const [remarks, setRemarks] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [email, setEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Three working days out is the usual turnaround
    setClaimDate(isoDaysFromNow(3));
    setClaimTime('9:00 AM');
    setRemarks('');
    setReleaseNotes('');
    setEmail(request?.student?.email ?? '');
    setSendEmail(true);
    setError('');
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const submit = () => {
    if (!claimDate) return setError('Set the date the student can claim the documents.');
    if (!remarks.trim()) return setError('Remarks are required before releasing.');
    if (sendEmail && !email.trim()) return setError('Add an email address, or turn off sending the stub.');

    onSubmit({
      claim_date: claimDate,
      claim_time: claimTime || null,
      remarks: remarks.trim(),
      release_notes: releaseNotes.trim() || null,
      email: email.trim() || null,
      send_email: sendEmail,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="bg-green-600 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold heading-bold">Release & schedule claiming</h2>
              <p className="text-white/80 text-sm">{request.request_number} · {request.student?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/15 rounded-lg p-1.5 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* min-h-0 lets the body shrink inside the flex column — without it the
            modal just grows and nothing scrolls. Each column scrolls on its own
            once there is room for two, so the preview stays put while you type. */}
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 overflow-y-auto lg:overflow-hidden"
        >
          {/* Form */}
          <div
            data-lenis-prevent
            className="p-6 space-y-4 border-b lg:border-b-0 lg:border-r lg:min-h-0 lg:overflow-y-auto"
          >
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Please claim on <span className="text-(--dominant-red)">*</span>
              </label>
              <CustomCalendar
                value={claimDate}
                onChange={(picked) => { setClaimDate(toIsoDate(picked)); setError(''); }}
                placeholder="Select claim date"
                className="mt-1.5"
                triggerClassName="py-2.5"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Time</label>
              <CustomTimePicker
                value={claimTime}
                onChange={setClaimTime}
                placeholder="No specific time"
                className="mt-1.5"
                triggerClassName="py-2.5"
              />
              <p className="text-xs text-gray-400 mt-1">Shown on the claim stub. Clear it for any time during office hours.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Registrar's remarks <span className="text-(--dominant-red)">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => { setRemarks(e.target.value); setError(''); }}
                rows={2}
                placeholder="e.g. all documents verified and signed"
                className="mt-1.5 w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-red-800 focus:ring-2 focus:ring-red-800/20 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Recorded on the form against your approval.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Note to the student
              </label>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={2}
                placeholder="e.g. bring your school ID and the official receipt"
                className="mt-1.5 w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-red-800 focus:ring-2 focus:ring-red-800/20 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Appears in the email. Optional.</p>
            </div>

            <div className="rounded-xl border-2 border-gray-200 p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-600 cursor-pointer"
                />
                <span className="text-sm">
                  <span className="font-semibold text-gray-900">Email the claim stub</span>
                  <span className="block text-xs text-gray-500">Sent the moment this request is released.</span>
                </span>
              </label>

              {sendEmail && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Send to</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="student@email.com"
                    className={`${inputClass} mt-1.5`}
                  />
                  <p className="text-xs text-gray-400 mt-1">Saved to the request as well.</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
              </div>
            )}
          </div>

          {/* Email preview */}
          <div data-lenis-prevent className="bg-gray-100 p-6 lg:min-h-0 lg:overflow-y-auto">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              <Mail className="w-3.5 h-3.5" />
              What the student receives
            </div>

            <div className="rounded-xl overflow-hidden bg-white shadow-sm border">
              <div className="bg-(--dominant-red) px-5 py-4 text-white">
                <p className="text-sm font-bold leading-tight">Vineyard International<br />Polytechnic College</p>
                <p className="text-[11px] text-white/75 mt-1">Office of the Registrar · Cagayan de Oro City</p>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                    Credential Request · Claim Stub
                  </p>
                  <p className="text-base font-bold text-gray-900 mt-1">Your documents are ready to claim</p>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Hello <b className="text-gray-900">{request.student?.name}</b>, your credential request{' '}
                    <b className="text-(--dominant-red)">{request.request_number}</b> has been processed and
                    released by the Office of the Registrar.
                  </p>
                </div>

                <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-(--dominant-red) font-bold">
                    Please claim on
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {claimDate ? longDate(claimDate) : 'To be announced'}
                  </p>
                  {claimTime && <p className="text-xs text-gray-600 mt-0.5">at {claimTime}</p>}
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                    Office of the Registrar, Prince Padi Bldg., A. Luna Street,<br />
                    Mabulay Subdivision, Cagayan de Oro City
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
                    Documents requested
                  </p>
                  <div className="rounded-lg border divide-y">
                    {(request.credentials ?? []).map((line, index) => (
                      <div key={index} className="flex items-start justify-between gap-3 px-3 py-2">
                        <span className="text-xs text-gray-900">{line.label}</span>
                        {line.pages && (
                          <span className="text-[11px] text-gray-500 whitespace-nowrap">
                            {line.pages} page{Number(line.pages) === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {releaseNotes.trim() && (
                  <div className="rounded-md bg-gray-50 border-l-[3px] border-(--dominant-red) px-3 py-2">
                    <p className="text-[11px] text-gray-700">
                      <b className="text-gray-900">Note from the Registrar:</b><br />
                      {releaseNotes}
                    </p>
                  </div>
                )}

                <div className="border-t pt-3">
                  <p className="text-[11px] text-gray-500">Released by</p>
                  <p className="text-xs font-bold text-gray-900">ARCHIE MAY L. MANANGKILA</p>
                  <p className="text-[11px] text-gray-500">School Registrar</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-3 text-center">
              {sendEmail && email ? `Will be sent to ${email}` : 'No email will be sent'}
            </p>
          </div>
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-gray-500 hidden sm:flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5" />
            Releasing files the registrar's approval and closes the request.
          </p>
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
            <Button
              onClick={submit}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer min-w-[190px]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {sendEmail ? 'Release & send stub' : 'Release'}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CredentialReleaseModal;
