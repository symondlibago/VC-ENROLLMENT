import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, MoreVertical, Download, Edit, Trash2, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { instructorAPI } from '@/services/api';

// Import the new components
import AddInstructorModal from '@/components/modals/AddInstructorModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import LoadingSpinner from '../layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert';


const Instructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert State
  const [alertState, setAlertState] = useState({ 
    isVisible: false, 
    message: '', 
    type: 'success' 
  });

  const showAlert = (message, type = 'success') => {
    setAlertState({ isVisible: true, message, type });
  };

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await instructorAPI.getAll();
      if (response.success) {
        setInstructors(response.data);
      }
    } catch (error) {
      showAlert('Failed to fetch instructors.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);
  
  const handleAddClick = () => {
    setSelectedInstructor(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (instructor) => {
    setSelectedInstructor(instructor);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (instructor) => {
    setSelectedInstructor(instructor);
    setIsDeleteModalOpen(true);
  };

  const handleSaveInstructor = async (formData, instructorId) => {
    // This function is passed to the modal, which will call it on submit.
    // The modal's internal handleSubmit will handle its own loading state and call this.
    try {
      if (instructorId) {
        await instructorAPI.update(instructorId, formData);
        showAlert('Instructor updated successfully!', 'success');
      } else {
        await instructorAPI.create(formData);
        showAlert('Instructor added successfully!', 'success');
      }
      fetchInstructors(); // Refresh the list
    } catch (error) {
      // Re-throw the error so the modal can catch it and display a message.
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInstructor) return;
    setIsSubmitting(true);
    try {
      await instructorAPI.delete(selectedInstructor.id);
      showAlert('Instructor deleted successfully!');
      fetchInstructors();
      setIsDeleteModalOpen(false);
      setSelectedInstructor(null);
    } catch (error) {
      showAlert('Failed to delete instructor.', 'error');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } } };

  const getDepartmentColor = (department) => {
    const colors = {
      engineering: 'bg-blue-100 text-blue-800', humanities: 'bg-orange-100 text-orange-800', sciences: 'bg-green-100 text-green-800',
      arts: 'bg-purple-100 text-purple-800', business: 'bg-teal-100 text-teal-800',
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  const filteredInstructors = instructors.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || inst.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <>
      <SuccessAlert
        isVisible={alertState.isVisible}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState({ ...alertState, isVisible: false })}
      />
      <AddInstructorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInstructor}
        instructor={selectedInstructor}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Instructor"
        message={`Are you sure you want to delete ${selectedInstructor?.name}? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
      <motion.div
        className="p-6 space-y-6 max-w-7xl mx-auto"
        variants={containerVariants} initial="hidden" animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="animate-fade-in">
          <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
                  <Users className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                  Instructor Management
                </h1>
                <p className="text-gray-600 text-lg">
                  Browse, manage, and connect with the university's esteemed faculty.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="liquid-button"><Download className="w-4 h-4 mr-2" />Export List</Button>
                <Button className="gradient-primary text-white liquid-button" onClick={handleAddClick}>
                  <UserPlus className="w-4 h-4 mr-2" />Add Instructor
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Instructors Grid/List */}
        <motion.div variants={itemVariants}>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" color="red" />
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredInstructors.map((inst, index) => (
                <motion.div key={inst.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}} whileHover={{ scale: 1.02, y: -4 }} className="liquid-hover">
                  <Card className="card-hover border-0 shadow-sm text-center">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-end">
                        {inst.is_featured && <Star className="w-5 h-5 text-yellow-500 fill-current absolute top-4 left-4" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="liquid-button h-8 w-8 p-0"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditClick(inst)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDeleteClick(inst)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
                        <AvatarImage src={inst.avatar_url} alt={inst.name} />
                        <AvatarFallback className="text-2xl bg-gray-200">{inst.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>

                      <h3 className="font-bold text-lg text-gray-900">{inst.name}</h3>
                      <p className="text-sm text-[var(--dominant-red)] font-medium">{inst.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="card-hover border-0 shadow-sm">
                {/* List View Implementation would go here */}
            </Card>
          )}
        </motion.div>

        {/* Empty State */}
        {!loading && filteredInstructors.length === 0 && (
          <motion.div variants={itemVariants} className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No instructors found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria or add a new instructor.</p>
            <Button className="gradient-primary text-white liquid-button" onClick={handleAddClick}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Instructor
            </Button>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default Instructors;