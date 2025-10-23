import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Check, Loader2, KeyRound,Eye, EyeOff} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import ValidationErrorModal from './ValidationErrorModal'; // Import the new modal

const AddInstructorModal = ({ isOpen, onClose, onSave, instructor }) => {
  const isEditMode = Boolean(instructor);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  
  const [formData, setFormData] = useState({
    name: '', title: '', email: '', department: '', status: 'Active',
    is_featured: false, password: '', password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(null); // State for validation modal

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && instructor) {
        setFormData({
          name: instructor.name || '',
          title: instructor.title || '',
          email: instructor.email || '',
          department: instructor.department || '',
          status: instructor.status || 'Active',
          is_featured: instructor.is_featured || false,
          password: '',
          password_confirmation: '',
        });
      } else {
        setFormData({
          name: '', title: '', email: '', department: '', status: 'Active',
          is_featured: false, password: '', password_confirmation: '',
        });
      }
    }
  }, [instructor, isEditMode, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (isEditMode) {
        delete payload.password;
        delete payload.password_confirmation;
      }
      await onSave(payload, instructor?.id);
      toast.success(`Instructor ${isEditMode ? 'updated' : 'added'} successfully!`);
      onClose();
    } catch (error) {
      if (error.errors) {
        const messages = Object.values(error.errors).flat().join('\n');
        setValidationError(messages);
      } else {
        const errorMessage = `Failed to ${isEditMode ? 'update' : 'add'} instructor`;
        toast.error(errorMessage);
      }
      console.error('Failed to save instructor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ValidationErrorModal 
            isOpen={!!validationError} 
            onClose={() => setValidationError(null)} 
            message={validationError} 
          />

          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b bg-red-800">
            <h2 className="text-xl font-bold text-white flex items-center">
              <User className="w-5 h-5 text-white mr-2" />
              {isEditMode ? 'Edit Instructor' : 'Add New Instructor'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:text-red-800 hover:bg-white cursor-pointer">
              <X className="w-5 h-5" />
            </Button>
          </div>


            <form onSubmit={handleSubmit}>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="name" name="name" placeholder="e.g., Dr. John Doe" value={formData.name} onChange={handleChange} required className="border border-gray-300"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title / Position <span className="text-red-500">*</span></Label>
                    <Input id="title" name="title" placeholder="e.g., Professor of Science" value={formData.title} onChange={handleChange} required className="border border-gray-300"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input id="email" name="email" type="email" placeholder="e.g., j.doe@university.edu" value={formData.email} onChange={handleChange} required className="border border-gray-300"/>
                </div>
                
                {!isEditMode && (
                <>
                  <div className="border-t pt-4 mt-2">
                    <Label className="flex items-center text-gray-600">
                      <KeyRound className="w-4 h-4 mr-2" /> Set Account Password
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Password field */}
                    <div className="space-y-2 relative">
                      <Label htmlFor="password">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange}
                          required={!isEditMode}
                          className="border border-gray-300 pr-10" // add padding-right for icon space
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password field */}
                    <div className="space-y-2 relative">
                      <Label htmlFor="password_confirmation">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password_confirmation"
                          name="password_confirmation"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.password_confirmation}
                          onChange={handleChange}
                          required={!isEditMode}
                          className="border border-gray-300 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(value) => handleSelectChange('department', value)} value={formData.department} required>
                      <SelectTrigger className="border border-gray-300"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deiploma">Diploma</SelectItem>
                        <SelectItem value="bachelor">Bachelor</SelectItem>
                        <SelectItem value="shs">Senior High School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status} required>
                      <SelectTrigger className="border border-gray-300"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleSwitchChange('is_featured', checked)}
                    className="border-2 border-gray-300 bg-red-200 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <Label htmlFor="is_featured">Featured Instructor</Label>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button type="submit" className="gradient-primary text-white" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {isEditMode ? 'Save Changes' : 'Add Instructor'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddInstructorModal;