// src/components/auth/LoginPage.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  GraduationCap,
  Github,
  Chrome,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authAPI } from '../../services/api';

import SuccessAlert from '../modals/SuccessAlert'; 
import ValidationErrorModal from '../modals/ValidationErrorModal'; 
import OtpModal from '../modals/OtpModal'; // --- NEW: Import the OTP Modal ---

const LoginPage = ({ onLogin, onBack }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  
  const [successAlert, setSuccessAlert] = useState({ isVisible: false, message: '' });
  const [modalError, setModalError] = useState('');
  
  // --- NEW: State for OTP Modal ---
  const [otpState, setOtpState] = useState({
    isOpen: false,
    isLoading: false,
    error: '',
    tempToken: null,
  });
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [resetForm, setResetForm] = useState({
    email: ''
  });

  // --- MODIFIED: Updated handleLogin for 2FA ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setModalError('');
    
    try {
      const result = await authAPI.login(loginForm);
      if (result.success) {
        // Check if 2FA is required
        if (result.data.requires_2fa) {
          // Open the OTP modal instead of logging in directly
          setOtpState({
            isOpen: true,
            isLoading: false,
            error: '',
            tempToken: result.data.temp_token,
          });
          setIsLoading(false); // Stop the main login button spinner
        } else {
          // No 2FA needed, proceed with normal login
          setSuccessAlert({ isVisible: true, message: 'Login successful! Redirecting...' });
          setTimeout(() => onLogin(), 1500);
        }
      } else {
        setModalError(result.message || 'Login failed');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.errors) {
        const firstErrorKey = Object.keys(error.errors)[0];
        errorMessage = error.errors[firstErrorKey][0];
      } else if (error.message) {
        errorMessage = error.message;
      }
      setModalError(errorMessage);
      setIsLoading(false);
    }
  };

  // --- NEW: Handler for PIN verification ---
  const handlePinVerify = async (pin) => {
    setOtpState({ ...otpState, isLoading: true, error: '' });
    try {
      const result = await authAPI.verifyPin({
        pin: pin,
        temp_token: otpState.tempToken,
      });

      if (result.success) {
        setOtpState({ ...otpState, isOpen: false }); // Close modal on success
        setSuccessAlert({ isVisible: true, message: 'Login successful! Redirecting...' });
        setTimeout(() => {
          onLogin(); // Finalize login
        }, 1500);
      }
    } catch (error) {
      setOtpState({
        ...otpState,
        isLoading: false,
        error: error.message || 'Verification failed. Please try again.',
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setModalError('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setModalError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await authAPI.register(registerForm);
      if (result.success) {
        setSuccessAlert({ isVisible: true, message: 'Registration successful! Redirecting...' });
        setTimeout(() => {
          onLogin();
        }, 1500);
      } else {
        setModalError(result.message || 'Registration failed');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.errors) {
        errorMessage = Object.values(error.errors)[0][0];
      } else if (error.message) {
        errorMessage = error.message;
      }
      setModalError(errorMessage);
      setIsLoading(false);
    }
  };
  
  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setModalError('');
    try {
      const result = await authAPI.resetPassword(resetForm.email);
      if (result.success) {
        setSuccessAlert({ isVisible: true, message: result.message || 'Password reset link sent!' });
      } else {
        setModalError(result.message || 'Reset password failed');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Reset password error:', error);
      setModalError(error.message || 'Failed to send reset link.');
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--snowy-white)] via-[var(--whitish-pink)] to-white flex items-center justify-center p-4">
      {/* --- NEW: Render all modals at the top level --- */}
      <OtpModal
        isOpen={otpState.isOpen}
        onClose={() => setOtpState({ ...otpState, isOpen: false, error: '', isLoading: false })}
        onSubmit={handlePinVerify}
        isLoading={otpState.isLoading}
        error={otpState.error}
      />
      <SuccessAlert
        isVisible={successAlert.isVisible}
        message={successAlert.message}
        onClose={() => setSuccessAlert({ ...successAlert, isVisible: false })}
      />
      <ValidationErrorModal
        isOpen={!!modalError}
        message={modalError}
        onClose={() => setModalError('')}
      />

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[var(--dominant-red)] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-center mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="absolute left-0 text-gray-600 hover:text-[var(--dominant-red)] liquid-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-12 h-12 bg-[var(--dominant-red)] rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold heading-bold text-gray-900 mb-2">
            Welcome to EduEnroll
          </h1>
          <p className="text-gray-600">
            Access your enrollment management dashboard
          </p>
        </motion.div>
        
        {/* Main Card */}
        <Card className="card-hover border-0 shadow-2xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-t-lg h-12">
                <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-sm">Register</TabsTrigger>
                <TabsTrigger value="reset" className="text-sm">Reset</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="p-6">
                <AnimatePresence mode="wait">
                  <motion.form
                    key="login"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onSubmit={handleLogin}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                            className="pl-10 liquid-morph"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                            className="pl-10 pr-10 liquid-morph"
                            required
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gradient-primary text-white liquid-button group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="liquid-button" disabled={isLoading}>
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </Button>
                      <Button variant="outline" className="liquid-button" disabled={isLoading}>
                        <Chrome className="w-4 h-4 mr-2" />
                        Google
                      </Button>
                    </div>
                  </motion.form>
                </AnimatePresence>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="p-6">
                <AnimatePresence mode="wait">
                  <motion.form
                    key="register"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onSubmit={handleRegister}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="register-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={registerForm.name}
                            onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                            className="pl-10 liquid-morph"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="Enter your email"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                            className="pl-10 liquid-morph"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="Create a password"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                            className="pl-10 liquid-morph"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-confirm">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="register-confirm"
                            type="password"
                            placeholder="Confirm your password"
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                            className="pl-10 liquid-morph"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gradient-primary text-white liquid-button group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                </AnimatePresence>
              </TabsContent>

              {/* Reset Tab */}
              <TabsContent value="reset" className="p-6">
                <AnimatePresence mode="wait">
                  <motion.form
                    key="reset"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onSubmit={handleReset}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h3>
                      <p className="text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={resetForm.email}
                          onChange={(e) => setResetForm({...resetForm, email: e.target.value})}
                          className="pl-10 liquid-morph"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gradient-primary text-white liquid-button group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div
          className="text-center mt-8 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p>© 2024 EduEnroll. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="#" className="hover:text-[var(--dominant-red)] liquid-morph">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--dominant-red)] liquid-morph">Terms of Service</a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;