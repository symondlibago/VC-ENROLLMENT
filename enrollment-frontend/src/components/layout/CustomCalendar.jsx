import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CustomCalendar = ({ 
  value, 
  onChange, 
  placeholder = "Select Date",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDisplayDate = (date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    
    // Previous month's trailing days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <motion.button
          key={`prev-${day}`}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            navigateMonth(-1);
            setTimeout(() => handleDateSelect(day), 100);
          }}
        >
          {day}
        </motion.button>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = dayDate.toDateString() === today.toDateString();
      const isSelected = selectedDate && dayDate.toDateString() === selectedDate.toDateString();
      
      days.push(
        <motion.button
          key={day}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 text-sm font-medium relative overflow-hidden ${
            isSelected
              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg'
              : isToday
              ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-2 border-blue-200'
              : 'text-gray-700 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 hover:text-red-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleDateSelect(day)}
        >
          {isSelected && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <span className="relative z-10">{day}</span>
        </motion.button>
      );
    }

    // Next month's leading days
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <motion.button
          key={`next-${day}`}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            navigateMonth(1);
            setTimeout(() => handleDateSelect(day), 100);
          }}
        >
          {day}
        </motion.button>
      );
    }

    return days;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <motion.button
        type="button"
        disabled={disabled}
        className={`w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl py-3 px-4 text-left flex justify-between items-center focus:outline-none focus:border-red-500 transition-all duration-300 hover:shadow-lg text-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <span className={`font-semibold ${selectedDate ? 'text-gray-800' : 'text-gray-500'}`}>
          {formatDisplayDate(selectedDate)}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <CalendarIcon className="w-5 h-5 text-red-500" />
        </motion.div>
      </motion.button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80 max-w-sm"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <motion.button
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                onClick={() => navigateMonth(-1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </motion.button>
              
              <motion.h3 
                className="text-lg font-bold text-gray-800"
                key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </motion.h3>
              
              <motion.button
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                onClick={() => navigateMonth(1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <motion.div 
              className="grid grid-cols-7 gap-1 mb-4"
              key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {renderCalendarDays()}
            </motion.div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <motion.button
                className="text-red-500 font-semibold text-sm hover:text-red-600 transition-colors duration-200"
                onClick={clearDate}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear
              </motion.button>
              
              <motion.button
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
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

      {/* Backdrop */}
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

