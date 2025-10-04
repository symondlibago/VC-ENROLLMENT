import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scheduleAPI } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AddScheduleModal from './AddScheduleModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { toast } from 'sonner';

const ScheduleModal = ({ isOpen, onClose, subject = null }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // YOUR ORIGINAL useEffect is preserved
  useEffect(() => {
    if (isOpen && subject) {
      fetchSchedules();
    }
  }, [isOpen, subject]);

  // YOUR ORIGINAL fetchSchedules is preserved
  const fetchSchedules = async () => {
    if (!subject) return;
    
    setLoading(true);
    try {
      const response = await scheduleAPI.getBySubject(subject.id);
      if (response.status === 'success') {
        setSchedules(response.data);
      } else {
        console.error('Failed to fetch schedules:', response.message);
        toast.error('Failed to fetch schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('An error occurred while fetching schedules');
    } finally {
      setLoading(false);
    }
  };

  // YOUR ORIGINAL handler functions are preserved
  const handleAddSchedule = () => {
    setIsEditMode(false);
    setCurrentSchedule(null);
    setIsAddScheduleModalOpen(true);
  };

  const handleScheduleAdded = () => {
    setIsAddScheduleModalOpen(false);
    setIsEditMode(false);
    setCurrentSchedule(null);
    fetchSchedules();
  };

  const handleEditSchedule = (schedule) => {
    setCurrentSchedule(schedule);
    setIsEditMode(true);
    setIsAddScheduleModalOpen(true);
  };

  const handleDeleteSchedule = (schedule) => {
    setCurrentSchedule(schedule);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!currentSchedule) return;
    
    setDeleteLoading(true);
    try {
      const response = await scheduleAPI.delete(currentSchedule.id);
      if (response.status === 'success') {
        toast.success('Schedule deleted successfully!');
        fetchSchedules();
      } else {
        toast.error('Failed to delete schedule.');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('An error occurred during deletion.');
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setCurrentSchedule(null);
    }
  };

  // YOUR ORIGINAL Animation variants are preserved
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold heading-bold text-gray-900 flex items-center">
                  <Calendar className="w-6 h-6 text-[var(--dominant-red)] mr-3" />
                  Schedule of {subject ? subject.descriptive_title : 'Subject'}
                </h2>
                <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] flex-grow">
                <div className="flex justify-end mb-6">
                  <Button className="gradient-primary text-white liquid-button" onClick={handleAddSchedule}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dominant-red)]"></div>
                  </div>
                ) : schedules.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">{schedule.day}</TableCell>
                            <TableCell className="font-mono">{schedule.time}</TableCell>
                            <TableCell>{schedule.room_no}</TableCell>
                            {/* MODIFIED: Display instructor name from object */}
                            <TableCell>{schedule.instructor?.name || 'Unassigned'}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditSchedule(schedule)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteSchedule(schedule)} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Calendar className="w-16 h-16 text-gray-200 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Schedules Available</h3>
                    <p className="text-gray-600 text-center max-w-md">
                      Click the "Add Schedule" button to create the first schedule for this subject.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          <AddScheduleModal 
            isOpen={isAddScheduleModalOpen} 
            onClose={() => {
              setIsAddScheduleModalOpen(false);
              setIsEditMode(false);
              setCurrentSchedule(null);
            }}
            onScheduleAdded={handleScheduleAdded}
            subject={subject}
            schedule={isEditMode ? currentSchedule : null}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDeleteSchedule}
            title="Delete Schedule"
            message="Are you sure you want to delete this schedule? This action cannot be undone."
            isLoading={deleteLoading}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default ScheduleModal;