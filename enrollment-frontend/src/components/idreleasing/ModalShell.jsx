import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

/**
 * The frame every dialog on this page sits in — backdrop, escape key, and a
 * body that scrolls on its own so a long form never pushes the page behind it.
 */
const ModalShell = ({ title, subtitle, icon: Icon, tone = 'bg-red-100 text-red-600', onClose, children, footer, width = 'max-w-lg' }) => {
  // Only the dialog scrolls while it is open
  useBodyScrollLock();

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className={`bg-white rounded-xl shadow-2xl w-full ${width} max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start gap-3 p-5 border-b">
          {Icon && (
            <div className={`p-2.5 rounded-full shrink-0 ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold heading-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && <div className="p-5 border-t bg-gray-50/70 rounded-b-xl">{footer}</div>}
      </motion.div>
    </div>
  );
};

/**
 * The border every field in these dialogs wears.
 *
 * The shared Input defaults to `border-input`, which is near enough to white
 * on this background to read as no border at all, so the colour is stated.
 */
export const FIELD_CLASS =
  'border border-gray-300 focus-visible:border-[var(--dominant-red)] focus-visible:ring-[var(--dominant-red)]/20';

/** A labelled form row, so the dialogs below stay mostly markup-free. */
export const Field = ({ label, hint, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

export default ModalShell;
