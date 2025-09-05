import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertCircle, XCircle } from 'lucide-react';

const SuccessAlert = ({ 
  isVisible, 
  message, 
  type = 'success', 
  onClose, 
  autoClose = true, 
  duration = 4000 
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          icon: CheckCircle,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
    }
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  const alertVariants = {
    hidden: { 
      opacity: 0,
      y: -50,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0,
      y: -50,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-[60] max-w-sm w-full"
          variants={alertVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={`
            ${config.bgColor} 
            ${config.borderColor} 
            border rounded-lg shadow-lg p-4
          `}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${config.textColor}`}>
                  {message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={onClose}
                  className={`
                    inline-flex rounded-md p-1.5 
                    ${config.textColor} 
                    hover:bg-black/5 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 
                    transition-colors duration-200
                  `}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Progress bar for auto-close */}
            {autoClose && (
              <motion.div
                className={`mt-2 h-1 ${config.bgColor} rounded-full overflow-hidden`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className={`h-full ${config.iconColor.replace('text-', 'bg-')}`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ 
                    duration: duration / 1000, 
                    ease: "linear" 
                  }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAlert;

