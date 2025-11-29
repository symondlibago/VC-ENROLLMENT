import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookUser, Search, Eye, Users, Hash, User, GraduationCap, CalendarDays, Settings2, SlidersHorizontal, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI, managementAPI } from '@/services/api'; 
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import StudentGradesModal from '@/components/modals/StudentGradesModal';
import SuccessAlert from '@/components/modals/SuccessAlert';
import CustomCalendar from '@/components/layout/CustomCalendar';

// SECTION 1: The view for the student list (No changes)
const StudentGradebookView = ({ loading, filteredStudents, searchTerm, onSearchTermChange, onViewGrades }) => (
  <>
    {loading ? (
      <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>
    ) : (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-6 h-6 mr-3 text-red-800" />
            All Enrolled Students ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search students by name, ID, or course..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10 border-1 border-gray-300"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-black uppercase">
                <tr>
                  <th className="px-6 py-3 flex items-center gap-2"><Hash size={16} /> Student ID</th>
                  <th className="px-6 py-3"><div className="flex items-center gap-2"><User size={16} /> Name</div></th>
                  <th className="px-6 py-3"><div className="flex items-center gap-2"><GraduationCap size={16} /> Course</div></th>
                  <th className="px-6 py-3"><div className="flex items-center gap-2"><CalendarDays size={16} /> Year Level</div></th>
                  <th className="px-6 py-3"><div className="flex items-center gap-2"><Settings2 size={16} /> Action</div></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono"><div className="flex items-center gap-2"><Hash size={14} className="text-gray-500" /><span>{student.student_id_number}</span></div></td>
                    <td className="px-6 py-4 font-medium text-gray-900"><div className="flex items-center gap-2"><User size={14} className="text-gray-500" /><span>{student.name}</span></div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><GraduationCap size={14} className="text-gray-500" /><span>{student.courseName}</span></div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><CalendarDays size={14} className="text-gray-500" /><span>{student.year}</span></div></td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" onClick={() => onViewGrades(student.id, student.name)} className="gradient-primary text-white liquid-button cursor-pointer">
                        <Eye className="w-4 h-4 mr-2" /> View Grades
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12"><Users className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900">No students found</h3><p className="text-gray-500">Try adjusting your search criteria.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
    )}
  </>
);


// SECTION 2: Component for managing submission dates
const GradeSubmissionManager = () => {
  const [periods, setPeriods] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });

  const periodNames = {
    prelim: 'Prelim',
    midterm: 'Midterm',
    semifinal: 'Semi-Final',
    final: 'Final',
    enrollment: 'Enrollment Period',
  };

  useEffect(() => {
    const fetchPeriods = async () => {
      setLoading(true);
      try {
        const response = await managementAPI.getGradingPeriods();
        if (response.success) {
          const initialPeriods = { prelim: {}, midterm: {}, semifinal: {}, final: {}, enrollment: {} };
          
          for (const key in response.data) {
            if (initialPeriods.hasOwnProperty(key)) {
              initialPeriods[key] = {
                start_date: response.data[key].start_date || '',
                end_date: response.data[key].end_date || '',
              };
            }
          }
          setPeriods(initialPeriods);
        }
      } catch (error) {
        setAlert({ isVisible: true, message: 'Failed to load grading periods.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchPeriods();
  }, []);

  // --- FIX APPLIED HERE ---
  const handleDateChange = (periodKey, dateType, valueFromCalendar) => {
    let formattedDate = '';
    if (valueFromCalendar) {
      const date = new Date(valueFromCalendar);
      if (!isNaN(date)) {
        // Construct YYYY-MM-DD using local time components to avoid UTC shift
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
    }
    
    setPeriods(prev => ({
      ...prev,
      [periodKey]: { ...prev[periodKey], [dateType]: formattedDate },
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await managementAPI.updateGradingPeriods(periods);
      if (response.success) {
        setAlert({ isVisible: true, message: 'Grading periods updated successfully!', type: 'success' });
      } else {
        setAlert({ isVisible: true, message: response.message || 'Failed to save changes.', type: 'error' });
      }
    } catch (error) {
      setAlert({ isVisible: true, message: 'An error occurred while saving.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return { text: 'Not Set', color: 'bg-gray-100 text-gray-800' };
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); 

    if (now < start) return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    if (now > end) return { text: 'Closed', color: 'bg-red-100 text-red-800' };
    return { text: 'Open', color: 'bg-green-100 text-green-800' };
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
       <SuccessAlert isVisible={alert.isVisible} message={alert.message} type={alert.type} onClose={() => setAlert(prev => ({ ...prev, isVisible: false }))} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><SlidersHorizontal className="w-6 h-6 mr-3 text-red-800" /> Grade Submission Settings</CardTitle>
          <CardDescription>Define the start and end dates for grading periods and student enrollment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(periodNames).map(([key, name]) => {
            const periodData = periods[key] || {};
            const status = getStatus(periodData.start_date, periodData.end_date);
            
            const popupPosition = (key === 'semifinal' || key === 'final' || key === 'enrollment') 
              ? 'above' 
              : 'below';

            return (
              <div key={key} className={`p-4 border rounded-lg grid grid-cols-1 md:grid-cols-4 items-center gap-4 ${key === 'enrollment' ? ' border-gray-200' : ''}`}>
                <div className="md:col-span-1">
                  <h3 className="font-semibold text-lg">{name}</h3>
                  <Badge className={status.color}>{status.text}</Badge>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <CustomCalendar
                    value={periodData.start_date}
                    onChange={(date) => handleDateChange(key, 'start_date', date)}
                    placeholder="Select start date"
                    position={popupPosition}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                   <CustomCalendar
                    value={periodData.end_date}
                    onChange={(date) => handleDateChange(key, 'end_date', date)}
                    placeholder="Select end date"
                    position={popupPosition}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// This is the main component that toggles between the two sections (No changes)
const Grades = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('gradebook');
  const [modalState, setModalState] = useState({
    isOpen: false,
    studentId: null,
    studentName: '',
  });

  useEffect(() => {
    if (activeTab === 'gradebook') {
        const fetchStudents = async () => {
          setLoading(true);
          try {
            const response = await enrollmentAPI.getEnrolledStudents();
            if (response.success) {
              setStudents(response.data);
            }
          } catch (error) {
            console.error("Failed to fetch students:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchStudents();
    }
  }, [activeTab]);

  const handleViewGrades = (studentId, studentName) => {
    setModalState({ isOpen: true, studentId, studentName });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, studentId: null, studentName: '' });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <>
      <StudentGradesModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        studentId={modalState.studentId}
        studentName={modalState.studentName}
      />
      <motion.div
        className="p-6 space-y-6 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <div className="gradient-soft rounded-2xl p-8 border border-gray-100 flex items-center justify-between">
            <div>
                 <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
                    {activeTab === 'gradebook' ? <BookUser className="w-8 h-8 text-[var(--dominant-red)] mr-3" /> : <SlidersHorizontal className="w-8 h-8 text-[var(--dominant-red)] mr-3" />}
                    {activeTab === 'gradebook' ? 'Student Gradebook' : 'Grade Submission Management'}
                </h1>
                <p className="text-gray-600 text-lg">
                    {activeTab === 'gradebook' ? 'View the academic records of all enrolled students.' : 'Set the submission dates for each grading period.'}
                </p>
            </div>
            <div className="relative bg-gray-100 rounded-2xl p-1 inline-flex">
              <motion.div
                className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md"
                initial={false}
                animate={{
                  left: activeTab === 'gradebook' ? '4px' : '50%',
                  right: activeTab === 'gradebook' ? '50%' : '4px',
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
              />
              <motion.button onClick={() => setActiveTab('gradebook')} className={`relative z-10 p-3 rounded-xl transition-colors duration-300 ${activeTab === 'gradebook' ? 'text-[var(--dominant-red)]' : 'text-gray-600'}`} title="Gradebook">
                <BookUser className="w-5 h-5" />
              </motion.button>
              <motion.button onClick={() => setActiveTab('management')} className={`relative z-10 p-3 rounded-xl transition-colors duration-300 ${activeTab === 'management' ? 'text-[var(--dominant-red)]' : 'text-gray-600'}`} title="Management">
                <SlidersHorizontal className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          {activeTab === 'gradebook' ? (
            <StudentGradebookView 
              loading={loading}
              filteredStudents={filteredStudents}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onViewGrades={handleViewGrades}
            />
          ) : (
            <GradeSubmissionManager />
          )}
        </motion.div>

      </motion.div>
    </>
  );
};

export default Grades;