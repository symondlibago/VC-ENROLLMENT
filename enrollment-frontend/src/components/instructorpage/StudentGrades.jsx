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

const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = useMemo(() => 
    options.find(opt => opt.value === value)?.label || placeholder,
    [value, options, placeholder]
  );

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-(--dominant-red) focus:ring-2 focus:ring-(--dominant-red)/20 liquid-morph flex items-center justify-between min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900">{selectedLabel}</span>
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
                key={option.value} type="button" onClick={() => handleSelect(option.value)}
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
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradingPeriods, setGradingPeriods] = useState({});
  const [alertState, setAlertState] = useState({ isVisible: false, message: '', type: 'success' });
  const [validationError, setValidationError] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    const fetchGradeableStudents = async () => {
      try {
        setLoading(true);
        const response = await instructorAPI.getGradeableStudents();
        if (response.success) {
          setRosterData(response.data);
          setGradingPeriods(response.grading_periods || {});
          if (response.data && response.data.length > 0) {
            setSelectedSubjectId(response.data[0].subject_id.toString());
          }
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

  const isPeriodOpen = (periodName) => {
    const period = gradingPeriods[periodName];
    if (!period || !period.start_date || !period.end_date) return false;
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  const subjectOptions = useMemo(() => 
    rosterData.map(subject => ({
      label: `${subject.subject_code} - ${subject.descriptive_title}`,
      value: subject.subject_id.toString()
    }))
  , [rosterData]);

  const { filteredStudents, totalStudentsInSubject, gradedStudentsCount } = useMemo(() => {
    if (!selectedSubjectId) {
        return { filteredStudents: [], totalStudentsInSubject: 0, gradedStudentsCount: 0 };
    }
    const subject = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
    if (!subject) {
        return { filteredStudents: [], totalStudentsInSubject: 0, gradedStudentsCount: 0 };
    }
    const studentsToDisplay = subject.students || [];
    const total = studentsToDisplay.length;
    const graded = studentsToDisplay.filter(student => student.grades?.status === 'Passed' || student.grades?.status === 'Failed').length;
    
    const filtered = studentsToDisplay.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return { filteredStudents: filtered, totalStudentsInSubject: total, gradedStudentsCount: graded };
  }, [rosterData, selectedSubjectId, searchTerm]);

  const handleGradeChange = (studentId, field, value) => {
    let numericValue = null;

    if (value !== '') {
        numericValue = parseFloat(value);
        
        if (isNaN(numericValue)) {
          return;
        }

        if (numericValue > 5) {
            numericValue = 5;
        }
    }
    setRosterData(currentRoster => 
      currentRoster.map(subject => {
        if (subject.subject_id.toString() !== selectedSubjectId) {
          return subject;
        }
        const updatedStudents = subject.students.map(student => {
          if (student.id !== studentId) {
            return student;
          }
          return {
            ...student,
            grades: { ...student.grades, [field]: numericValue }
          };
        });
        return { ...subject, students: updatedStudents };
      })
    );
  };
  
  const handleSubmitGrades = async () => {
    if (!selectedSubjectId) {
        setValidationError({ isOpen: true, message: 'Please select a specific subject before submitting grades.' });
        return;
    }
    setIsSubmitting(true);
    const gradesToSubmit = filteredStudents.map(student => ({
        student_id: student.id,
        subject_id: parseInt(selectedSubjectId),
        prelim_grade: student.grades?.prelim_grade,
        midterm_grade: student.grades?.midterm_grade,
        semifinal_grade: student.grades?.semifinal_grade,
        final_grade: student.grades?.final_grade,
    }));

    try {
        const response = await instructorAPI.bulkUpdateGrades(gradesToSubmit);
        if (response.success) {
            setAlertState({ isVisible: true, message: response.message, type: 'success' });
        } else {
            setAlertState({ isVisible: true, message: response.message || 'Failed to submit grades.', type: 'error' });
        }
    } catch (error) {
        setAlertState({ isVisible: true, message: error.message || 'An error occurred while submitting grades.', type: 'error' });
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
            <FileText className="w-8 h-8 text-(--dominant-red) mr-3" />
            Student Grades
          </h1>
          <p className="text-gray-600 text-lg">Input and manage grades for students in your classes.</p>
        </div>
      </motion.div>
      
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Total Subjects</p><p className="text-3xl font-bold heading-bold text-gray-900">{subjectOptions.length}</p></div><div className="bg-red-100 p-4 rounded-full"><BookCopy className="w-7 h-7 text-red-600" /></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Students in Subject</p><p className="text-3xl font-bold heading-bold text-gray-900">{totalStudentsInSubject}</p></div><div className="bg-blue-100 p-4 rounded-full"><Users className="w-7 h-7 text-blue-600" /></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Grades Finalized</p><p className="text-3xl font-bold heading-bold text-gray-900">{gradedStudentsCount}</p></div><div className="bg-green-100 p-4 rounded-full"><CheckCircle className="w-7 h-7 text-green-600" /></div></CardContent></Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search students by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border border-gray-300 focus:border-red-800 focus:ring-1 focus:ring-red-800 rounded-lg"/>
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
                  const finalGrade = student.grades?.final_grade;
                  let statusBadge;

                  // --- CORRECTED LOGIC FOR COLLEGE GRADES ---
                  if (finalGrade !== null && finalGrade !== undefined) {
                      // Passed if 3.0 or lower. Failed if higher than 3.0.
                      statusBadge = finalGrade <= 3.0
                          ? <Badge className="bg-green-100 text-green-800">Passed</Badge> 
                          : <Badge variant="destructive">Failed</Badge>;
                  } else {
                      statusBadge = <Badge variant="outline">In Progress</Badge>;
                  }
                  
                  return (
                    <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">{student.studentId}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                      
                      {/* --- CORRECTED INPUTS FOR COLLEGE GRADES --- */}
                      <td className="px-2 py-2">
                        <Input type="number" min="1" max="5" step="0.01" 
                          value={student.grades?.prelim_grade ?? ''} 
                          onChange={(e) => handleGradeChange(student.id, 'prelim_grade', e.target.value)} 
                          className="w-20 border border-gray-300 rounded-md text-black" 
                          disabled={!isPeriodOpen('prelim')}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="number" min="1" max="5" step="0.01"
                          value={student.grades?.midterm_grade ?? ''} 
                          onChange={(e) => handleGradeChange(student.id, 'midterm_grade', e.target.value)} 
                          className="w-20 border border-gray-300 rounded-md text-black" 
                          disabled={!isPeriodOpen('midterm')}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="number" min="1" max="5" step="0.01"
                          value={student.grades?.semifinal_grade ?? ''} 
                          onChange={(e) => handleGradeChange(student.id, 'semifinal_grade', e.target.value)} 
                          className="w-20 border border-gray-300 rounded-md text-black" 
                          disabled={!isPeriodOpen('semifinal')}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="number" min="1" max="5" step="0.01"
                          value={student.grades?.final_grade ?? ''} 
                          onChange={(e) => handleGradeChange(student.id, 'final_grade', e.target.value)} 
                          className="w-20 border border-gray-300 rounded-md text-black" 
                          disabled={!isPeriodOpen('final')}
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
                    <p>{!selectedSubjectId ? 'Please select a subject to begin grading.' : 'No students found for this subject or search.'}</p>
                </div>
             )}
        </Card>
      </motion.div>
      <motion.div className="flex justify-end" variants={itemVariants}>
        <Button onClick={handleSubmitGrades} disabled={isSubmitting || !selectedSubjectId} className="min-w-[150px]">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Submitting...' : 'Submit Grades'}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default StudentGrades;