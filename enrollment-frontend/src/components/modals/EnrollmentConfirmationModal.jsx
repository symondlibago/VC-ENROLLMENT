import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const EnrollmentConfirmationModal = ({ isOpen, onClose, enrollmentCode, isLoading, error }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
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
              <h3 className="text-xl font-bold text-white">Enrollment Submitted</h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--dominant-red)] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Processing your enrollment...</p>
                </div>
              ) : error ? (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-red-600 mb-2">Submission Error</h4>
                  
                  {error.includes('\n') ? (
                    <div className="text-left bg-red-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                      {error.split('\n').map((line, index) => (
                        <p key={index} className="text-gray-700 text-sm mb-1">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">{error}</p>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                  </div>

                  <h4 className="text-xl font-bold text-center text-gray-800 mb-2">
                    Pre-Enrollment Successful!
                  </h4>

                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">Your Enrollment Code:</p>
                    <p className="text-xl font-mono font-bold text-center py-2 bg-white border border-gray-300 rounded">
                      {enrollmentCode}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Please save this code for reference
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h5 className="font-semibold flex items-center text-gray-700 mb-3">
                      <Clock size={18} className="mr-2" /> Next Steps:
                    </h5>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <div className="min-w-[24px] h-6 flex items-center justify-center mr-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        </div>
                        <span>Awaiting approval from <strong>Program Head</strong></span>
                      </li>
                      <li className="flex items-start">
                        <div className="min-w-[24px] h-6 flex items-center justify-center mr-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        </div>
                        <span>Awaiting approval from <strong>Registrar</strong></span>
                      </li>
                      <li className="flex items-start">
                        <div className="min-w-[24px] h-6 flex items-center justify-center mr-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        </div>
                        <span>Awaiting approval from <strong>Cashier</strong></span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-sm text-gray-600 mt-4">
                    You will be notified via email when your enrollment is fully approved.
                    You can also check your enrollment status using your enrollment code.
                  </p>

                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-[var(--dominant-red)] hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnrollmentConfirmationModal;