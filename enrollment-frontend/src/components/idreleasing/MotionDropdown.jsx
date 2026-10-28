import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * The dropdown this app uses everywhere — never a native <select>, whose OS
 * chrome does not match anything else on the page.
 *
 * The panel animates in and its options stagger, capped so a long list does
 * not take noticeably longer to appear than a short one.
 */
const MotionDropdown = ({
  value,
  onChange,
  options,
  placeholder = 'Select',
  icon: Icon,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? { label: placeholder, value: '' },
    [options, value, placeholder]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setIsOpen(false);
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

  return (
    <div className={`relative ${className}`} ref={ref}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.99 }}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer liquid-morph"
      >
        {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
        <span className="text-sm text-gray-900 truncate flex-1">{selected.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                // Capped, so a long list opens as briskly as a short one
                transition={{ delay: Math.min(index, 8) * 0.03 }}
                whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
                className={`w-full px-4 py-2.5 text-left text-sm border-b border-gray-100 last:border-b-0 cursor-pointer ${
                  option.value === value
                    ? 'text-[var(--dominant-red)] font-semibold bg-red-50/50'
                    : 'text-gray-700'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MotionDropdown;
