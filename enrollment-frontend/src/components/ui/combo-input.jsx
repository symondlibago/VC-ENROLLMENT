import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * A text field that also searches a list — type anything, or pick a suggestion.
 *
 * Built for the course column on the historical payment sheet. Some of the
 * courses on those old ledger pages are still offered and should be spelled
 * the way the system spells them; others were retired years ago and exist
 * nowhere but on the page being copied. A dropdown alone cannot record the
 * second kind and a plain text box invites a different spelling of the first
 * every time, so this is both: the typed text is always what gets saved, and
 * the list is there to make the still-offered ones consistent and quick.
 *
 * Keyboard, because this is used a few hundred times in a sitting:
 *   type to filter · ↑ ↓ to move · Enter takes the highlighted suggestion,
 *   or the typed text when nothing is highlighted · Esc closes the list.
 */
const ComboInput = ({
  value,
  onChange,
  options = [],
  placeholder = '',
  onEnter,
  className = '',
  inputRef,
  'aria-label': ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const ownRef = useRef(null);
  const field = inputRef || ownRef;

  const matches = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return options.slice(0, 8);
    return options
      .filter((o) => o.toLowerCase().includes(q))
      // A match at the start of the name is the one they meant
      .sort((a, b) => a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q))
      .slice(0, 8);
  }, [options, value]);

  useEffect(() => { setActive(-1); }, [value]);

  // Clicking anywhere else puts the list away
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const take = (option) => {
    onChange(option);
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (e.key === 'Enter') {
      // Enter on a highlighted suggestion takes it and stays put; Enter on
      // free text means "this is the course" and moves the row along.
      if (open && active >= 0 && matches[active]) {
        e.preventDefault();
        take(matches[active]);
        return;
      }
      setOpen(false);
      if (onEnter) onEnter(e);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <input
        ref={field}
        type="text"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        // cn, not a template string: a caller passing `border-transparent`
        // has to actually beat the `border-gray-200` here, and Tailwind
        // settles that by stylesheet order unless the classes are merged.
        className={cn(
          'w-full px-3 py-2 pr-8 bg-white border border-gray-200 rounded-lg text-sm',
          'focus:border-(--dominant-red) focus:ring-2 focus:ring-(--dominant-red)/20 focus:outline-none',
          className,
        )}
      />
      <ChevronDown
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none
          transition-transform ${open ? 'rotate-180' : ''}`}
      />

      <AnimatePresence>
        {open && matches.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200
              rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto"
          >
            {matches.map((option, i) => (
              <li key={option}>
                <button
                  type="button"
                  // mousedown, not click: blur would close the list first
                  onMouseDown={(e) => { e.preventDefault(); take(option); }}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between
                    ${i === active ? 'bg-red-50 text-red-900' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="truncate">{option}</span>
                  {option === value && <Check className="w-3.5 h-3.5 shrink-0 text-(--dominant-red)" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComboInput;
