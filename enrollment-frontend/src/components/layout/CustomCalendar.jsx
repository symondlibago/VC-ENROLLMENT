import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CustomCalendar = ({ 
  value, 
  onChange, 
  placeholder = "Select Date",
  className = "",
  disabled = false,
  position = "below" // "above" or "below"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setCurrentDate(new Date(value));
    }
  }, [value]);

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

  return (
    <div className={`relative ${className}`}>
      <motion.button
        type="button"
        disabled={disabled}
        className={`w-full bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-left flex justify-between items-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: position === "above" ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === "above" ? 10 : -10 }}
            className={`absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80 ${
              position === "above" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
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
                <motion.div
                  className="cursor-pointer font-bold"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { setMonthPickerOpen(!monthPickerOpen); setYearPickerOpen(false); }}
                >
                  {months[currentDate.getMonth()]}
                </motion.div>
                <motion.div
                  className="cursor-pointer font-bold"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { setYearPickerOpen(!yearPickerOpen); setMonthPickerOpen(false); }}
                >
                  {currentDate.getFullYear()}
                </motion.div>
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
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomCalendar;
