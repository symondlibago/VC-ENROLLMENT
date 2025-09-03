import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

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
    <div className="space-y-6">
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
                AD
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button className="gradient-primary text-white liquid-button">
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <Button variant="outline" className="liquid-button">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">First Name</label>
              <Input defaultValue="Admin" className="liquid-morph" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Last Name</label>
              <Input defaultValue="User" className="liquid-morph" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
              <Input defaultValue="admin@eduenroll.com" type="email" className="liquid-morph" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</label>
              <Input defaultValue="+1 (555) 123-4567" className="liquid-morph" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Bio</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph"
                rows="3"
                defaultValue="System administrator for EduEnroll management platform."
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button className="gradient-primary text-white liquid-button">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" className="liquid-button">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
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
            {
              title: 'SMS Notifications',
              description: 'Text message alerts',
              icon: Smartphone,
              settings: [
                { name: 'Critical system alerts', enabled: true },
                { name: 'Payment failures', enabled: true },
                { name: 'Security alerts', enabled: true },
                { name: 'Maintenance notices', enabled: false }
              ]
            }
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
    <div className="space-y-6">
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
                  type={showPassword ? "text" : "password"} 
                  className="liquid-morph pr-10" 
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
              <Input type="password" className="liquid-morph" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm New Password</label>
              <Input type="password" className="liquid-morph" />
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
                  <li>• Include at least one special character</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">SMS Authentication</h5>
                <p className="text-sm text-gray-500">Receive codes via text message</p>
              </div>
              <ToggleSwitch enabled={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Email Authentication</h5>
                <p className="text-sm text-gray-500">Receive codes via email</p>
              </div>
              <ToggleSwitch enabled={false} onChange={() => {}} />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button className="gradient-primary text-white liquid-button">
              <Save className="w-4 h-4 mr-2" />
              Update Password
            </Button>
            <Button variant="outline" className="liquid-button">
              <Key className="w-4 h-4 mr-2" />
              Generate Strong Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Color Scheme</h4>
            <div className="grid grid-cols-6 gap-3">
              {[
                '#9c262c', '#dc2626', '#ea580c', '#ca8a04', 
                '#16a34a', '#0891b2', '#2563eb', '#7c3aed'
              ].map((color, index) => (
                <button
                  key={color}
                  className={`w-12 h-12 rounded-xl liquid-morph border-2 ${
                    color === '#9c262c' ? 'border-gray-400' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Display Options</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">Compact Mode</h5>
                  <p className="text-sm text-gray-500">Reduce spacing and padding</p>
                </div>
                <ToggleSwitch enabled={false} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">Animations</h5>
                  <p className="text-sm text-gray-500">Enable smooth transitions</p>
                </div>
                <ToggleSwitch enabled={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">High Contrast</h5>
                  <p className="text-sm text-gray-500">Improve accessibility</p>
                </div>
                <ToggleSwitch enabled={false} onChange={() => {}} />
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Default Language</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph">
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Timezone</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph">
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC-6 (Central Time)</option>
                <option>UTC-7 (Mountain Time)</option>
                <option>UTC-8 (Pacific Time)</option>
              </select>
            </div>
          </div>

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

          <div>
            <h4 className="font-medium text-gray-900 mb-4">System Status</h4>
            <div className="space-y-3">
              {[
                { label: 'Database Connection', status: 'Connected', color: 'text-green-600' },
                { label: 'Email Service', status: 'Active', color: 'text-green-600' },
                { label: 'File Storage', status: 'Available', color: 'text-green-600' },
                { label: 'Backup Service', status: 'Running', color: 'text-green-600' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                  <Badge className={`${item.color} bg-transparent`}>
                    <Check className="w-3 h-3 mr-1" />
                    {item.status}
                  </Badge>
                </div>
              ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'Google Workspace',
                description: 'Sync with Google Calendar and Drive',
                connected: true,
                icon: Globe
              },
              {
                name: 'Microsoft Office 365',
                description: 'Integration with Office apps',
                connected: false,
                icon: Globe
              },
              {
                name: 'Zoom',
                description: 'Video conferencing integration',
                connected: true,
                icon: Globe
              },
              {
                name: 'Slack',
                description: 'Team communication and notifications',
                connected: false,
                icon: Globe
              },
              {
                name: 'PayPal',
                description: 'Payment processing integration',
                connected: true,
                icon: Globe
              },
              {
                name: 'Stripe',
                description: 'Credit card payment processing',
                connected: false,
                icon: Globe
              }
            ].map((integration, index) => {
              const Icon = integration.icon;
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-xl liquid-morph">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-8 h-8 text-[var(--dominant-red)]" />
                      <div>
                        <h3 className="font-medium text-gray-900">{integration.name}</h3>
                        <p className="text-sm text-gray-500">{integration.description}</p>
                      </div>
                    </div>
                    <Badge className={integration.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {integration.connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant={integration.connected ? "outline" : "default"}
                    className={integration.connected ? "liquid-button" : "gradient-primary text-white liquid-button"}
                  >
                    {integration.connected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'system':
        return renderSystemSettings();
      case 'integrations':
        return renderIntegrationsSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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

