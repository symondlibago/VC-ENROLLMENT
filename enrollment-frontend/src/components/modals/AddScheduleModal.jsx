import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { scheduleAPI, instructorAPI, sectionAPI } from '@/services/api';
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
    instructor_id: '', 
    section_id: '',
    subject_id: subject?.id || ''
  });
  
  const [instructors, setInstructors] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 1. Fetch Data (Instructors & Sections)
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoadingInstructors(true);
        try {
          const [instRes, sectRes] = await Promise.all([
            instructorAPI.getAll(),
            sectionAPI.getAll()
          ]);

          if (instRes.success) {
            setInstructors(instRes.data);
          }

          if (sectRes.success) {
            if (subject && subject.course_id) {
                const relevantSections = sectRes.data.filter(s => s.course_id === subject.course_id);
                setSections(relevantSections);
            } else {
                setSections(sectRes.data);
            }
          }
        } catch (error) {
          toast.error("Failed to fetch form data.");
          console.error(error);
        } finally {
          setLoadingInstructors(false);
        }
      };
      fetchData();
    }
  }, [isOpen, subject]);

  // 2. Populate Form Data for Edit Mode
  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        // Safe extraction of IDs
        const instructorId = schedule.instructor_id 
          ? schedule.instructor_id.toString() 
          : (schedule.instructor?.id ? schedule.instructor.id.toString() : '');

        const sectionId = schedule.section_id 
          ? schedule.section_id.toString() 
          : (schedule.section?.id ? schedule.section.id.toString() : '');

        setFormData({
          day: schedule.day || '',
          time: schedule.time || '',
          room_no: schedule.room_no || '',
          instructor_id: instructorId,
          section_id: sectionId,
          subject_id: schedule.subject_id || subject?.id || ''
        });
      } else {
        // Reset for Add Mode
        setFormData({
          day: '',
          time: '',
          room_no: '',
          instructor_id: '',
          section_id: '',
          subject_id: subject?.id || ''
        });
      }
    }
  }, [isOpen, schedule, subject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === 'none-value' ? '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.day) {
      toast.error('Please select a day');
      return;
    }
    if (!formData.instructor_id) {
        toast.error('Please select an instructor');
        return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        section_id: formData.section_id === '' || formData.section_id === 'none-value' ? null : formData.section_id
      };

      if (schedule) {
        await scheduleAPI.update(schedule.id, payload);
        toast.success('Schedule updated successfully');
      } else {
        await scheduleAPI.create(payload);
        toast.success('Schedule added successfully');
      }
      onScheduleAdded();
      onClose();
    } catch (error) {
      console.error(`Error ${schedule ? 'updating' : 'adding'} schedule:`, error);
      toast.error(`Failed to ${schedule ? 'update' : 'add'} schedule`);
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
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

          <div className="flex items-center justify-between p-5 border-b bg-red-800 rounded-t-2xl">
            <h2 className="text-xl font-bold text-white flex items-center">
            <Calendar className="w-5 h-5 text-white mr-2" />
                  {schedule ? 'Edit Schedule' : 'Add Schedule'}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="text-white hover:text-red-800 hover:bg-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="day">Day <span className="text-red-500">*</span></Label>
                      <Select 
                        onValueChange={(value) => handleSelectChange('day', value)}
                        value={formData.day} // Ensure this uses 'value' not defaultValue
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

                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input id="time" name="time" placeholder="e.g., 9:00 AM - 10:30 AM" value={formData.time} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="room_no">Room Number</Label>
                      <Input id="room_no" name="room_no" placeholder="e.g., Room 101" value={formData.room_no} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section_id">Section (Optional)</Label>
                      <Select
                        // FIX: Key prop forces re-render when data loads
                        key={`section-select-${sections.length}`}
                        onValueChange={(value) => handleSelectChange('section_id', value)}
                        value={formData.section_id}
                        disabled={loadingInstructors}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingInstructors ? "Loading..." : "Select a section (or All)"} />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="none-value">All Sections</SelectItem>
                          {sections.map((sec) => (
                            <SelectItem key={sec.id} value={sec.id.toString()}>
                              {sec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Leave as "All Sections" if this schedule applies to the entire class.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructor_id">Instructor</Label>
                      <Select
                        // FIX: Key prop forces re-render when data loads
                        key={`instructor-select-${instructors.length}`}
                        onValueChange={(value) => handleSelectChange('instructor_id', value)}
                        value={formData.instructor_id}
                        disabled={loadingInstructors}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingInstructors ? "Loading..." : "Select an instructor"} />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((inst) => (
                            <SelectItem key={inst.id} value={inst.id.toString()}>
                              {inst.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="button" variant="outline" onClick={onClose} className="mr-2 cursor-pointer" disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" className="gradient-primary text-white liquid-button cursor-pointer" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2"/>
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