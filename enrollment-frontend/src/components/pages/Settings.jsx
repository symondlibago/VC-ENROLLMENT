import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, Shield, Save, Eye, EyeOff, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authAPI } from '../../services/api';

// Import the modals
import SuccessAlert from '../modals/SuccessAlert';
import ValidationErrorModal from '../modals/ValidationErrorModal';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [pinForm, setPinForm] = useState({ current_password: '', new_pin: '', new_pin_confirmation: '' });

  const [isSaving, setIsSaving] = useState(false);
  const [successAlert, setSuccessAlert] = useState({ isVisible: false, message: '' });
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const user = authAPI.getUserData();
    if (user) {
      setCurrentUser(user);
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };
  
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };
  
  // --- FIXED: Replaced handlePinChange with a more robust handler ---
  const handlePinFormChange = (e) => {
    const { name, value } = e.target;
    // For PIN fields, only allow numbers.
    if (name === 'new_pin' || name === 'new_pin_confirmation') {
      setPinForm({ ...pinForm, [name]: value.replace(/\D/g, '') });
    } else {
      // For the password field, allow any character.
      setPinForm({ ...pinForm, [name]: value });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError('');
    try {
      const result = await authAPI.updateProfile(profileForm);
      setSuccessAlert({ isVisible: true, message: result.message || 'Profile updated successfully!' });
      setCurrentUser(authAPI.getUserData());
    } catch (error) {
      let errorMessage = error.message || 'Profile update failed.';
      if (error.errors) {
        errorMessage = Object.values(error.errors)[0][0];
      }
      setModalError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setModalError('New passwords do not match.');
      return;
    }
    setIsSaving(true);
    setModalError('');
    try {
      const result = await authAPI.changePassword(passwordForm);
      setSuccessAlert({ isVisible: true, message: result.message || 'Password changed successfully!' });
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (error) {
      let errorMessage = error.message || 'Password change failed.';
      if (error.errors) {
        errorMessage = Object.values(error.errors)[0][0];
      }
      setModalError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (pinForm.new_pin !== pinForm.new_pin_confirmation) {
      setModalError('New PINs do not match.');
      return;
    }
    if (pinForm.new_pin.length !== 6) {
      setModalError('PIN must be exactly 6 digits.');
      return;
    }
    setIsSaving(true);
    setModalError('');
    try {
      const result = await authAPI.updatePin(pinForm);
      setSuccessAlert({ isVisible: true, message: result.message || 'PIN updated successfully!' });
      setPinForm({ current_password: '', new_pin: '', new_pin_confirmation: '' });
    } catch (error) {
      let errorMessage = error.message || 'PIN update failed.';
      if (error.errors) {
        errorMessage = Object.values(error.errors)[0][0];
      }
      setModalError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // --- MODIFIED: Removed extra tabs ---
  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
    }
  };

  const renderProfileSettings = () => (
    <form onSubmit={handleProfileUpdate} className="space-y-6">
      <Card className="card-hover border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold heading-bold">Profile Information</CardTitle>
          <CardDescription>Update your personal information and profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/api/placeholder/80/80" alt="Profile" />
              <AvatarFallback className="bg-[var(--dominant-red)] text-white text-xl font-bold">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button disabled className="gradient-primary text-white liquid-button">
                Upload Photo
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
              <Input 
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="liquid-morph" 
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
              <Input 
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="liquid-morph" 
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button type="submit" className="gradient-primary text-white liquid-button" disabled={isSaving}>
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="space-y-6">
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Password & Security</CardTitle>
            <CardDescription>Manage your account security and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Current Password</label>
                <div className="relative">
                  <Input 
                    name="current_password"
                    type={showPassword ? "text" : "password"} 
                    className="liquid-morph pr-10" 
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    required
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">New Password</label>
                <Input 
                  name="new_password"
                  type="password" 
                  className="liquid-morph" 
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  required
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm New Password</label>
                <Input 
                  name="new_password_confirmation"
                  type="password" 
                  className="liquid-morph" 
                  value={passwordForm.new_password_confirmation}
                  onChange={handlePasswordChange}
                  required
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Password Requirements</h4>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button type="submit" className="gradient-primary text-white liquid-button" disabled={isSaving}>
                {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Secondary Security PIN Form */}
      <form onSubmit={handleUpdatePin} className="space-y-6">
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Secondary Security PIN</CardTitle>
            <CardDescription>Set or update your 6-digit PIN for two-factor authentication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Current Password (for verification)</label>
                <Input 
                  name="current_password"
                  type="password"
                  className="liquid-morph"
                  value={pinForm.current_password}
                  onChange={handlePinFormChange} // --- FIXED: Using correct handler ---
                  required
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">New 6-Digit PIN</label>
                <Input
                  name="new_pin"
                  type="password"
                  maxLength="6"
                  className="liquid-morph"
                  value={pinForm.new_pin}
                  onChange={handlePinFormChange} // --- FIXED: Using correct handler ---
                  required
                  disabled={isSaving}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm New PIN</label>
                <Input
                  name="new_pin_confirmation"
                  type="password"
                  maxLength="6"
                  className="liquid-morph"
                  value={pinForm.new_pin_confirmation}
                  onChange={handlePinFormChange} // --- FIXED: Using correct handler ---
                  required
                  disabled={isSaving}
                   autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button type="submit" className="gradient-primary text-white liquid-button" disabled={isSaving}>
                {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Update PIN
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );

  // --- MODIFIED: Simplified the tab content renderer ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSettings();
      case 'security': return renderSecuritySettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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

      {/* Header Section */}
      <motion.div variants={itemVariants} className="animate-fade-in">
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
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

      {/* Settings Navigation and Content */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="card-hover border-0 shadow-sm">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left liquid-morph ${
                        activeTab === tab.id
                          ? 'bg-[var(--dominant-red)] text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;