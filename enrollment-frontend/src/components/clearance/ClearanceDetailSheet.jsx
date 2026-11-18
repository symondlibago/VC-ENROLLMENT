import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShieldCheck, Clock, Loader2, UserCheck, AlertTriangle, Undo2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import SignAllNoteModal from '@/components/clearance/SignAllNoteModal';
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
 * Signing every line used to write a fixed sentence into `remarks` that only
 * repeated what the `on_behalf` flag already says, and thousands of rows hold
 * nothing but that sentence. Nobody wrote them, so they are not shown.
 */
const AUTO_REMARK = /^signed by the \w+ on the holders' behalf$/i;

/** The sentence `revoke` writes when a signature is taken back. */
const UNDO_REMARK = /^signature undone by /i;

const isCashier = (code) => typeof code === 'string' && code.endsWith('cashier');

/**
 * What is worth showing under a line, and which kind it is.
 *
 * A note is the assessment desk's, so it is only read as one on their line —
 * which also keeps older rows, written back when a note was copied onto all
 * sixteen signatories, from reappearing on the nurse's.
 */
const noteOn = (item) => {
  const text = (item?.remarks ?? '').trim();

  if (!text || AUTO_REMARK.test(text)) return null;
  if (UNDO_REMARK.test(text)) return { kind: 'undo', text };

  return isCashier(item?.role_code) ? { kind: 'note', text } : null;
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
  // The signed line waiting on a yes before its signature is taken back
  const [undoing, setUndoing] = useState(null);
  // Whether the note box is open, asked before signing the rest of the lines
  const [noteOpen, setNoteOpen] = useState(false);

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

  const undoSignature = async () => {
    const item = undoing;
    if (!item) return;

    setBusyItem(item.id);
    try {
      const response = await enrollmentAPI.clearance.revoke(item.id);
      notify(response.message, 'success');
      await load();
      onChanged?.();
    } catch (error) {
      notify(error.message || 'Could not undo that signature.', 'error');
    } finally {
      setBusyItem(null);
      setUndoing(null);
    }
  };

  /**
   * Signs the rest of this student's lines, with whatever the desk wrote in
   * the note box. This is where a cashier's note belongs most precisely: one
   * student, so the note is about them and nobody else.
   */
  const signEverything = async (remarks = '') => {
    setSigningAll(true);
    try {
      const response = await enrollmentAPI.clearance.approveAll({
        clearance_ids: [clearanceId],
        ...(remarks ? { remarks } : {}),
      });
      notify(response.message, 'success');
      setNoteOpen(false);
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
                {/* `subject` covers a student or an instructor, so this sheet
                    serves both boards rather than being copied for each */}
                <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
                  {data.subject?.name ?? data.student?.name}
                </h2>
                {(data.subject?.identifier ?? data.student?.student_id_number) && (
                  <p className={`text-sm text-gray-500 ${data.subject?.kind === 'faculty' ? '' : 'font-mono'}`}>
                    {data.subject?.identifier ?? data.student?.student_id_number}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">
                  {[data.subject?.detail ?? `${data.student?.course} · ${data.student?.year_level}`, data.term_label]
                    .filter(Boolean)
                    .join(' · ')}
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
                const note = noteOn(item);

                return (
                  <div key={item.id} className="p-4 flex items-start gap-3">
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

                      {/* The assessment desk's note, or — on any line — the
                          reason its signature was taken back. The second is
                          provenance rather than a message, so it is quieter. */}
                      {note && (
                        <p className={note.kind === 'note'
                          ? 'text-xs text-gray-800 mt-1.5 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 whitespace-pre-wrap break-words'
                          : 'text-xs text-gray-400 italic mt-1 whitespace-pre-wrap break-words'}
                        >
                          {note.text}
                        </p>
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

                    {/* Whoever may sign the line may take it back — the same
                        permission, so a desk can correct its own mis-click
                        without going through an admin. */}
                    {approved && item.can_sign && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyItem === item.id}
                        onClick={() => setUndoing(item)}
                        title="Undo this signature"
                        /* The outline variant hovers to --accent, which is the
                           dominant red, so the hover background is set here as
                           well as the colour — tinting only the text left a red
                           icon on a red fill. Same pairing the other quiet
                           destructive buttons use. */
                        className="h-9 px-3 shrink-0 cursor-pointer bg-white text-gray-500 hover:bg-red-50 hover:text-red-800 hover:border-red-800 disabled:opacity-40"
                      >
                        {busyItem === item.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Undo2 size={14} />}
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
                  onClick={() => setNoteOpen(true)}
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

      <DeleteConfirmationModal
        isOpen={!!undoing}
        onClose={() => setUndoing(null)}
        onConfirm={undoSignature}
        title="Undo Signature"
        message={`The ${undoing?.role_name ?? 'this'} line will go back to unsigned. If this was the last signature, the student stops being cleared and any grades it released go back on hold.`}
        itemName={undoing
          ? `${undoing.role_name}${undoing.approver_name ? ` — signed by ${undoing.approver_name}` : ''}`
          : ''}
        itemLabel="Signature to undo:"
        warning={<><strong>INC forms already paid for or signed are left alone.</strong> Only the ones nobody has acted on are withdrawn.</>}
        tone="warning"
        confirmLabel="Undo signature"
        loadingLabel="Undoing..."
        confirmIcon={Undo2}
        isLoading={busyItem === undoing?.id}
      />

      <AnimatePresence>
        {noteOpen && (
          <SignAllNoteModal
            target={data?.subject?.name ?? 'this student'}
            busy={signingAll}
            onCancel={() => setNoteOpen(false)}
            onConfirm={signEverything}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClearanceDetailSheet;
