import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const MotionDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  icon: LeadingIcon = null,
  className = '',
  disabled = false,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);

  const selectedOption =
    options.find((opt) => String(opt.value) === String(value)) ||
    { label: placeholder, value: '' };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange?.(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen((s) => !s)}
        disabled={disabled}
        className={`w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg focus:border-[var(--dominant-red)] focus:ring-2 focus:ring-[var(--dominant-red)]/20 flex items-center justify-between min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <span className="flex items-center gap-2 min-w-0">
          {LeadingIcon && <LeadingIcon className="w-4 h-4 text-gray-500 shrink-0" />}
          <span className={`truncate text-sm ${selectedOption.value === '' ? 'text-gray-500' : 'text-gray-900'}`}>
            {selectedOption.label}
          </span>
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className={`absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto ${
              align === 'right' ? 'right-0' : 'left-0'
            } min-w-full`}
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No options.</div>
            ) : (
              options.map((option) => {
                const isActive = String(option.value) === String(value);
                const OptIcon = option.icon;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-2.5 text-left border-b border-gray-100 last:border-b-0 transition-colors duration-150 flex items-center gap-2 ${
                      isActive
                        ? 'bg-(--whitish-pink) text-(--dominant-red)'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {OptIcon && <OptIcon className="w-4 h-4 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${isActive ? 'font-semibold' : ''}`}>
                        {option.label}
                      </p>
                      {option.hint && (
                        <p className="text-[11px] text-gray-500 truncate">{option.hint}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MotionDropdown;
