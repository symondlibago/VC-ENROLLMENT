import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

const ValidationErrorModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          // --- THIS IS THE FIX: Changed z-50 to z-[60] to make it appear on top ---
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Form Validation Error</h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <AlertCircle size={28} className="text-red-500" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Please Fix the Following:</h4>
                  <p className="text-gray-600">{message || 'Please correct the errors in the form before proceeding.'}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[var(--dominant-red)] text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ValidationErrorModal;