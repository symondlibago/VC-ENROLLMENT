import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Check, Loader2, KeyRound } from 'lucide-react'; // Import KeyRound icon
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

const AddInstructorModal = ({ isOpen, onClose, onSave, instructor }) => {
  const isEditMode = Boolean(instructor);
  
  const getInitialFormData = () => ({
    name: '',
    title: '',
    email: '',
    department: '',
    status: 'Active',
    is_featured: false,
    password: '',
    password_confirmation: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [loading, setLoading] = useState(false);

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
        setFormData(getInitialFormData());
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
      // Create a payload without password fields if in edit mode
      const payload = { ...formData };
      if (isEditMode) {
        delete payload.password;
        delete payload.password_confirmation;
      }

      await onSave(payload, instructor?.id);
      toast.success(`Instructor ${isEditMode ? 'updated' : 'added'} successfully!`);
      onClose();
    } catch (error) {
      console.error('Failed to save instructor:', error);
      const errorMessage = error.errors ? Object.values(error.errors).flat().join(', ') : `Failed to ${isEditMode ? 'update' : 'add'} instructor`;
      toast.error(errorMessage);
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
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold heading-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 text-[var(--dominant-red)] mr-2" />
                {isEditMode ? 'Edit Instructor' : 'Add New Instructor'}
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="name" name="name" placeholder="e.g., Dr. John Doe" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title / Position <span className="text-red-500">*</span></Label>
                    <Input id="title" name="title" placeholder="e.g., Professor of Science" value={formData.title} onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input id="email" name="email" type="email" placeholder="e.g., j.doe@university.edu" value={formData.email} onChange={handleChange} required />
                </div>
                
                {/* --- PASSWORD FIELDS: Only show in Add Mode --- */}
                {!isEditMode && (
                  <>
                    <div className="border-t pt-4 mt-2">
                      <Label className="flex items-center text-gray-600">
                        <KeyRound className="w-4 h-4 mr-2" />
                        Set Account Password
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                        <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required={!isEditMode} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Confirm Password <span className="text-red-500">*</span></Label>
                        <Input id="password_confirmation" name="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleChange} required={!isEditMode}/>
                      </div>
                    </div>
                  </>
                )}
                 {/* --- END PASSWORD FIELDS --- */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(value) => handleSelectChange('department', value)} value={formData.department} required>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="humanities">Humanities</SelectItem>
                        <SelectItem value="sciences">Sciences</SelectItem>
                        <SelectItem value="arts">Arts</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status} required>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => handleSwitchChange('is_featured', checked)} />
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