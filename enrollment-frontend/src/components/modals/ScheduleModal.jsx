import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, ChevronDown, MoreVertical, Edit, Trash } from 'lucide-react';
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

const ScheduleModal = ({ isOpen, onClose, subject = null }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch schedules when subject changes or modal opens
  useEffect(() => {
    if (isOpen && subject) {
      fetchSchedules();
    }
  }, [isOpen, subject]);

  const fetchSchedules = async () => {
    if (!subject) return;
    
    setLoading(true);
    try {
      const response = await scheduleAPI.getBySubject(subject.id);
      if (response.status === 'success') {
        setSchedules(response.data);
      } else {
        console.error('Failed to fetch schedules:', response.message);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = () => {
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
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setCurrentSchedule(null);
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold heading-bold text-gray-900 flex items-center">
                  <Calendar className="w-6 h-6 text-[var(--dominant-red)] mr-3" />
                  Schedule of {subject ? subject.descriptive_title : 'Subject'}
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
                {/* Add Schedule Button */}
                <div className="flex justify-end mb-6">
                  <Button
                    className="gradient-primary text-white liquid-button"
                    onClick={handleAddSchedule}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>

                {/* Schedules Table */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dominant-red)]"></div>
                  </div>
                ) : schedules.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Instructor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">{schedule.day}</TableCell>
                            <TableCell>{schedule.time}</TableCell>
                            <TableCell>{schedule.room_no}</TableCell>
                            <TableCell className="flex items-center justify-between">
                              <span>{schedule.instructor}</span>
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
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteSchedule(schedule)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
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
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-[var(--dominant-red)]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Schedules Available</h3>
                    <p className="text-gray-600 text-center max-w-md">
                      There are currently no schedules available for this subject. Click the "Add Schedule" button to add schedules.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-between">
                <div>
                  {schedules.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Showing {schedules.length} schedule(s)
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="liquid-button"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* Add/Edit Schedule Modal */}
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

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDeleteSchedule}
            title="Delete Schedule"
            message="Are you sure you want to delete this schedule? This action cannot be undone."
            itemName={currentSchedule ? `${currentSchedule.day} - ${currentSchedule.time}` : ""}
            isLoading={deleteLoading}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default ScheduleModal;