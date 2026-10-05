import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

/**
 * Time picker built to match CustomCalendar — same trigger, same panel, and
 * rendered at the end of <body> so a scrolling modal never clips it.
 *
 * The value is a plain display string such as "9:30 AM", which is what gets
 * printed on forms and emails.
 */

const PANEL_HEIGHT = 390;
const PANEL_WIDTH = 320;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const MERIDIEMS = ['AM', 'PM'];

const PRESETS = ['8:00 AM', '9:00 AM', '1:00 PM', '3:00 PM'];

/** "9:30 AM" → { hour: 9, minute: 30, meridiem: 'AM' } */
const parseTime = (value) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(value || '').trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]), meridiem: match[3].toUpperCase() };
};

const formatTime = ({ hour, minute, meridiem }) =>
  `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`;

const CustomTimePicker = ({
  value,
  onChange,
  placeholder = 'Select Time',
  className = '',
  triggerClassName = '',
  disabled = false,
  position = 'below',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [draft, setDraft] = useState(parseTime(value) || { hour: 9, minute: 0, meridiem: 'AM' });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  /**
   * Dismissed by a click outside rather than a full-screen backdrop, which
   * would also swallow the wheel and stop the modal behind it from scrolling.
   */
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (triggerRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const parsed = parseTime(value);
    if (parsed) setDraft(parsed);
  }, [value]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const roomBelow = window.innerHeight - trigger.bottom;
      const openUp = position === 'above'
        ? trigger.top > PANEL_HEIGHT + 16
        : roomBelow < PANEL_HEIGHT + 16 && trigger.top > PANEL_HEIGHT + 16;

      const top = openUp ? trigger.top - PANEL_HEIGHT - 8 : trigger.bottom + 8;
      const left = Math.min(
        Math.max(8, trigger.left),
        Math.max(8, window.innerWidth - PANEL_WIDTH - 8)
      );

      setCoords((prev) => (prev.top === top && prev.left === left ? prev : { top, left }));
    };

    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [isOpen, position]);

  /** Changing any column commits straight away, so the value always matches. */
  const pick = (patch) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onChange(formatTime(next));
  };

  const pickPreset = (preset) => {
    setDraft(parseTime(preset));
    onChange(preset);
    setIsOpen(false);
  };

  const setNow = () => {
    const now = new Date();
    const hour24 = now.getHours();
    const next = {
      hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
      // Rounded to the nearest five minutes, like the columns
      minute: Math.round(now.getMinutes() / 5) % 12 * 5,
      meridiem: hour24 >= 12 ? 'PM' : 'AM',
    };
    setDraft(next);
    onChange(formatTime(next));
    setIsOpen(false);
  };

  const clear = () => {
    onChange('');
    setIsOpen(false);
  };

  /**
   * Laid out as a grid rather than scrolling columns: every hour and minute is
   * visible at once, so picking a time is a single click and nothing has to be
   * scrolled inside a modal.
   */
  const Grid = ({ label, items, active, onSelect, format = (x) => x }) => (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="grid grid-cols-6 gap-1">
        {items.map((item) => (
          <motion.button
            key={item}
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(item)}
            className={`rounded-lg py-1.5 text-sm font-medium cursor-pointer ${
              item === active
                ? 'bg-linear-to-br from-red-500 to-red-600 text-white shadow'
                : 'bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            {format(item)}
          </motion.button>
        ))}
      </div>
    </div>
  );

  const panel = (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: position === 'above' ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'above' ? 10 : -10 }}
      onClick={(e) => e.stopPropagation()}
      data-lenis-prevent
      style={{ top: coords.top, left: coords.left, width: PANEL_WIDTH }}
      className="fixed z-999 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4"
    >
        <div className="text-center mb-3">
          <span className="text-lg font-bold text-gray-800">{formatTime(draft)}</span>
        </div>

        <div className="space-y-3 mb-3">
          <Grid label="Hour" items={HOURS} active={draft.hour} onSelect={(hour) => pick({ hour })} />
          <Grid
            label="Minute"
            items={MINUTES}
            active={draft.minute}
            onSelect={(minute) => pick({ minute })}
            format={(minute) => String(minute).padStart(2, '0')}
          />

          <div className="grid grid-cols-2 gap-2">
            {MERIDIEMS.map((meridiem) => (
              <motion.button
                key={meridiem}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pick({ meridiem })}
                className={`rounded-lg py-2 text-sm font-semibold cursor-pointer ${
                  meridiem === draft.meridiem
                    ? 'bg-linear-to-br from-red-500 to-red-600 text-white shadow'
                    : 'bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                {meridiem}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => pickPreset(preset)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <motion.button
            type="button"
            className="text-red-500 font-semibold text-sm hover:text-red-600 cursor-pointer"
            onClick={clear}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear
          </motion.button>

          <motion.button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-blue-600 cursor-pointer"
            onClick={setNow}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            Now
          </motion.button>
        </div>
    </motion.div>
  );

  return (
    <div className={`relative ${className}`}>
      <motion.button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className={`w-full bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-left flex justify-between items-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${triggerClassName}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <span className={`font-semibold ${value ? 'text-gray-800' : 'text-gray-500'}`}>
          {value || placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <Clock className="w-5 h-5 text-red-500" />
        </motion.div>
      </motion.button>

      {createPortal(
        <AnimatePresence>{isOpen && panel}</AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CustomTimePicker;
