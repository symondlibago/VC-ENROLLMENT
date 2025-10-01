import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lock, X, Mail, KeyRound, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';

const OtpModal = ({ isOpen, onClose, onSubmit, isLoading, error, onLoginSuccess }) => {
  // --- STATE MANAGEMENT ---
  const [flowStep, setFlowStep] = useState('enter_pin'); // 'enter_pin', 'forgot_email', 'forgot_otp', 'forgot_reset'
  
  // State for original PIN entry
  const [pin, setPin] = useState(new Array(6).fill(""));
  
  // State for forgot PIN flow
  const [forgotState, setForgotState] = useState({
    email: '',
    otp: '',
    new_pin: '',
    new_pin_confirmation: '',
    reset_token: null,
    loading: false,
    error: ''
  });

  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      // Reset everything when modal opens
      setFlowStep('enter_pin');
      setPin(new Array(6).fill(""));
      setForgotState({ email: '', otp: '', new_pin: '', new_pin_confirmation: '', reset_token: null, loading: false, error: '' });
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);


  // --- HANDLERS FOR ORIGINAL PIN SUBMIT ---
  const handlePinChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newPin = [...pin];
    newPin[index] = element.value;
    setPin(newPin);
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === "Backspace" && !pin[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const joinedPin = pin.join("");
    if (joinedPin.length === 6) {
      onSubmit(joinedPin); // Call original submit from LoginPage
    }
  };


  // --- HANDLERS FOR FORGOT PIN FLOW ---
  const handleForgotFormChange = (e) => {
    setForgotState(prev => ({ ...prev, [e.target.name]: e.target.value, error: '' }));
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setForgotState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await authAPI.sendPinResetOtp(forgotState.email);
      toast.success('An OTP has been sent to your email.');
      setFlowStep('forgot_otp');
    } catch (err) {
      setForgotState(prev => ({ ...prev, error: err.message || 'Failed to send OTP.' }));
    } finally {
      setForgotState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setForgotState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const result = await authAPI.verifyPinResetOtp(forgotState.email, forgotState.otp);
      setForgotState(prev => ({ ...prev, reset_token: result.data.reset_token }));
      setFlowStep('forgot_reset');
    } catch (err) {
      setForgotState(prev => ({ ...prev, error: err.message || 'OTP verification failed.' }));
    } finally {
      setForgotState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    setForgotState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await authAPI.resetPinWithToken({
        reset_token: forgotState.reset_token,
        new_pin: forgotState.new_pin,
        new_pin_confirmation: forgotState.new_pin_confirmation,
      });
      // This function comes from LoginPage.jsx to complete the login
      onLoginSuccess();
    } catch (err) {
      setForgotState(prev => ({ ...prev, error: err.message || 'Failed to reset PIN.' }));
    } finally {
      setForgotState(prev => ({ ...prev, loading: false }));
    }
  };


  // --- RENDER LOGIC ---
  const renderContent = () => {
    const isForgotLoading = forgotState.loading;

    switch (flowStep) {
      case 'forgot_email':
        return (
          <form onSubmit={handleSendResetOtp} className="space-y-6">
            <h2 className="text-2xl font-bold heading-bold text-gray-900 mb-2">Reset Security PIN</h2>
            <p className="text-gray-600 mb-6">Enter your account's email to receive a verification code.</p>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input id="email" name="email" type="email" placeholder="you@example.com" value={forgotState.email} onChange={handleForgotFormChange} className="pl-10" required disabled={isForgotLoading} />
              </div>
            </div>
            {forgotState.error && <p className="text-red-500 text-sm">{forgotState.error}</p>}
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setFlowStep('enter_pin')} disabled={isForgotLoading}>Back</Button>
                <Button type="submit" className="w-70 gradient-primary text-white" disabled={isForgotLoading}>{isForgotLoading ? 'Sending...' : 'Send Code'}</Button>
            </div>
          </form>
        );
      
      case 'forgot_otp':
        return (
          <form onSubmit={handleVerifyResetOtp} className="space-y-6">
            <h2 className="text-2xl font-bold heading-bold text-gray-900 mb-2">Enter Verification Code</h2>
            <p className="text-gray-600 mb-6">A code was sent to **{forgotState.email}**. Enter it below.</p>
            <div className="space-y-2">
              <Label htmlFor="otp">6-Digit OTP</Label>
              <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                 <Input id="otp" name="otp" value={forgotState.otp} onChange={handleForgotFormChange} className="pl-10 text-center tracking-[0.5em]" maxLength="6" required disabled={isForgotLoading} />
              </div>
            </div>
            {forgotState.error && <p className="text-red-500 text-sm">{forgotState.error}</p>}
             <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setFlowStep('forgot_email')} disabled={isForgotLoading}>Back</Button>
                <Button type="submit" className="w-full gradient-primary text-white" disabled={isForgotLoading}>{isForgotLoading ? 'Verifying...' : 'Verify'}</Button>
            </div>
          </form>
        );

      case 'forgot_reset':
        return (
          <form onSubmit={handleResetPin} className="space-y-6">
            <h2 className="text-2xl font-bold heading-bold text-gray-900 mb-2">Set New PIN</h2>
            <p className="text-gray-600 mb-6">Create your new 6-digit security PIN.</p>
            <div className="space-y-2">
              <Label htmlFor="new_pin">New 6-Digit PIN</Label>
              <Input id="new_pin" name="new_pin" type="password" value={forgotState.new_pin} onChange={handleForgotFormChange} maxLength="6" required disabled={isForgotLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_pin_confirmation">Confirm New PIN</Label>
              <Input id="new_pin_confirmation" name="new_pin_confirmation" type="password" value={forgotState.new_pin_confirmation} onChange={handleForgotFormChange} maxLength="6" required disabled={isForgotLoading} />
            </div>
            {forgotState.error && <p className="text-red-500 text-sm">{forgotState.error}</p>}
            <Button type="submit" className="w-full gradient-primary text-white" disabled={isForgotLoading}>{isForgotLoading ? 'Saving...' : 'Set PIN & Login'}</Button>
          </form>
        );

      default: // 'enter_pin'
        return (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-5">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                 <Lock className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold heading-bold text-gray-900 mb-2">Enter Security PIN</h2>
            <p className="text-gray-600 mb-6">A 6-digit secondary PIN is required to continue.</p>
            <form onSubmit={handlePinSubmit}>
              <div className="flex justify-center gap-2 md:gap-3 mb-6">
                {pin.map((data, index) => (
                  <input ref={el => inputRefs.current[index] = el} key={index} type="password" maxLength="1" className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 focus:border-[var(--dominant-red)] focus:ring-1 focus:ring-[var(--dominant-red)] transition" value={data} onChange={e => handlePinChange(e.target, index)} onKeyDown={e => handlePinKeyDown(e, index)} onFocus={e => e.target.select()} disabled={isLoading} />
                ))}
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <Button type="submit" className="w-full gradient-primary text-white" disabled={isLoading || pin.join("").length < 6}>{isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "Verify Code"}</Button>
            </form>
            <button onClick={() => setFlowStep('forgot_email')} className="text-sm text-gray-500 mt-4 hover:text-black">Forgot PIN?</button>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 text-center">
              {renderContent()}
            </div>
             <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OtpModal;