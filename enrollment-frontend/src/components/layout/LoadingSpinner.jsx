import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', color = 'red' }) => {
  let spinnerSizeClass = 'h-12 w-12';
  if (size === 'sm') spinnerSizeClass = 'h-6 w-6';
  if (size === 'lg') spinnerSizeClass = 'h-16 w-16';

  let spinnerColorClass = 'border-red-500';
  if (color === 'blue') spinnerColorClass = 'border-blue-500';
  if (color === 'green') spinnerColorClass = 'border-green-500';
  if (color === 'white') spinnerColorClass = 'border-white';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex justify-center items-center"
    >
      <div className={`animate-spin rounded-full ${spinnerSizeClass} border-t-2 border-b-2 ${spinnerColorClass}`}></div>
    </motion.div>
  );
};

export default LoadingSpinner;


