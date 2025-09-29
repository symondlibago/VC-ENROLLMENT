import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, Bell, Shield, Palette, Globe, Database, Key, Mail,
  Smartphone, Monitor, Moon, Sun, Save, RefreshCw, Download,
  Upload, Trash2, Eye, EyeOff, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authAPI } from '../../services/api'; // Adjust path if needed

// Import the modals
import SuccessAlert from '../modals/SuccessAlert';
import ValidationErrorModal from '../modals/ValidationErrorModal';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // --- NEW: State for form data and API interaction ---
  const [currentUser, setCurrentUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [successAlert, setSuccessAlert] = useState({ isVisible: false, message: '' });
  const [modalError, setModalError] = useState('');

  // --- NEW: Load user data on component mount ---
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

  // --- NEW: Handlers for form input changes ---
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };
  
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  // --- NEW: Handler for profile update submission ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError('');
    try {
      const result = await authAPI.updateProfile(profileForm);
      setSuccessAlert({ isVisible: true, message: result.message || 'Profile updated successfully!' });
      setCurrentUser(authAPI.getUserData()); // Refresh user data in state
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

  // --- NEW: Handler for password change submission ---
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
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' }); // Clear fields
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


  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  // ... (keep containerVariants, itemVariants, ToggleSwitch)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <div 
      className={`w-12 h-6 rounded-full ${
        enabled ? 'bg-[var(--dominant-red)]' : 'bg-gray-300'
      } relative cursor-pointer liquid-morph`}
      onClick={onChange}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-0.5'
      }`}></div>
    </div>
  );

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
              <Button className="gradient-primary text-white liquid-button">
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <Button variant="outline" className="liquid-button" type="button">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
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

  const renderNotificationSettings = () => (
    // ... (This component remains unchanged)
    <div className="space-y-6">
      <Card className="card-hover border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold heading-bold">Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            {
              title: 'Email Notifications',
              description: 'Receive notifications via email',
              icon: Mail,
              settings: [
                { name: 'New enrollments', enabled: true },
                { name: 'Payment confirmations', enabled: true },
                { name: 'System updates', enabled: false },
                { name: 'Weekly reports', enabled: true }
              ]
            },
            {
              title: 'Push Notifications',
              description: 'Browser push notifications',
              icon: Bell,
              settings: [
                { name: 'Urgent alerts', enabled: true },
                { name: 'Daily summaries', enabled: false },
                { name: 'Course updates', enabled: true },
                { name: 'Student messages', enabled: true }
              ]
            },
          ].map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={category.title} className="p-6 border border-gray-200 rounded-xl liquid-morph">
                <div className="flex items-center space-x-3 mb-4">
                  <Icon className="w-6 h-6 text-[var(--dominant-red)]" />
                  <div>
                    <h3 className="font-bold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {category.settings.map((setting, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{setting.name}</span>
                      <ToggleSwitch enabled={setting.enabled} onChange={() => {}} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
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
                  <li>• Include at least one number</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button type="submit" className="gradient-primary text-white liquid-button" disabled={isSaving}>
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );

  // ... (keep renderAppearanceSettings, renderSystemSettings, renderIntegrationsSettings, renderTabContent)
  
  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <Card className="card-hover border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold heading-bold">Appearance & Theme</CardTitle>
          <CardDescription>Customize the look and feel of your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Theme</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Light', icon: Sun, active: !isDarkMode },
                { name: 'Dark', icon: Moon, active: isDarkMode },
                { name: 'Auto', icon: Monitor, active: false }
              ].map((theme) => {
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.name}
                    className={`p-4 border-2 rounded-xl liquid-morph text-center ${
                      theme.active 
                        ? 'border-[var(--dominant-red)] bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => theme.name === 'Dark' && setIsDarkMode(!isDarkMode)}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${
                      theme.active ? 'text-[var(--dominant-red)]' : 'text-gray-600'
                    }`} />
                    <p className={`font-medium ${
                      theme.active ? 'text-[var(--dominant-red)]' : 'text-gray-900'
                    }`}>
                      {theme.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
       <Card className="card-hover border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold heading-bold">System Configuration</CardTitle>
          <CardDescription>Manage system-wide settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Data Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="liquid-button">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="liquid-button">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 liquid-button">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrationsSettings = () => (
     <div className="space-y-6">
      <Card className="card-hover border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold heading-bold">Third-party Integrations</CardTitle>
          <CardDescription>Connect with external services and applications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content can be added here */}
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'appearance': return renderAppearanceSettings();
      case 'system': return renderSystemSettings();
      case 'integrations': return renderIntegrationsSettings();
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
       {/* --- NEW: Add Modals --- */}
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
                Manage your account preferences, security, and system configuration.
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