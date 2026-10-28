import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ScrollText, Check, ArrowDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

/**
 * The Student Enrollment Acknowledgment and Undertaking, in full.
 *
 * Kept behind a link rather than printed into the form: it is eight clauses
 * long and would bury the rest of the page. Agreeing is gated on actually
 * reaching the end of it, so ticking the box means the text was at least put
 * in front of the student.
 *
 * The text is fetched rather than held in the client, so what is shown here,
 * what is recorded against the student, and what the confirmation email
 * quotes back are all the same wording.
 */
const AcknowledgementModal = ({ onAgree, onClose }) => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [atEnd, setAtEnd] = useState(false);

  const bodyRef = useRef(null);

  // Only the dialog scrolls while it is open
  useBodyScrollLock();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await enrollmentAPI.getAcknowledgement();
      setDoc(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'The acknowledgement could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /**
   * Whether the end of the text is on screen.
   *
   * Also run once the text has rendered, because on a tall screen the whole
   * thing may already be visible — there would then be no scroll event, and
   * the button would never enable.
   */
  const checkEnd = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;

    // A couple of pixels of slack: sub-pixel heights and browser zoom mean
    // scrollTop + clientHeight rarely lands exactly on scrollHeight
    const reached = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (reached) setAtEnd(true);
  }, []);

  useEffect(() => {
    if (!loading && doc) {
      // After paint, so the measurement sees the rendered text
      const frame = requestAnimationFrame(checkEnd);
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [loading, doc, checkEnd]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Student Enrollment Acknowledgment and Undertaking"
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 sm:px-7 py-4 border-b bg-gradient-to-r from-red-50 to-white shrink-0">
          <div className="p-2.5 rounded-full bg-red-100 text-[var(--dominant-red)] shrink-0">
            <ScrollText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold heading-bold text-gray-900 leading-snug">
              Student Enrollment Acknowledgment and Undertaking
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Vineyard College
              {doc?.version ? ` · Version ${doc.version}` : ''}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 cursor-pointer" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* The text */}
        <div
          ref={bodyRef}
          onScroll={checkEnd}
          className="overflow-y-auto flex-1 px-5 sm:px-7 py-5 overscroll-contain"
        >
          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-red-700">That could not be loaded.</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
              <Button variant="outline" className="mt-4 cursor-pointer" onClick={load}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 leading-relaxed">{doc.intro}</p>

              <ol className="mt-5 space-y-5">
                {doc.clauses.map((clause) => (
                  <li key={clause.number} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-red-50 text-[var(--dominant-red)] text-xs font-bold flex items-center justify-center mt-0.5">
                      {clause.number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{clause.heading}</p>
                      {clause.paragraphs.map((paragraph, index) => (
                        <React.Fragment key={index}>
                          <p className="text-sm text-gray-600 leading-relaxed mt-1.5">{paragraph}</p>

                          {/* Clause 3 cites the handbook between its two paragraphs */}
                          {index === 0 && clause.link && (
                            <p className="text-sm mt-2">
                              {clause.link.url ? (
                                <a
                                  href={clause.link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-[var(--dominant-red)] underline underline-offset-2"
                                >
                                  {clause.link.label}
                                </a>
                              ) : (
                                <span className="text-gray-500">
                                  {clause.link.label}{' '}
                                  <em className="text-gray-400">(link to be provided by the College)</em>
                                </span>
                              )}
                            </p>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>

              <p className="text-sm text-gray-700 leading-relaxed mt-6 pt-5 border-t border-gray-200">
                {doc.closing}
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 border-t bg-gray-50 shrink-0">
          {!atEnd && !loading && !error && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-amber-700 mb-3">
              <ArrowDown size={13} className="animate-bounce" />
              Please read to the end to continue
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <Button
              variant="outline"
              className="h-11 sm:h-10 cursor-pointer border-gray-300"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={!atEnd || loading || !!error}
              onClick={onAgree}
              className="h-11 sm:h-10 gradient-primary text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 size={15} className="animate-spin mr-1.5" />
                : <Check size={15} className="mr-1.5" />}
              I have read and understood
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AcknowledgementModal;
