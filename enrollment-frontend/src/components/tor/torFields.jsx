import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** The form primitives the transcript builder is made of. */

export const inputClass =
  'w-full h-10 px-3 rounded-md border-2 border-gray-200 bg-white text-sm text-gray-900 ' +
  'placeholder:text-gray-400 focus:outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20';

// A dense grid of fields reads as a table only if every cell is outlined.
export const cellInputClass =
  'w-full h-9 px-2 rounded-md border border-gray-900 bg-white text-sm text-gray-900 ' +
  'placeholder:text-gray-400 focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800/20';

/** Width of the move/remove controls that close each row. */
export const ROW_CONTROLS_W = 'w-[66px]';

export const Field = ({ label, children, hint, className = '' }) => (
  <div className={className}>
    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <div className="mt-1">{children}</div>
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

export const TextField = ({ label, value, onChange, placeholder, hint, className, list }) => (
  <Field label={label} hint={hint} className={className}>
    <input
      type="text"
      className={inputClass}
      value={value ?? ''}
      list={list}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </Field>
);

/** A titled block, so the long form reads as a handful of steps. */
export const SectionCard = ({ title, description, icon: Icon, action, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
    <header className="flex items-start justify-between gap-4 px-5 py-4 bg-gray-50/80 border-b border-gray-200">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-(--dominant-red)/10 text-(--dominant-red) flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 leading-tight">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </header>
    <div className="p-5 space-y-4">{children}</div>
  </section>
);

export const AddButton = ({ children, onClick, className = '' }) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    className={`h-9 border-dashed border-2 border-gray-300 text-gray-600 hover:border-(--dominant-red) hover:text-(--dominant-red) hover:bg-red-50/50 cursor-pointer ${className}`}
  >
    <Plus className="w-4 h-4 mr-1.5" />
    {children}
  </Button>
);

export const RemoveButton = ({ onClick, title = 'Remove', disabled }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onClick={onClick}
    className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-gray-900 hover:text-(--dominant-red) hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
  >
    <Trash2 className="w-4 h-4" />
  </button>
);

/**
 * Nudges an entry up or down its list. The record has to come out in the order
 * it was taken, and nothing in the database records a sequence.
 */
export const MoveButtons = ({ onMove, canMoveUp, canMoveDown, label = 'entry' }) => (
  <div className="shrink-0 flex flex-col">
    {[[-1, ChevronUp, 'up', canMoveUp], [1, ChevronDown, 'down', canMoveDown]].map(
      ([step, Icon, word, enabled]) => (
        <button
          key={word}
          type="button"
          title={`Move ${label} ${word}`}
          disabled={!enabled}
          onClick={() => onMove(step)}
          className="w-7 h-[18px] rounded flex items-center justify-center text-gray-900 hover:text-(--dominant-red) hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Icon className="w-4 h-4" strokeWidth={2.5} />
        </button>
      )
    )}
  </div>
);

/** "09/30/2005" → "September 30, 2005", the way the transcript prints it. */
export const toLongDate = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};
