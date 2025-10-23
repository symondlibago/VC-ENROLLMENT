import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, MoreVertical, Edit, Trash2, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { instructorAPI, userAPI } from '@/services/api';

import AddInstructorModal from '@/components/modals/AddInstructorModal';
import AddStaffModal from '@/components/modals/AddStaffModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import LoadingSpinner from '../layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert';

const FacultyAdminStaff = () => {
  const [instructors, setInstructors] = useState([]);
  const [adminStaff, setAdminStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('instructors');
  
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertState, setAlertState] = useState({ isVisible: false, message: '', type: 'success' });

  const showAlert = (message, type = 'success') => {
    setAlertState({ isVisible: true, message, type });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [instructorRes, staffRes] = await Promise.all([
        instructorAPI.getAll(),
        userAPI.getAll()
      ]);
      if (instructorRes.success) setInstructors(instructorRes.data);
      if (staffRes.success) {
        const filteredStaff = staffRes.data.filter(staff => staff.role !== 'Admin');
        setAdminStaff(filteredStaff);
      }
    } catch (error) {
      showAlert('Failed to fetch user data.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveInstructor = async (formData, instructorId) => {
    try {
      if (instructorId) {
        await instructorAPI.update(instructorId, formData);
        showAlert('Faculty member updated successfully!');
      } else {
        await instructorAPI.create(formData);
        showAlert('Faculty member added successfully!');
      }
      fetchData();
    } catch (error) {
      throw error;
    }
  };
  
  // UPDATED to handle both create and edit
  const handleSaveStaff = async (formData, staffId) => {
    try {
      if (staffId) {
        await userAPI.update(staffId, formData);
        showAlert('Admin staff updated successfully!');
      } else {
        await userAPI.create(formData);
        showAlert('Admin staff added successfully!');
      }
      fetchData();
    } catch (error) {
        throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      if (activeTab === 'instructors') {
        await instructorAPI.delete(selectedItem.id);
        showAlert('Faculty member deleted successfully!');
      } else {
        await userAPI.delete(selectedItem.id);
        showAlert('Admin staff deleted successfully!');
      }
      fetchData();
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      showAlert(`Failed to delete ${activeTab === 'instructors' ? 'faculty' : 'staff'}.`, 'error');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  
  const currentData = activeTab === 'instructors' ? instructors : adminStaff;
  const pageTitle = activeTab === 'instructors' ? 'Faculty Management' : 'Admin Staff Management';
  const pageDescription = activeTab === 'instructors' 
    ? "Browse, manage, and connect with the university's esteemed faculty."
    : "Manage users with special roles like Program Head, Cashier, and Registrar.";
  const addButtonText = activeTab === 'instructors' ? 'Add Faculty' : 'Add Admin Staff';

  return (
    <>
      <SuccessAlert {...alertState} onClose={() => setAlertState({ ...alertState, isVisible: false })} />
      <AddInstructorModal isOpen={isInstructorModalOpen} onClose={() => setIsInstructorModalOpen(false)} onSave={handleSaveInstructor} instructor={selectedItem} />
      {/* Pass selectedItem to the staff modal as the 'staff' prop */}
      <AddStaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} onSave={handleSaveStaff} staff={selectedItem}/>
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm}
        title={`Delete ${activeTab === 'instructors' ? 'Faculty' : 'Staff'}`}
        message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
        isLoading={isSubmitting}
      />

      <motion.div className="p-6 space-y-6 max-w-7xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header Section */}
        <motion.div variants={itemVariants}>
          <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
                  <Users className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                  {pageTitle}
                </h1>
                <p className="text-gray-600 text-lg">{pageDescription}</p>
              </div>
              <div className="flex items-center space-x-4">
                 {/* Toggle Button */}
                <div className="relative bg-gray-100 rounded-2xl p-1 inline-flex">
                    <motion.div className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md"
                      animate={{ left: activeTab === 'instructors' ? '4px' : '50%', right: activeTab === 'instructors' ? '50%' : '4px' }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <button onClick={() => setActiveTab('instructors')} title="Faculty" className={`relative z-10 p-3 rounded-xl transition-colors ${activeTab === 'instructors' ? 'text-[var(--dominant-red)]' : 'text-gray-600'}`}>
                        <Users className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveTab('staff')} title="Admin Staff" className={`relative z-10 p-3 rounded-xl transition-colors ${activeTab === 'staff' ? 'text-[var(--dominant-red)]' : 'text-gray-600'}`}>
                        <ShieldCheck className="w-5 h-5" />
                    </button>
                </div>
                <Button className="gradient-primary cursor-pointer text-white liquid-button" onClick={() => { setSelectedItem(null); activeTab === 'instructors' ? setIsInstructorModalOpen(true) : setIsStaffModalOpen(true); }}>
                  <UserPlus className="w-4 h-4 mr-2" />{addButtonText}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Grid Display */}
        <motion.div variants={itemVariants}>
          {loading ? ( <div className="flex justify-center items-center py-20"><LoadingSpinner size="lg" color="red" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {currentData.map((item) => (
                /* --- FIX: Removed variants={itemVariants} from this line --- */
                <motion.div key={item.id} whileHover={{ scale: 1.02, y: -4 }} className="liquid-hover">
                  <Card className="card-hover border-0 shadow-sm text-center">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-end">
                        {item.is_featured && <Star className="w-5 h-5 text-yellow-500 fill-current absolute top-4 left-4" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="liquid-button h-8 w-8 p-0 cursor-pointer"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* ADDED Edit button logic */}
                            <DropdownMenuItem onSelect={() => { setSelectedItem(item); activeTab === 'instructors' ? setIsInstructorModalOpen(true) : setIsStaffModalOpen(true); }} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4 hover:text-white" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedItem(item); setIsDeleteModalOpen(true); }} className="text-red-600 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4 hover:text-white" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-red shadow-lg">
                        <AvatarImage src={item.avatar_url} alt={item.name} />
                        <AvatarFallback className="text-2xl text-white bg-red-800">{item.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>

                      <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                      <p className="text-sm text-[var(--dominant-red)] font-medium">{item.title || item.role}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
};

export default FacultyAdminStaff;