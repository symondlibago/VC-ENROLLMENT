import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Check, Loader2, KeyRound, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import ValidationErrorModal from './ValidationErrorModal'; // Import the new modal

const AddStaffModal = ({ isOpen, onClose, onSave, staff = null }) => {
  const isEditMode = Boolean(staff);

  const [formData, setFormData] = useState({
    name: '', email: '', role: '',
    password: '', password_confirmation: '',
    secondary_pin: '', secondary_pin_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(null); // State for validation modal

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          name: staff.name || '',
          email: staff.email || '',
          role: staff.role || '',
          password: '', password_confirmation: '',
          secondary_pin: '', secondary_pin_confirmation: '',
        });
      } else {
        setFormData({
          name: '', email: '', role: '', password: '', password_confirmation: '',
          secondary_pin: '', secondary_pin_confirmation: '',
        });
      }
    }
  }, [isOpen, staff, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData, staff?.id);
      toast.success(`Staff ${isEditMode ? 'updated' : 'added'} successfully!`);
      onClose();
    } catch (error) {
      // Check for validation errors from the API
      if (error.errors) {
        const messages = Object.values(error.errors).flat().join('\n');
        setValidationError(messages);
      } else {
        const errorMessage = `Failed to ${isEditMode ? 'update' : 'add'} staff`;
        toast.error(errorMessage);
      }
      console.error('Failed to save staff:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
        >
          {/* Validation Error Modal is rendered here */}
          <ValidationErrorModal 
            isOpen={!!validationError} 
            onClose={() => setValidationError(null)} 
            message={validationError} 
          />

          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold heading-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 text-[var(--dominant-red)] mr-2" />
                {isEditMode ? 'Edit Admin Staff' : 'Add Admin Staff'}
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="border border-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                    {/* The `value` prop ensures the role is displayed on edit */}
                    <Select onValueChange={handleSelectChange} value={formData.role} required>
                      <SelectTrigger className="border border-gray-300"><SelectValue placeholder="Select a role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Program Head">Program Head</SelectItem>
                        <SelectItem value="Cashier">Cashier</SelectItem>
                        <SelectItem value="Registrar">Registrar</SelectItem>
                         {isEditMode && staff.role === 'Admin' && <SelectItem value="Admin">Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="border border-gray-300" />
                </div>
                
                {!isEditMode && (
                  <>
                    <div className="border-t pt-4 mt-2">
                      <Label className="flex items-center text-gray-600"><KeyRound className="w-4 h-4 mr-2" /> Set Account Password</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="password">Password <span className="text-red-500">*</span></Label><Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className="border border-gray-300" /></div>
                      <div className="space-y-2"><Label htmlFor="password_confirmation">Confirm Password <span className="text-red-500">*</span></Label><Input id="password_confirmation" name="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleChange} required className="border border-gray-300" /></div>
                    </div>
                    <div className="border-t pt-4 mt-2">
                      <Label className="flex items-center text-gray-600"><Shield className="w-4 h-4 mr-2" /> Set 6-Digit Security PIN (Optional)</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="secondary_pin">New PIN</Label><Input id="secondary_pin" name="secondary_pin" type="password" maxLength="6" value={formData.secondary_pin} onChange={handleChange} className="border border-gray-300" /></div>
                      <div className="space-y-2"><Label htmlFor="secondary_pin_confirmation">Confirm PIN</Label><Input id="secondary_pin_confirmation" name="secondary_pin_confirmation" type="password" maxLength="6" value={formData.secondary_pin_confirmation} onChange={handleChange} className="border border-gray-300" /></div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button type="submit" className="gradient-primary text-white" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {isEditMode ? 'Save Changes' : 'Add Staff'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddStaffModal;