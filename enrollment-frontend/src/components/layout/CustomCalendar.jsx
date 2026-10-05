import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';

/** Roughly how tall the open panel is, used to decide whether it flips upward. */
const PANEL_HEIGHT = 430;
const PANEL_WIDTH = 320;

const CustomCalendar = ({
  value,
  onChange,
  placeholder = "Select Date",
  className = "",
  triggerClassName = "",
  disabled = false,
  position = "below" // "above" or "below"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  // The panel is rendered at the end of <body> so it is never clipped by a
  // scrolling modal; these are its on-screen coordinates.
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  /**
   * Dismissed by a click outside rather than a full-screen backdrop — a
   * backdrop would also swallow the wheel, so the page or modal behind it
   * could not be scrolled while the calendar was open.
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
    if (value) {
      setSelectedDate(new Date(value));
      setCurrentDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  /** Keeps the panel pinned to its trigger, flipping it when space runs out. */
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

      // Scrolling inside the panel fires this too, so only move when it matters
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDate = (date) => date ? date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '';
  const formatDisplayDate = (date) => date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : placeholder;

  const handleDateSelect = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const navigateToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    onChange(formatDate(today));
    setIsOpen(false);
  };

  const clearDate = () => {
    setSelectedDate(null);
    onChange('');
    setIsOpen(false);
  };

  const handleMonthChange = (index) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(index);
      return newDate;
    });
    setMonthPickerOpen(false);
  };

  const handleYearChange = (year) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(year);
      return newDate;
    });
    setYearPickerOpen(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();

    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <motion.button
          key={`prev-${day}`}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-gray-100 rounded-lg text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { navigateMonth(-1); setTimeout(() => handleDateSelect(day), 100); }}
        >
          {day}
        </motion.button>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = dayDate.toDateString() === today.toDateString();
      const isSelected = selectedDate && dayDate.toDateString() === selectedDate.toDateString();

      days.push(
        <motion.button
          key={day}
          className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium relative ${
            isSelected
              ? 'bg-linear-to-br from-red-500 to-red-600 text-white shadow-lg'
              : isToday
              ? 'bg-linear-to-br from-blue-50 to-blue-100 text-blue-600 border-2 border-blue-200'
              : 'text-gray-700 hover:bg-linear-to-br hover:from-red-50 hover:to-pink-50 hover:text-red-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </motion.button>
      );
    }

    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <motion.button
          key={`next-${day}`}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-gray-100 rounded-lg text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { navigateMonth(1); setTimeout(() => handleDateSelect(day), 100); }}
        >
          {day}
        </motion.button>
      );
    }
    return days;
  };

  const panel = (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: position === "above" ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === "above" ? 10 : -10 }}
      onClick={(e) => e.stopPropagation()}
      data-lenis-prevent
      style={{ top: coords.top, left: coords.left, width: PANEL_WIDTH }}
      className="fixed z-999 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4"
    >
            {/* Header with Month & Year pickers */}
            <div className="flex items-center justify-between mb-4 relative">
              <motion.button
                className="p-2 hover:bg-gray-100 rounded-xl"
                onClick={() => navigateMonth(-1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </motion.button>

              <div className="flex space-x-2">
                <motion.button
                  type="button"
                  className="cursor-pointer font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setMonthPickerOpen(!monthPickerOpen); setYearPickerOpen(false); }}
                >
                  {months[currentDate.getMonth()]}
                  <ChevronDown className="w-3.5 h-3.5 text-red-500" />
                </motion.button>
                <motion.button
                  type="button"
                  className="cursor-pointer font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setYearPickerOpen(!yearPickerOpen); setMonthPickerOpen(false); }}
                >
                  {currentDate.getFullYear()}
                  <ChevronDown className="w-3.5 h-3.5 text-red-500" />
                </motion.button>
              </div>

              <motion.button
                className="p-2 hover:bg-gray-100 rounded-xl"
                onClick={() => navigateMonth(1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </motion.button>

              {/* Month Dropdown */}
              <AnimatePresence>
                {monthPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-10 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-xl p-2 grid grid-cols-3 gap-2 z-50"
                  >
                    {months.map((m, i) => (
                      <motion.div
                        key={m}
                        className="px-2 py-1 text-sm cursor-pointer hover:bg-red-100 rounded-lg text-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMonthChange(i)}
                      >
                        {m.slice(0, 3)}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Year Dropdown */}
              <AnimatePresence>
                {yearPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    data-lenis-prevent
                    className="absolute top-10 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-xl p-2 grid grid-cols-3 gap-2 z-50 max-h-60 overflow-y-auto"
                  >
                    {Array.from({ length: 50 }, (_, i) => 1980 + i).map(year => (
                      <motion.div
                        key={year}
                        className="px-2 py-1 text-sm cursor-pointer hover:bg-red-100 rounded-lg text-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleYearChange(year)}
                      >
                        {year}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <motion.div
              className="grid grid-cols-7 gap-1 mb-4"
              key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {renderCalendarDays()}
            </motion.div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t">
              <motion.button
                className="text-red-500 font-semibold text-sm hover:text-red-600"
                onClick={clearDate}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear
              </motion.button>

              <motion.button
                className="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-blue-600"
                onClick={navigateToToday}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                Today
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
        <span className={`font-semibold ${selectedDate ? 'text-gray-800' : 'text-gray-500'}`}>
          {formatDisplayDate(selectedDate)}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <CalendarIcon className="w-5 h-5 text-red-500" />
        </motion.div>
      </motion.button>

      {/* Rendered at the end of <body> so a scrolling modal can never clip it */}
      {createPortal(
        <AnimatePresence>{isOpen && panel}</AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CustomCalendar;
