import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { scheduleAPI } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const AddScheduleModal = ({ isOpen, onClose, onScheduleAdded, subject = null, schedule = null }) => {
  const [formData, setFormData] = useState({
    day: '',
    time: '',
    room_no: '',
    instructor: '',
    subject_id: subject?.id || ''
  });
  const [loading, setLoading] = useState(false);
  
  // Initialize form data when editing an existing schedule
  useEffect(() => {
    if (schedule) {
      console.log('Editing schedule:', schedule);
      console.log('Schedule day value:', schedule.day);
      
      // Force a small delay to ensure the component is fully mounted
      setTimeout(() => {
        const dayValue = schedule.day || '';
        console.log('Setting day value to:', dayValue);
        
        setFormData({
          day: dayValue,
          time: schedule.time || '',
          room_no: schedule.room_no || '',
          instructor: schedule.instructor || '',
          subject_id: schedule.subject_id || subject?.id || ''
        });
        
        console.log('Form data after setting:', {
          day: dayValue,
          time: schedule.time || '',
          room_no: schedule.room_no || '',
          instructor: schedule.instructor || '',
          subject_id: schedule.subject_id || subject?.id || ''
        });
      }, 100);
    } else if (isOpen) {
      // Reset form when opening in add mode
      setFormData({
        day: '',
        time: '',
        room_no: '',
        instructor: '',
        subject_id: subject?.id || ''
      });
    }
  }, [schedule, subject, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    console.log(`handleSelectChange called with name=${name}, value=${value}`);
    console.log('Previous formData:', formData);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('New formData:', newData);
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.day) {
      toast.error('Please select a day');
      return;
    }

    if (!formData.subject_id) {
      toast.error('Subject ID is required');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (schedule) {
        // Update existing schedule
        response = await scheduleAPI.update(schedule.id, formData);
        toast.success('Schedule updated successfully');
        onScheduleAdded();
        onClose();
      } else {
        // Create new schedule
        response = await scheduleAPI.create(formData);
        toast.success('Schedule added successfully');
        onScheduleAdded();
        onClose();
        setFormData({
            day: '',
            time: '',
            room_no: '',
            instructor: '',
            subject_id: subject?.id || ''
          });
      }
    } catch (error) {
      console.error(`Error ${schedule ? 'updating' : 'adding'} schedule:`, error);
      toast.error(`Failed to ${schedule ? 'update' : 'add'} schedule`);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold heading-bold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 text-[var(--dominant-red)] mr-2" />
                  {schedule ? 'Edit Schedule' : 'Add Schedule'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Day Select */}
                    <div className="space-y-2">
                      <Label htmlFor="day">Day <span className="text-red-500">*</span></Label>
                      <Select 
                        onValueChange={(value) => {
                          console.log('Day selected:', value);
                          handleSelectChange('day', value);
                        }}
                        value={formData.day || undefined}
                        defaultValue={formData.day || undefined}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select day" />                          
                        </SelectTrigger>
                        <SelectContent>
                          {days.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time Input */}
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        name="time"
                        placeholder="e.g., 9:00 AM - 10:30 AM"
                        value={formData.time}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Room Number Input */}
                    <div className="space-y-2">
                      <Label htmlFor="room_no">Room Number</Label>
                      <Input
                        id="room_no"
                        name="room_no"
                        placeholder="e.g., Room 101"
                        value={formData.room_no}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Instructor Input */}
                    <div className="space-y-2">
                      <Label htmlFor="instructor">Instructor</Label>
                      <Input
                        id="instructor"
                        name="instructor"
                        placeholder="e.g., John Doe"
                        value={formData.instructor}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="mr-2"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="gradient-primary text-white liquid-button"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {schedule ? 'Update Schedule' : 'Save Schedule'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddScheduleModal;