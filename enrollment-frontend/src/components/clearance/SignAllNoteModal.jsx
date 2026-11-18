import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StickyNote, Loader2, UserCheck, MailX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Asked before signing every outstanding line on the selected students.
 *
 * The note is optional and that is the point: the cashier signs a whole queue
 * at a time, and only now and then does one of them need something said about
 * it — a promissory note, a partial payment, a date to come back. Leaving the
 * box empty signs exactly as the button did before, so the common case is
 * still two clicks.
 *
 * Whatever is typed is recorded against every line this signs. Opened from one
 * student's clearance that is exactly their lines; opened from the board it is
 * the whole selection, which `target` says plainly either way.
 */
const SignAllNoteModal = ({ target, sendEmail = true, busy, onCancel, onConfirm }) => {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col"
      >
        <div className="p-6 pb-4 flex flex-col items-center text-center">
          <div className="bg-gray-100 p-3 rounded-full mb-4">
            <StickyNote className="h-7 w-7 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Add a note?</h2>
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            Every outstanding line on <span className="font-semibold text-gray-800">{target}</span> is
            about to be signed
            {sendEmail ? ', and emailed to say they are cleared' : ', without emailing anyone'}.
            A note is optional — leave it blank to sign as usual.
          </p>
        </div>

        <div className="px-6">
          <Textarea
            autoFocus
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Anything that should be on record against these signatures…"
            className="resize-none border-gray-300 focus-visible:border-[var(--dominant-red)] focus-visible:ring-[var(--dominant-red)]/20"
          />
          <p className="text-xs text-gray-400 mt-1.5 text-right">
            {note.length}/1000
          </p>
        </div>

        <div className="p-6 pt-3 flex gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={onCancel}
            className="flex-1 h-11 cursor-pointer bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            disabled={busy}
            onClick={() => onConfirm(note.trim())}
            className="flex-1 h-11 gradient-primary text-white cursor-pointer"
          >
            {busy
              ? <Loader2 size={16} className="animate-spin mr-2" />
              : sendEmail
                ? <UserCheck size={16} className="mr-2" />
                : <MailX size={16} className="mr-2" />}
            {busy ? 'Signing…' : 'Sign all lines'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignAllNoteModal;
