import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, 
    Search, 
    MoreVertical, 
    Check, 
    X, 
    Users, 
    Printer, 
    CheckCircle,
    ChevronDown,
    User,
    Phone,
    MapPinned,
    Calendar,
} from 'lucide-react';

// UI & Service Imports
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { enrollmentAPI } from '@/services/api';

// Newly Integrated Components
import LoadingSpinner from '../layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert';
import ValidationErrorModal from '../modals/ValidationErrorModal';


const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white p-4 rounded-xl shadow-2xl"
            >
                <img src={imageUrl} alt="Preview" className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg" />
                <div className="absolute top-4 right-4">
                    <Button onClick={onClose} size="icon" variant="destructive">
                        <X size={20} />
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = useMemo(() => 
    options.find(opt => opt.value === value) || { label: placeholder, value: '' },
    [value, options, placeholder]
  );

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-2 focus:ring-[var(--dominant-red)]/20 liquid-morph flex items-center justify-between min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900">{selectedOption.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value} type="button" onClick={() => handleSelect(option)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }} whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
              >
                <span className="text-gray-900">{option.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const StudentIdCard = ({ student, onUpdateStatus, onImageClick, isSelected, onSelect }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        switch (status) {
            case 'Released': return 'bg-green-100 text-green-800';
            case 'Printed': return 'bg-blue-100 text-blue-800';
            case 'Pending Print': default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <Card className={`card-hover overflow-hidden relative transition-all ${isSelected ? 'ring-2 ring-[var(--dominant-red)]' : ''}`}>
            <div className="absolute top-2 right-2 z-10 bg-white/70 backdrop-blur-sm p-1 rounded-full">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(student.id)}
                    className="w-5 h-5 border-2 border-red-800"
                />
            </div>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-center items-center gap-4">
                    <button onClick={() => onImageClick(student.id_photo_url)} className="focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg">
                        <Avatar className="h-24 w-24 rounded-lg shadow-md hover:scale-105 transition-transform">
                            <AvatarImage src={student.id_photo_url} alt="ID Photo" className="object-cover" />
                            <AvatarFallback className="rounded-lg bg-gray-200 text-xs">ID Photo</AvatarFallback>
                        </Avatar>
                    </button>
                    <button onClick={() => onImageClick(student.signature_url)} className="w-24 h-24 flex items-center justify-center bg-white rounded-lg shadow-inner p-2 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-red-500">
                        <img src={student.signature_url} alt="Signature" className="object-contain max-h-full max-w-full" />
                    </button>
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-lg heading-bold">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.student_id_number}</p>
                    <p className="text-sm text-gray-600 font-medium">{student.courseName}</p>
                </div>
                
                <div className="border-t pt-3 space-y-2 text-sm">
                    <p className="font-semibold text-gray-500 text-xs mb-1">Emergency Contact</p>
                    <div className="flex items-center text-gray-800">
                        <User size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                        <span>{student.emergency_contact_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-800">
                        <Phone size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                        <span>{student.emergency_contact_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-800">
                        <MapPinned size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                        <span>{student.emergency_contact_address || 'N/A'}</span>
                    </div>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-600">Status:</span>
                        <Badge className={`${getStatusColor(student.id_status)} font-medium`}>{student.id_status || 'Pending Print'}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Calendar size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                        <span>Date Printed:</span>
                        <span className="font-medium text-gray-800">{formatDate(student.id_printed_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Calendar size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                        <span>Date Released:</span>
                        <span className="font-medium text-gray-800">{formatDate(student.id_released_at)}</span>
                    </div>
                </div>


                <div className="text-right -mb-2 -mr-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onUpdateStatus(student.id, 'printed')} disabled={student.id_status === 'Printed' || student.id_status === 'Released'}><Check size={14} className="mr-2" /> Mark as Printed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(student.id, 'released')} disabled={student.id_status === 'Released'}><Check size={14} className="mr-2" /> Mark as Released</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
};

const IDReleasing = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState(new Set());

    const [alertState, setAlertState] = useState({ isVisible: false, message: '', type: 'success' });
    const [validationError, setValidationError] = useState({ isOpen: false, message: '' });

    const handleCloseAlert = () => setAlertState({ ...alertState, isVisible: false });
    const handleCloseModal = () => setValidationError({ isOpen: false, message: '' });

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await enrollmentAPI.getStudentsForIdReleasing();
            if (!res.success) {
                 setAlertState({ isVisible: true, message: "Failed to load student data.", type: 'error' });
            }
            setStudents(res.data || []);
        } catch (error) {
            setAlertState({ isVisible: true, message: "An error occurred while fetching students.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleUpdateStatus = async (studentId, status) => {
        try {
            const res = await enrollmentAPI.updateIdStatus(studentId, status);
            if (res.success) {
                setAlertState({ isVisible: true, message: `Student ID marked as ${status}.`, type: 'success' });
                fetchStudents();
            } else {
                setAlertState({ isVisible: true, message: res.message || "Failed to update status.", type: 'error' });
            }
        } catch (error) {
            setAlertState({ isVisible: true, message: "An error occurred while updating the ID status.", type: 'error' });
        }
    };

    const handleSelectStudent = (studentId) => {
        setSelectedStudents(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(studentId)) {
                newSelected.delete(studentId);
            } else {
                newSelected.add(studentId);
            }
            return newSelected;
        });
    };

    const handleBulkMarkAsPrinted = async () => {
        const studentIds = Array.from(selectedStudents);
        if (studentIds.length === 0) {
            setValidationError({ isOpen: true, message: 'Please select at least one student to mark as printed.' });
            return;
        }

        try {
            const res = await enrollmentAPI.bulkUpdateIdStatus(studentIds, 'printed');
            if (res.success) {
                setAlertState({ isVisible: true, message: `${studentIds.length} student IDs marked as printed.`, type: 'success' });
                fetchStudents();
                setSelectedStudents(new Set());
            } else {
                setAlertState({ isVisible: true, message: res.message || "Failed to bulk update status.", type: 'error' });
            }
        } catch (error) {
            setAlertState({ isVisible: true, message: "An error occurred during the bulk update.", type: 'error' });
        }
    };

    const stats = useMemo(() => {
        const total = students.length;
        const printed = students.filter(s => s.id_status === 'Printed' || s.id_status === 'Released').length;
        const released = students.filter(s => s.id_status === 'Released').length;
        return { total, printed, released };
    }, [students]);
    
    const filterOptions = useMemo(() => [
        { label: 'Filter by All Statuses', value: 'All' },
        { label: 'Pending Print', value: 'Pending Print' },
        { label: 'Printed', value: 'Printed' },
        { label: 'Released', value: 'Released' }
    ], []);

    const filteredStudents = useMemo(() => {
        if (!Array.isArray(students)) return [];
        return students
            .filter(student => (statusFilter === 'All' ? true : (student.id_status || 'Pending Print') === statusFilter))
            .filter(student =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (student.student_id_number && student.student_id_number.includes(searchTerm)) || 
                student.courseName.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [students, searchTerm, statusFilter]);

    const handleSelectAll = () => {
        const allFilteredIds = new Set(filteredStudents.map(s => s.id));
        if (selectedStudents.size === allFilteredIds.size) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(allFilteredIds);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <SuccessAlert isVisible={alertState.isVisible} message={alertState.message} type={alertState.type} onClose={handleCloseAlert} />
            <ValidationErrorModal isOpen={validationError.isOpen} message={validationError.message} onClose={handleCloseModal} />
            <AnimatePresence>{previewImageUrl && <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}</AnimatePresence>
            
            <div className="gradient-soft rounded-2xl p-8 border border-gray-100"><h1 className="text-3xl font-bold heading-bold text-gray-900 flex items-center"><CreditCard className="w-8 h-8 text-[var(--dominant-red)] mr-3" />ID Releasing Management</h1><p className="text-gray-600">Track, manage, and update the status of student ID cards.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="card-hover"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Students</p><p className="text-2xl font-bold heading-bold text-gray-900">{stats.total}</p></div><div className="p-3 rounded-xl bg-red-50"><Users className="w-6 h-6 text-red-600" /></div></CardContent></Card>
                <Card className="card-hover"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">IDs Printed</p><p className="text-2xl font-bold heading-bold text-gray-900">{stats.printed}</p></div><div className="p-3 rounded-xl bg-blue-50"><Printer className="w-6 h-6 text-blue-600" /></div></CardContent></Card>
                <Card className="card-hover"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">IDs Released</p><p className="text-2xl font-bold heading-bold text-gray-900">{stats.released}</p></div><div className="p-3 rounded-xl bg-green-50"><CheckCircle className="w-6 h-6 text-green-600" /></div></CardContent></Card>
            </div>
            
            <Card>
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        placeholder="Search by student name or ID number..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <MotionDropdown 
                        value={statusFilter} 
                        onChange={setStatusFilter} 
                        options={filterOptions} 
                        placeholder="Filter by Status"
                    />
                </div>
            </CardContent>
        </Card>


            <AnimatePresence>
                {selectedStudents.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gray-50 border rounded-xl p-3 flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <Checkbox 
                                id="select-all" 
                                checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length}
                                onCheckedChange={handleSelectAll}
                                className="data-[state=checked]:bg-[var(--dominant-red)] data-[state=checked]:border-[var(--dominant-red)]"
                            />
                            <label htmlFor="select-all" className="font-medium text-gray-700">{selectedStudents.size} selected</label>
                        </div>
                        <Button onClick={handleBulkMarkAsPrinted} size="sm">
                            <Check size={16} className="mr-2"/>
                            Mark Selected as Printed
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="col-span-full py-12 flex justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <AnimatePresence>
                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map(student => (
                                <motion.div key={student.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <StudentIdCard 
                                        student={student} 
                                        onUpdateStatus={handleUpdateStatus} 
                                        onImageClick={setPreviewImageUrl} 
                                        isSelected={selectedStudents.has(student.id)}
                                        onSelect={handleSelectStudent}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div className="col-span-full text-center py-12 text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <p className="font-semibold">No students found.</p>
                                <p>There are no students matching your search and filter criteria.</p>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default IDReleasing;