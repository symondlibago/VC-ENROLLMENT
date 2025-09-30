import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lock, X } from 'lucide-react';

const OtpModal = ({ isOpen, onClose, onSubmit, isLoading, error }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
        // Reset state and focus first input when modal opens
        setOtp(new Array(6).fill(""));
        inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current is empty
    if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pin = otp.join("");
    if (pin.length === 6) {
      onSubmit(pin);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-5">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                   <Lock className="w-6 h-6 text-green-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold heading-bold text-gray-900 mb-2">Enter Security PIN</h2>
              <p className="text-gray-600 mb-6">A 6-digit secondary PIN is required to continue.</p>

              <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-2 md:gap-3 mb-6">
                  {otp.map((data, index) => (
                    <input
                      ref={el => inputRefs.current[index] = el}
                      key={index}
                      type="password"
                      maxLength="1"
                      className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 focus:border-[var(--dominant-red)] focus:ring-1 focus:ring-[var(--dominant-red)] transition"
                      value={data}
                      onChange={e => handleChange(e.target, index)}
                      onKeyDown={e => handleKeyDown(e, index)}
                      onFocus={e => e.target.select()}
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white liquid-button group"
                  disabled={isLoading || otp.join("").length < 6}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Verify Code"}
                </Button>
              </form>
              <button className="text-sm text-gray-500 mt-4 hover:text-black">Resend Code</button>
            </div>
             <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OtpModal;