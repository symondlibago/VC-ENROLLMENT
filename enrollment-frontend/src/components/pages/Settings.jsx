import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, Shield, Save, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authAPI } from '../../services/api';
import SuccessAlert from '../modals/SuccessAlert';
import ValidationErrorModal from '../modals/ValidationErrorModal';
import OtpVerificationModal from '../modals/OtpVerificationModal';
import { toast } from 'sonner';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userHasPin, setUserHasPin] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: '', email: '', current_password: '', secondary_pin: '' });
  const [passwordForm, setPasswordForm] = useState({ current_pin: '', new_password: '', new_password_confirmation: '' });
  const [pinForm, setPinForm] = useState({ current_password: '', current_pin: '', new_pin: '', new_pin_confirmation: '' });

  const [isSaving, setIsSaving] = useState(false);
  const [successAlert, setSuccessAlert] = useState({ isVisible: false, message: '' });
  const [modalError, setModalError] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  useEffect(() => {
    const user = authAPI.getUserData();
    if (user) {
      setCurrentUser(user);
      setUserHasPin(user.has_pin);
      setProfileForm(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));
    }
  }, []);

  const handleFormChange = (setter, form) => (e) => {
    const { name, value } = e.target;
    if (name.includes('pin')) {
      setter({ ...form, [name]: value.replace(/\D/g, '').slice(0, 6) });
    } else {
      setter({ ...form, [name]: value });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError('');
    try {
      const result = await authAPI.updateProfile(profileForm);
      
      if (result.otp_required) {
        // --- CORRECTED MESSAGE ---
        toast.info('A verification code has been sent to your current email address.');
        setIsOtpModalOpen(true); 
      } else {
        setSuccessAlert({ isVisible: true, message: result.message || 'Profile updated successfully!' });
        const updatedUser = authAPI.getUserData();
        setCurrentUser(updatedUser);
      }
      
      setProfileForm(prev => ({ ...prev, current_password: '', secondary_pin: '' }));

    } catch (error) {
      setModalError(error.message || 'Profile update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOtpSubmit = async (otp) => {
    setIsSaving(true);
    setModalError('');
    try {
      const result = await authAPI.verifyEmailChange({ otp });
      setIsOtpModalOpen(false);
      setSuccessAlert({ isVisible: true, message: result.message || 'Email updated successfully!' });
      const updatedUser = authAPI.getUserData();
      setCurrentUser(updatedUser);
      setProfileForm(prev => ({ ...prev, email: updatedUser.email }));
    } catch (error) {
      setModalError(error.message || 'OTP Verification Failed.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError('');
    try {
      const result = await authAPI.changePassword(passwordForm);
      setSuccessAlert({ isVisible: true, message: result.message || 'Password changed successfully!' });
      setPasswordForm({ current_pin: '', new_password: '', new_password_confirmation: '' });
    } catch (error) {
      setModalError(error.message || 'Password change failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError('');
    try {
      const result = await authAPI.updatePin(pinForm);
      setSuccessAlert({ isVisible: true, message: result.message || 'PIN action successful!' });
      const updatedUserRes = await authAPI.getUser();
      if (updatedUserRes.success) {
        localStorage.setItem('user_data', JSON.stringify(updatedUserRes.data.user));
        setCurrentUser(updatedUserRes.data.user);
        setUserHasPin(updatedUserRes.data.user.has_pin);
      }
      setPinForm({ current_password: '', current_pin: '', new_pin: '', new_pin_confirmation: '' });
    } catch (error) {
      setModalError(error.message || 'PIN action failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const renderProfileSettings = () => (
    <form onSubmit={handleProfileUpdate} className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input name="name" value={profileForm.name} onChange={handleFormChange(setProfileForm, profileForm)} disabled={isSaving} className="border border-gray-300" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <Input name="email" type="email" value={profileForm.email} onChange={handleFormChange(setProfileForm, profileForm)} disabled={isSaving} className="border border-gray-300" />
            </div>
          </div>
          <div className="border-t pt-4">
            <CardDescription>Verify your identity to save changes.</CardDescription>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Password</label>
              <Input name="current_password" type="password" value={profileForm.current_password} onChange={handleFormChange(setProfileForm, profileForm)} required disabled={isSaving} className="border border-gray-300" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">6-Digit PIN</label>
              <Input name="secondary_pin" type="password" value={profileForm.secondary_pin} onChange={handleFormChange(setProfileForm, profileForm)} required disabled={isSaving} className="border border-gray-300" />
            </div>
          </div>
          <div>
            <Button type="submit" className="gradient-primary text-white" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <form onSubmit={handleChangePassword} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Current 6-Digit PIN</label>
                <Input name="current_pin" type="password" value={passwordForm.current_pin} onChange={handleFormChange(setPasswordForm, passwordForm)} required disabled={isSaving} className="border border-gray-300" />
              </div>
            </div>
            <div className="border-t pt-4">
              <CardDescription>Enter your new password.</CardDescription>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">New Password</label>
                <Input name="new_password" type="password" value={passwordForm.new_password} onChange={handleFormChange(setPasswordForm, passwordForm)} required disabled={isSaving} className="border border-gray-300" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
                <Input name="new_password_confirmation" type="password" value={passwordForm.new_password_confirmation} onChange={handleFormChange(setPasswordForm, passwordForm)} required disabled={isSaving} className="border border-gray-300" />
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Password Requirements</h4>
                  <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                    <li>At least 8 characters long</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <Button type="submit" className="gradient-primary text-white" disabled={isSaving}>
                {isSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <form onSubmit={handleUpdatePin} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>{userHasPin ? 'Update' : 'Set Up'} Secondary Security PIN</CardTitle>
            <CardDescription>
              {userHasPin
                ? 'Change your 6-digit PIN for two-factor authentication.'
                : 'Add an extra layer of security by setting a 6-digit PIN.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-t pt-4">
              <CardDescription>Verify your identity to proceed.</CardDescription>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Current Password</label>
                <Input name="current_password" type="password" value={pinForm.current_password} onChange={handleFormChange(setPinForm, pinForm)} required disabled={isSaving} className="border border-gray-300" />
              </div>
              {userHasPin && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Current 6-Digit PIN</label>
                  <Input name="current_pin" type="password" value={pinForm.current_pin} onChange={handleFormChange(setPinForm, pinForm)} required disabled={isSaving} className="border border-gray-300" />
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <CardDescription>Enter your new 6-digit PIN.</CardDescription>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">New 6-Digit PIN</label>
                <Input name="new_pin" type="password" value={pinForm.new_pin} onChange={handleFormChange(setPinForm, pinForm)} required disabled={isSaving} className="border border-gray-300" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm New PIN</label>
                <Input name="new_pin_confirmation" type="password" value={pinForm.new_pin_confirmation} onChange={handleFormChange(setPinForm, pinForm)} required disabled={isSaving} className="border border-gray-300" />
              </div>
            </div>
            <div>
              <Button type="submit" className="gradient-primary text-white" disabled={isSaving}>
                {isSaving ? 'Saving...' : (userHasPin ? 'Update PIN' : 'Set PIN')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSettings();
      case 'security': return renderSecuritySettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <motion.div className="p-6 space-y-6 max-w-7xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <SuccessAlert isVisible={successAlert.isVisible} message={successAlert.message} onClose={() => setSuccessAlert({ ...successAlert, isVisible: false })} />
      <ValidationErrorModal isOpen={!!modalError} message={modalError} onClose={() => setModalError('')} />
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onSubmit={handleOtpSubmit}
      />

      <motion.div variants={itemVariants}>
        <div className="gradient-soft rounded-2xl p-8 border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <SettingsIcon className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Settings
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your account preferences and security.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left ${activeTab === tab.id ? 'bg-[var(--dominant-red)] text-white' : 'hover:bg-gray-50'}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;