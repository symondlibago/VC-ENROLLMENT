import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ChevronDown, BookCopy, Users, CheckCircle, Save, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { instructorAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert'; 
import ValidationErrorModal from '../modals/ValidationErrorModal'; 

// Re-using the MotionDropdown component from ClassRoster for consistency
const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(opt => opt.value === value) || { label: placeholder, value: '' }
  );

  useEffect(() => {
    setSelectedOption(options.find(opt => opt.value === value) || { label: placeholder, value: '' });
  }, [value, options, placeholder]);

  const handleSelect = (option) => {
    setSelectedOption(option);
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

const StudentGrades = () => {
  const [rosterData, setRosterData] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [grades, setGrades] = useState({});
  const [gradingPeriods, setGradingPeriods] = useState({}); // <-- NEW: State for grading periods

  const [alertState, setAlertState] = useState({ isVisible: false, message: '', type: 'success' });
  const [validationError, setValidationError] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    const fetchGradeableStudents = async () => {
      try {
        setLoading(true);
        const response = await instructorAPI.getGradeableStudents();
        if (response.success) {
          setRosterData(response.data);
          setGradingPeriods(response.grading_periods || {}); // <-- NEW: Store grading periods from API

          const initialGrades = {};
          response.data.forEach(subject => {
            subject.students.forEach(student => {
              initialGrades[student.id] = student.grades;
            });
          });
          setGrades(initialGrades);
        } else {
             setAlertState({ isVisible: true, message: 'Failed to fetch student roster.', type: 'error' });
        }
      } catch (error) {
        setAlertState({ isVisible: true, message: 'An error occurred while fetching students.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchGradeableStudents();
  }, []);

  // --- NEW: Helper function to check if a grading period is open ---
  const isPeriodOpen = (periodName) => {
    const period = gradingPeriods[periodName];
    if (!period || !period.start_date || !period.end_date) {
        return false; // Not open if dates aren't set
    }
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    end.setHours(23, 59, 59, 999); // Include the entire end day

    return now >= start && now <= end;
  };

  const subjectOptions = useMemo(() => [
    { label: 'Filter by All Subjects', value: 'all' },
    ...rosterData.map(subject => ({
      label: `${subject.subject_code} - ${subject.descriptive_title}`,
      value: subject.subject_id.toString()
    }))
  ], [rosterData]);

  const { filteredStudents, totalStudentsInSubject, gradedStudentsCount } = useMemo(() => {
    let studentsToDisplay = [];
    let total = 0;
    let graded = 0;

    if (selectedSubjectId === 'all') {
      const allStudentsMap = new Map();
      rosterData.forEach(subject => {
          subject.students.forEach(student => {
              if (!allStudentsMap.has(student.id)) allStudentsMap.set(student.id, student);
          });
      });
      studentsToDisplay = Array.from(allStudentsMap.values());
      total = studentsToDisplay.length;
      graded = studentsToDisplay.filter(student => Object.values(grades[student.id] || {}).some(g => g?.status === 'Passed' || g?.status === 'Failed')).length;

    } else {
      const subject = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
      if (subject) {
        studentsToDisplay = subject.students || [];
        total = studentsToDisplay.length;
        graded = studentsToDisplay.filter(student => grades[student.id]?.status === 'Passed' || grades[student.id]?.status === 'Failed').length;
      }
    }
    
    const filtered = studentsToDisplay.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { filteredStudents: filtered, totalStudentsInSubject: total, gradedStudentsCount: graded };
  }, [rosterData, selectedSubjectId, searchTerm, grades]);

  const handleGradeChange = (studentId, field, value) => {
    const numericValue = value === '' ? null : parseFloat(value);
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numericValue
      }
    }));
  };
  
  const handleSubmitGrades = async () => {
    if (selectedSubjectId === 'all') {
        setValidationError({ isOpen: true, message: 'Please select a specific subject before submitting grades.' });
        return;
    }
    
    const invalidGrade = filteredStudents.some(student => {
        const studentGrades = grades[student.id] || {};
        return Object.values(studentGrades).some(grade => grade !== null && (grade < 0 || grade > 100));
    });

    if (invalidGrade) {
        setValidationError({ isOpen: true, message: 'All entered grades must be between 0 and 100.' });
        return;
    }

    setIsSubmitting(true);
    const gradesToSubmit = filteredStudents.map(student => ({
        student_id: student.id,
        subject_id: parseInt(selectedSubjectId),
        ...grades[student.id]
    }));

    try {
        const response = await instructorAPI.bulkUpdateGrades(gradesToSubmit);
        if (response.success) {
            setAlertState({ isVisible: true, message: response.message, type: 'success' });
        } else {
            setAlertState({ isVisible: true, message: response.message || 'Failed to submit grades.', type: 'error' });
        }
    } catch (error) {
        setAlertState({ isVisible: true, message: 'An error occurred while submitting grades.', type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" color="red" /></div>;
  }
  
  return (
    <motion.div className="p-6 space-y-6 max-w-7xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
       <SuccessAlert 
        isVisible={alertState.isVisible}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState({ ...alertState, isVisible: false })}
      />
      <ValidationErrorModal 
        isOpen={validationError.isOpen}
        message={validationError.message}
        onClose={() => setValidationError({ isOpen: false, message: '' })}
      />

      <motion.div variants={itemVariants}>
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
            <FileText className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
            Student Grades
          </h1>
          <p className="text-gray-600 text-lg">Input and manage grades for students in your classes.</p>
        </div>
      </motion.div>
      
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Total Subjects</p><p className="text-3xl font-bold heading-bold text-gray-900">{subjectOptions.length - 1}</p></div><div className="bg-red-100 p-4 rounded-full"><BookCopy className="w-7 h-7 text-red-600" /></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Students in Subject</p><p className="text-3xl font-bold heading-bold text-gray-900">{totalStudentsInSubject}</p></div><div className="bg-blue-100 p-4 rounded-full"><Users className="w-7 h-7 text-blue-600" /></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Grades Finalized</p><p className="text-3xl font-bold heading-bold text-gray-900">{gradedStudentsCount}</p></div><div className="bg-green-100 p-4 rounded-full"><CheckCircle className="w-7 h-7 text-green-600" /></div></CardContent></Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search students by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-1 border-gray-300 focus:border-red-800 focus:ring-1 focus:ring-red-800 rounded-lg"/>
            </div>
            <div className="w-full md:w-auto min-w-[250px]">
              <MotionDropdown value={selectedSubjectId} onChange={setSelectedSubjectId} options={subjectOptions} placeholder="Select a subject..." />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div className="overflow-x-auto" variants={itemVariants}>
        <Card>
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Student ID</th>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Prelim</th>
                  <th scope="col" className="px-6 py-3">Midterm</th>
                  <th scope="col" className="px-6 py-3">Semi-Final</th>
                  <th scope="col" className="px-6 py-3">Final</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const studentGrade = grades[student.id] || {};
                  const finalGrade = studentGrade.final_grade;
                  const isAllSubjectsView = selectedSubjectId === 'all';
                  let statusBadge;
                  if (finalGrade !== null && finalGrade !== undefined) {
                      statusBadge = finalGrade >= 75 
                          ? <Badge className="bg-green-100 text-green-800">Passed</Badge> 
                          : <Badge variant="destructive">Failed</Badge>;
                  } else {
                      statusBadge = <Badge variant="outline">In Progress</Badge>;
                  }
                  
                  return (
                    <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">{student.studentId}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                      {/* --- UPDATED: Conditionally disable inputs based on grading period --- */}
                      <td className="px-2 py-2">
                        <Input type="number" min="0" max="100" 
                          value={studentGrade.prelim_grade ?? ''} 
                          onChange={(e) => handleGradeChange(student.id, 'prelim_grade', e.target.value)} 
                          className="w-20 border-1 border-gray-300 rounded-md text-black" 
                          disabled={isAllSubjectsView || !isPeriodOpen('prelim')}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="number" min="0" max="100" 
                          value={studentGrade.midterm_grade ?? ''} 
                          onChange={(e) => handleGradeChange(student.id, 'midterm_grade', e.target.value)} 
                          className="w-20 border-1 border-gray-300 rounded-md text-black" 
                          disabled={isAllSubjectsView || !isPeriodOpen('midterm')}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="number" min="0" max="100" 
                          value={studentGrade.semifinal_grade ?? ''} 
                          onChange={(e) => handleGradeChange(student.id, 'semifinal_grade', e.target.value)} 
                          className="w-20 border-1 border-gray-300 rounded-md text-black" 
                          disabled={isAllSubjectsView || !isPeriodOpen('semifinal')}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="number" min="0" max="100" 
                          value={studentGrade.final_grade ?? ''} 
                          onChange={(e) => handleGradeChange(student.id, 'final_grade', e.target.value)} 
                          className="w-20 border-1 border-gray-300 rounded-md text-black" 
                          disabled={isAllSubjectsView || !isPeriodOpen('final')}
                        />
                      </td>
                      <td className="px-6 py-4">{statusBadge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
             {filteredStudents.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>{selectedSubjectId === 'all' ? 'Please select a subject to begin grading.' : 'No students found for this subject.'}</p>
                </div>
             )}
        </Card>
      </motion.div>
      <motion.div className="flex justify-end" variants={itemVariants}>
        <Button onClick={handleSubmitGrades} disabled={isSubmitting || selectedSubjectId === 'all'} className="min-w-[150px]">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Submitting...' : 'Submit Grades'}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default StudentGrades;