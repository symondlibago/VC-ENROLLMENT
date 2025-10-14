import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, GraduationCap, Github, Chrome, ArrowLeft, Check, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';

import SuccessAlert from '../modals/SuccessAlert';
import ValidationErrorModal from '../modals/ValidationErrorModal';
import OtpModal from '../modals/OtpModal';

const LoginPage = ({ onLogin, onBack }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);

  const [successAlert, setSuccessAlert] = useState({ isVisible: false, message: '' });
  const [modalError, setModalError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginOtpState, setLoginOtpState] = useState({ isOpen: false, isLoading: false, error: '', tempToken: null });
  
  const [resetStep, setResetStep] = useState(1);
  const [resetForm, setResetForm] = useState({ email: '', otp: '', password: '', password_confirmation: '' });

  const handleFormChange = (setter, form) => (e) => {
    setter({ ...form, [e.target.name]: e.target.value });
  };

  // --- NEW: Centralized function to handle a successful login from any flow ---
  const handleSuccessfulLogin = () => {
    setLoginOtpState({ isOpen: false, tempToken: null, isLoading: false, error: '' }); // Close modal just in case
    setSuccessAlert({ isVisible: true, message: 'Login successful! Redirecting...' });
    setTimeout(() => onLogin(), 1500);
  };
  
  // --- MODIFIED: Uses the new success handler ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setModalError('');
    try {
      const result = await authAPI.login(loginForm);
      if (result.data.requires_2fa) {
        setLoginOtpState({ isOpen: true, error: '', isLoading: false, tempToken: result.data.temp_token });
      } else {
        handleSuccessfulLogin();
      }
    } catch (error) {
      setModalError(error.message || 'Login failed.');
    } finally {
      // This guarantees the loading state is reset unless a 2FA modal is open
       setIsLoading(false);
    }
  };

  // --- MODIFIED: Uses the new success handler ---
  const handlePinVerify = async (pin) => {
    setLoginOtpState(prev => ({ ...prev, isLoading: true, error: '' }));
    try {
      await authAPI.verifyPin({ pin: pin, temp_token: loginOtpState.tempToken });
      handleSuccessfulLogin();
    } catch (error) {
      setLoginOtpState(prev => ({ ...prev, isLoading: false, error: error.message || 'Verification failed.' }));
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setModalError('');
    try {
      await authAPI.sendPasswordResetOtp(resetForm.email);
      toast.success('An OTP has been sent to your email.');
      setResetStep(2);
    } catch (error) {
      setModalError(error.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setModalError('');
    try {
      await authAPI.resetPasswordWithOtp(resetForm);
      setSuccessAlert({ isVisible: true, message: 'Password reset successful! Please log in.' });
      setActiveTab('login');
      setResetStep(1);
      setResetForm({ email: '', otp: '', password: '', password_confirmation: '' });
    } catch (error) {
      setModalError(error.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } } };
  const formVariants = { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <OtpModal 
        isOpen={loginOtpState.isOpen} 
        onClose={() => setLoginOtpState({ ...loginOtpState, isOpen: false, isLoading: false })} 
        onSubmit={handlePinVerify} 
        isLoading={loginOtpState.isLoading} 
        error={loginOtpState.error}
        onLoginSuccess={handleSuccessfulLogin}
      />
      <SuccessAlert isVisible={successAlert.isVisible} message={successAlert.message} onClose={() => setSuccessAlert({ isVisible: false })} />
      <ValidationErrorModal isOpen={!!modalError} message={modalError} onClose={() => setModalError('')} />
      
      <motion.div className="w-full max-w-md relative z-10" variants={containerVariants} initial="hidden" animate="visible">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Button variant="ghost" onClick={onBack} className="absolute left-0 text-red-800 hover:text-white cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-12 h-12 bg-[var(--dominant-red)] rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to EduEnroll</h1>
          <p className="text-gray-600">Access your enrollment management dashboard</p>
        </div>
        
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg h-12">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="p-6">
                <motion.form key="login" variants={formVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input id="login-email" name="email" type="email" placeholder="Enter your email" value={loginForm.email} onChange={handleFormChange(setLoginForm, loginForm)} className="pl-10" required disabled={isLoading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginForm.password} onChange={handleFormChange(setLoginForm, loginForm)} className="pl-10 pr-10" required disabled={isLoading} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" disabled={isLoading}>
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-white group cursor-pointer" disabled={isLoading}>
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" disabled={isLoading}><Github className="w-4 h-4 mr-2" />GitHub</Button>
                    <Button variant="outline" disabled={isLoading}><Chrome className="w-4 h-4 mr-2" />Google</Button>
                  </div>
                </motion.form>
              </TabsContent>

              <TabsContent value="reset" className="p-6">
                <AnimatePresence mode="wait">
                  {resetStep === 1 ? (
                    <motion.form key="reset-step1" variants={formVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleResetRequest} className="space-y-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Enter your email address and we'll send you a code to reset your password.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input id="reset-email" name="email" type="email" placeholder="Enter your email" value={resetForm.email} onChange={handleFormChange(setResetForm, resetForm)} className="pl-10" required disabled={isLoading} />
                        </div>
                      </div>
                      <Button type="submit" className="w-full gradient-primary text-white group" disabled={isLoading}>
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Send Code <ArrowRight className="ml-2 w-4 h-4" /></>}
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.form key="reset-step2" variants={formVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleResetSubmit} className="space-y-6">
                      <p className="text-sm text-gray-600 text-center">An OTP was sent to **{resetForm.email}**. Enter it below to set a new password.</p>
                      <div className="space-y-2">
                        <Label htmlFor="otp">6-Digit OTP</Label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input id="otp" name="otp" value={resetForm.otp} onChange={handleFormChange(setResetForm, resetForm)} className="pl-10" required disabled={isLoading} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input id="password" name="password" type="password" value={resetForm.password} onChange={handleFormChange(setResetForm, resetForm)} className="pl-10" required disabled={isLoading} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Confirm New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input id="password_confirmation" name="password_confirmation" type="password" value={resetForm.password_confirmation} onChange={handleFormChange(setResetForm, resetForm)} className="pl-10" required disabled={isLoading} />
                        </div>
                      </div>
                      <Button type="submit" className="w-full gradient-primary text-white group" disabled={isLoading}>
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Reset Password <Check className="ml-2 w-4 h-4" /></>}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 EduEnroll. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="#" className="hover:text-[var(--dominant-red)]">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--dominant-red)]">Terms of Service</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;