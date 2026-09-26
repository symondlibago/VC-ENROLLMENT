import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ChevronDown, BookCopy, Users, CheckCircle, Save, Loader2, Filter, Upload, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { instructorAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert'; 
import ValidationErrorModal from '../modals/ValidationErrorModal'; 
import DownloadGradingSheet from '@/components/layout/DownloadGradingSheet';
import ImportGradesModal from '../modals/ImportGradesModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usesTransmutation } from '@/lib/transmutation';

const MotionDropdown = ({ value, onChange, options, placeholder, searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedLabel = useMemo(() =>
    options.find(opt => opt.value === value)?.label || placeholder,
    [value, options, placeholder]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const close = () => { setIsOpen(false); setQuery(''); };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    close();
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-(--dominant-red) focus:ring-2 focus:ring-(--dominant-red)/20 liquid-morph flex items-center justify-between min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900 truncate flex-1 min-w-0 mr-2">{selectedLabel}</span>
        <motion.div
          className="shrink-0"
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
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto"
          >
            {searchable && (
              <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search subject..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-(--dominant-red) focus:ring-1 focus:ring-(--dominant-red)/30"
                  />
                </div>
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">No subjects found.</div>
            ) : filteredOptions.map((option, index) => {
              const isSelected = option.value === value;

              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left transition-colors duration-200 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    isSelected ? 'bg-red-800' : 'bg-white'
                  }`}
                  initial={searchable ? false : { opacity: 0, x: -10 }}
                  animate={searchable ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: searchable ? 0 : index * 0.05 }}
                  whileHover={{
                    backgroundColor: isSelected ? '#b91c1c' : '#f9fafb',
                    x: 4
                  }}
                >
                  <span className={`${isSelected ? 'text-white font-medium' : 'text-gray-900'}`}>
                    {option.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StudentGrades = () => {
  const [rosterData, setRosterData] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  // State for selected section
  const [selectedSection, setSelectedSection] = useState('All');
  // State for selected semester filter (1st Sem / 2nd Sem / etc.)
  const [selectedSemester, setSelectedSemester] = useState('All');
  // State for instructor name
  const [instructorName, setInstructorName] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradingPeriods, setGradingPeriods] = useState({});
  const [alertState, setAlertState] = useState({ isVisible: false, message: '', type: 'success' });
  const [validationError, setValidationError] = useState({ isOpen: false, message: '' });
  const [isImportOpen, setIsImportOpen] = useState(false);
  // Past terms this instructor has grades for. Picking one brings back students
  // who have since re-enrolled into another section.
  const [availableTerms, setAvailableTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('current');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // 1. Get instructor name from localStorage
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
        try {
            const user = JSON.parse(userDataStr);
            setInstructorName(user.name);
        } catch (e) {
            console.error("Error parsing user data", e);
        }
    }

    const fetchGradeableStudents = async () => {
      try {
        // Only the very first load blanks the page. Switching terms refreshes the
        // table in place so the whole screen doesn't flash like a page reload.
        if (isFirstLoad.current) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        const [schoolYear, semester] = selectedTerm === 'current' ? [] : selectedTerm.split('|');
        const response = await instructorAPI.getGradeableStudents({ school_year: schoolYear, semester });
        if (response.success) {
          setRosterData(response.data);
          setGradingPeriods(response.grading_periods || {});
          setAvailableTerms(response.available_terms || []);
          if (response.data && response.data.length > 0) {
            // Keep the current subject selected when switching terms if it still exists
            const stillThere = response.data.some(s => s.subject_id.toString() === selectedSubjectId);
            if (!stillThere) setSelectedSubjectId(response.data[0].subject_id.toString());
          } else {
            setSelectedSubjectId('');
          }
        } else {
             setAlertState({ isVisible: true, message: 'Failed to fetch student roster.', type: 'error' });
        }
      } catch (error) {
        setAlertState({ isVisible: true, message: 'An error occurred while fetching students.', type: 'error' });
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        isFirstLoad.current = false;
      }
    };
    fetchGradeableStudents();
    // selectedSubjectId is intentionally not a dependency: it is only read to
    // keep the selection when the term changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm]);

  const getGradeColorClass = (grade) => {
    if (grade === null || grade === undefined || grade === '') {
      return 'text-gray-900';
    }
  
    return parseFloat(grade) < 75
      ? 'text-red-600'
      : 'text-gray-900';
  };

  // Reset section filter when subject changes
  useEffect(() => {
    setSelectedSection('All');
  }, [selectedSubjectId]);

  const isPeriodOpen = (periodName) => {
    const period = gradingPeriods[periodName];
    if (!period || !period.start_date || !period.end_date) return false;
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  // Distinct semesters available across the instructor's subjects (for the filter)
  const semesterOptions = useMemo(() => {
    const uniqueSemesters = [...new Set(rosterData.map(s => s.semester || 'Unspecified'))]
      .filter(Boolean)
      .sort();
    return [
      { label: 'All Semesters', value: 'All' },
      ...uniqueSemesters.map(sem => ({ label: sem, value: sem })),
    ];
  }, [rosterData]);

  // Subjects narrowed down to the selected semester
  const filteredSubjects = useMemo(() => {
    if (selectedSemester === 'All') return rosterData;
    return rosterData.filter(s => (s.semester || 'Unspecified') === selectedSemester);
  }, [rosterData, selectedSemester]);

  const subjectOptions = useMemo(() =>
    filteredSubjects.map(subject => ({
      label: `${subject.subject_code} - ${subject.descriptive_title}`,
      value: subject.subject_id.toString()
    }))
  , [filteredSubjects]);

  // Switch semester and keep a valid subject selected within it
  const handleSemesterChange = (sem) => {
    setSelectedSemester(sem);
    const list = sem === 'All'
      ? rosterData
      : rosterData.filter(s => (s.semester || 'Unspecified') === sem);
    if (!list.some(s => s.subject_id.toString() === selectedSubjectId)) {
      setSelectedSubjectId(list[0]?.subject_id.toString() || '');
    }
  };

  // Section options are now safe: the backend already scoped students to only
  // the sections this instructor is assigned to for each subject.
  const sectionOptions = useMemo(() => {
    const subject = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
    if (!subject || !subject.students) return [{ label: 'All Sections', value: 'All' }];

    const uniqueSections = [...new Set(subject.students.map(s => s.section || 'Unassigned'))].sort();

    return [
      { label: 'All Sections', value: 'All' },
      ...uniqueSections.map(sec => ({ label: sec, value: sec }))
    ];
  }, [rosterData, selectedSubjectId]);

  const { filteredStudents, totalStudentsInSubject, gradedStudentsCount } = useMemo(() => {
    if (!selectedSubjectId) {
        return { filteredStudents: [], totalStudentsInSubject: 0, gradedStudentsCount: 0 };
    }
    const subject = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
    if (!subject) {
        return { filteredStudents: [], totalStudentsInSubject: 0, gradedStudentsCount: 0 };
    }

    // Backend already filtered to only this instructor's section(s) for this subject
    const studentsToDisplay = subject.students || [];

    // Apply Section Filtering
    let processedStudents = studentsToDisplay;

    if (selectedSection !== 'All') {
      processedStudents = processedStudents.filter(student => (student.section || 'Unassigned') === selectedSection);
    }

    // Apply Name Search
    processedStudents = processedStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort by Section then Name
    processedStudents.sort((a, b) => {
       const secA = a.section || "Unassigned";
       const secB = b.section || "Unassigned";
       if (secA !== secB) return secA.localeCompare(secB);
       return a.name.localeCompare(b.name);
    });
    
    // Stats are based on the unfiltered subject list, but filtering changes the view
    const total = processedStudents.length;
    const graded = processedStudents.filter(student => student.grades?.status === 'Passed' || student.grades?.status === 'Failed').length;
    
    return { filteredStudents: processedStudents, totalStudentsInSubject: total, gradedStudentsCount: graded };
  }, [rosterData, selectedSubjectId, searchTerm, selectedSection]); 

  const handleGradeChange = (studentId, field, value) => {
    let numericValue = null;

    if (value !== '') {
        numericValue = parseFloat(value);
        if (isNaN(numericValue)) return;
        if (numericValue > 100) numericValue = 100; 
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

  /**
   * Fills one term's inputs from an imported Class Record file.
   * Nothing is saved here — the instructor still reviews and presses Submit.
   */
  const handleImportedGrades = (field, values) => {
    if (!values.length) return;
    const byStudentId = new Map(values.map(v => [v.studentId, v.value]));

    setRosterData(currentRoster =>
      currentRoster.map(subject => {
        if (subject.subject_id.toString() !== selectedSubjectId) return subject;

        return {
          ...subject,
          students: subject.students.map(student =>
            byStudentId.has(student.id)
              ? { ...student, grades: { ...student.grades, [field]: byStudentId.get(student.id) } }
              : student
          ),
        };
      })
    );

    setAlertState({
      isVisible: true,
      message: `${values.length} grade${values.length === 1 ? '' : 's'} filled in. Review them, then press Submit Grades to save.`,
      type: 'success',
    });
  };

  /**
   * Sets a remark on a student (INC, NFE, NFR, DA) or clears it back to being
   * derived from the grades. Saved with Submit Grades like any other change.
   */
  const handleStatusChange = (studentId, status) => {
    setRosterData(currentRoster =>
      currentRoster.map(subject => {
        if (subject.subject_id.toString() !== selectedSubjectId) return subject;
        return {
          ...subject,
          students: subject.students.map(student =>
            student.id === studentId
              ? { ...student, grades: { ...student.grades, status: status ?? 'In Progress' } }
              : student
          ),
        };
      })
    );
  };

  const getEquivalentGrade = (finalGrade) => {
    if (finalGrade === null || finalGrade === undefined) return '--';
    
    // Round to the nearest whole number for mapping
    const grade = Math.round(finalGrade);
  
    if (grade >= 100) return '1.0';
    if (grade === 99) return '1.1';
    if (grade === 98) return '1.2';
    if (grade === 97) return '1.25';
    if (grade === 96) return '1.3';
    if (grade === 95) return '1.4';
    if (grade === 94) return '1.5';
    if (grade === 93) return '1.6';
    if (grade === 92) return '1.7';
    if (grade === 91) return '1.75';
    if (grade === 90) return '1.8';
    if (grade === 89) return '1.9';
    if (grade === 88) return '2.0';
    if (grade === 87) return '2.1';
    if (grade === 86) return '2.2';
    if (grade === 85) return '2.25';
    if (grade === 84) return '2.3';
    if (grade === 83) return '2.4';
    if (grade === 82) return '2.5';
    if (grade === 81) return '2.6';
    if (grade === 80) return '2.7';
    if (grade === 79) return '2.75';
    if (grade === 78) return '2.8';
    if (grade === 77) return '2.9';
    if (grade === 76 || grade === 75) return '3.0';
    if (grade === 74) return '3.1';
    if (grade === 73) return '3.2';
    if (grade === 72) return '3.25';
    if (grade === 71) return '3.3';
    if (grade === 70) return '3.4';
    
    return '5.0'; // 69% and below
  };

  const calculateFinalGrade = (student, subjectCode) => {
    const { prelim_grade: p, midterm_grade: m, semifinal_grade: s, final_grade: f } = student.grades || {};
    if ([p, m, s, f].some(grade => grade === null || grade === undefined || grade === '')) return null;

    const isDHT = student.courseName?.includes('Diploma in Hospitality Technology') || 
                  student.courseName?.includes('DHT') ||
                  subjectCode?.includes('DHT');
                  
    const isSHS = student.year?.includes('Grade 11') || student.year?.includes('Grade 12');

    let finalResult = 0;
    if (isDHT || isSHS) {
      finalResult = (p + m + s + f) / 4;
    } else {
      finalResult = (p * 0.25) + (m * 0.25) + (s * 0.25) + (f * 0.25);
    }
    
    // Automatically round off the calculated final grade
    return Math.round(finalResult);
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
        // Only send a remark when one was actually set, so the backend keeps
        // deriving Passed/Failed from the grades otherwise.
        status: ['INC', 'NFE', 'NFR', 'DA'].includes(student.grades?.status)
          ? student.grades.status
          : undefined,
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

  // Get current subject data object for the export button
  const currentSubject = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);

  // Grades stay locked until a specific semester is picked, so every grade is
  // recorded against a known term instead of "All Semesters".
  const semesterChosen = selectedSemester !== 'All';

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
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Students in View</p><p className="text-3xl font-bold heading-bold text-gray-900">{totalStudentsInSubject}</p></div><div className="bg-blue-100 p-4 rounded-full"><Users className="w-7 h-7 text-blue-600" /></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500">Grades Finalized</p><p className="text-3xl font-bold heading-bold text-gray-900">{gradedStudentsCount}</p></div><div className="bg-green-100 p-4 rounded-full"><CheckCircle className="w-7 h-7 text-green-600" /></div></CardContent></Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          {/* Two rows: search + import on top, the filter dropdowns underneath. */}
          <CardContent className="p-6 space-y-4">
            {/* Row 1 — search and import */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search students by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border border-gray-300 focus:border-red-800 focus:ring-1 focus:ring-red-800 rounded-lg"/>
              </div>

              {/* Import grades from an exported Class Record */}
              <Button
                  variant="outline"
                  onClick={() => {
                    if (!semesterChosen) {
                      setValidationError({ isOpen: true, message: 'Please choose a semester before importing grades, so they are recorded under the correct term.' });
                      return;
                    }
                    if (!selectedSubjectId) {
                      setValidationError({ isOpen: true, message: 'Please select a subject before importing grades.' });
                      return;
                    }
                    setIsImportOpen(true);
                  }}
                  className="w-full sm:w-auto shrink-0 h-[42px] px-4 cursor-pointer bg-white text-gray-900 border-gray-200 hover:bg-red-50 hover:text-red-800 hover:border-red-800"
              >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Grades
              </Button>
            </div>

            {/* Row 2 — filters */}
            <div className="flex flex-wrap gap-3">
                {/* Term filter — a past term brings back students who have since
                    re-enrolled into another section */}
                {availableTerms.length > 0 && (
                  <div className="w-full sm:w-auto">
                      <MotionDropdown
                          value={selectedTerm}
                          onChange={setSelectedTerm}
                          options={[
                            { label: 'Current Term', value: 'current' },
                            ...availableTerms.map(t => ({
                              label: `${t.school_year} · ${t.semester}`,
                              value: `${t.school_year}|${t.semester}`,
                            })),
                          ]}
                          placeholder="Select term"
                      />
                  </div>
                )}

                {/* Semester Filter */}
                <div className="w-full sm:w-auto">
                    <MotionDropdown
                        value={selectedSemester}
                        onChange={handleSemesterChange}
                        options={semesterOptions}
                        placeholder="Filter by Semester"
                    />
                </div>

                {/* Subject Dropdown (searchable) — fixed width so the long title truncates */}
                <div className="w-full sm:w-[260px]">
                    <MotionDropdown
                        value={selectedSubjectId}
                        onChange={setSelectedSubjectId}
                        options={subjectOptions}
                        placeholder="Select a subject..."
                        searchable
                    />
                </div>

                {/* Section Dropdown */}
                <div className="w-full sm:w-auto">
                    <MotionDropdown
                        value={selectedSection}
                        onChange={setSelectedSection}
                        options={sectionOptions}
                        placeholder="Filter by Section"
                    />
                </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grades are locked until a semester is chosen, so nothing is ever saved
          against "All Semesters" and the term history stays accurate. */}
      {!semesterChosen && (
        <motion.div variants={itemVariants}>
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Choose a semester before entering grades</p>
              <p className="text-sm text-amber-800">
                The grade fields stay locked while the filter says “All Semesters”. Pick the semester
                you are grading so each grade is recorded under the correct term.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div className="overflow-x-auto relative" variants={itemVariants}>
        {/* Switching terms refreshes the table in place rather than blanking the page */}
        {isRefreshing && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-start justify-center pt-16 rounded-xl">
            <span className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm border">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading roster…
            </span>
          </div>
        )}
        <Card className={isRefreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
              <th className="px-6 py-3">Student ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Section</th>
              <th className="px-6 py-3">Prelim</th>
              <th className="px-6 py-3">Midterm</th>
              <th className="px-6 py-3">Semi-Final</th>
              <th className="px-6 py-3">Final</th>
              <th className="px-6 py-3 text-red-600">Final Grade</th>
              <th className="px-6 py-3">Equivalent</th>
              <th className="px-6 py-3">Status</th>
            </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const subject = rosterData.find(s => s.subject_id.toString() === selectedSubjectId);
                  const computedFinal = calculateFinalGrade(student, subject?.subject_code);
                  const equivalent = getEquivalentGrade(computedFinal);

                  // A remark the instructor set (INC and friends) wins over the
                  // status derived from the grades.
                  const savedStatus = student.grades?.status;
                  const isMarked = ['INC', 'NFE', 'NFR', 'DA', 'Credited'].includes(savedStatus);

                  let statusBadge;
                  if (isMarked) {
                      statusBadge = <Badge className="bg-yellow-100 text-yellow-800">{savedStatus}</Badge>;
                  } else if (computedFinal !== null) {
                      statusBadge = computedFinal >= 75
                          ? <Badge className="bg-green-100 text-green-800">Passed</Badge>
                          : <Badge variant="destructive">Failed</Badge>;
                  } else {
                      statusBadge = <Badge variant="outline">In Progress</Badge>;
                  }

                  return (
                    <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">{student.studentId}</td>
                      <td className="px-6 py-4">{student.name.toUpperCase()}</td>
                      {/* Display Section */}
                      <td className="px-6 py-4">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                             {student.section || 'Unassigned'}
                          </Badge>
                      </td>

                      {/* Grade Inputs */}
                      {['prelim_grade', 'midterm_grade', 'semifinal_grade', 'final_grade'].map((field) => (
                        <td key={field} className="px-2 py-2">
                          <Input 
                            type="number" min="0" max="100" 
                            value={student.grades?.[field] ?? ''} 
                            onChange={(e) => handleGradeChange(student.id, field, e.target.value)}
                            className={`w-16 border-gray-300 font-mono font-bold ${getGradeColorClass(student.grades?.[field])}`}
                            disabled={!isPeriodOpen(field.split('_')[0]) || !semesterChosen}
                            title={!semesterChosen ? 'Choose a semester first' : undefined}
                          />
                        </td>
                      ))}

                      {/* Computed Final Grade - Now displays rounded number without .toFixed(2) */}
                      <td className={`px-6 py-4 font-bold font-mono ${getGradeColorClass(computedFinal)}`}>
                          {computedFinal !== null ? computedFinal : '--'}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-900 font-bold">{equivalent}</td>
                      <td className="px-6 py-4">
                        {/* The remark can be set here — marking INC opens the
                            student's record on the INC Records page. */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="cursor-pointer" title="Change remark">
                              {statusBadge}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleStatusChange(student.id, null)}>
                              Auto (from grades)
                            </DropdownMenuItem>
                            {['INC', 'NFE', 'NFR', 'DA'].map(option => (
                              <DropdownMenuItem
                                key={option}
                                onSelect={() => handleStatusChange(student.id, option)}
                                className={savedStatus === option ? 'font-semibold text-red-800' : ''}
                              >
                                {option}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
             {filteredStudents.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>{!selectedSubjectId ? 'Please select a subject to begin grading.' : 'No students found for this subject/section.'}</p>
                </div>
             )}
        </Card>
      </motion.div>
      
      {/* Footer Actions: Export and Submit Buttons */}
      <motion.div className="flex justify-between items-center mt-6" variants={itemVariants}>
         {/* Export Button */}
         <div>
            {currentSubject && (
                <DownloadGradingSheet
                    subject={currentSubject}
                    students={filteredStudents} // Passes currently filtered students (specific section or all)
                    instructorName={instructorName}
                />
            )}
         </div>

         {/* Submit Button */}
         <Button
            onClick={handleSubmitGrades}
            disabled={isSubmitting || !selectedSubjectId || !semesterChosen}
            title={!semesterChosen ? 'Choose a semester first' : undefined}
            className="min-w-[150px]"
         >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Submitting...' : 'Submit Grades'}
         </Button>
      </motion.div>

      <ImportGradesModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        students={filteredStudents}
        subjectLabel={currentSubject ? `${currentSubject.subject_code} - ${currentSubject.descriptive_title}` : ''}
        sectionLabel={selectedSection === 'All' ? 'All sections' : selectedSection}
        isPeriodOpen={isPeriodOpen}
        onApply={handleImportedGrades}
        useTransmuted={usesTransmutation(filteredStudents, currentSubject?.subject_code)}
      />
    </motion.div>
  );
};

export default StudentGrades;