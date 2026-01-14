import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentAPI } from '@/services/api';
import { FileText, ChevronDown, AlertCircle, Inbox, Book, User, Calculator, Equal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { useIsMobile } from "@/hooks/use-mobile";

// --- HELPER FUNCTIONS ---

// 1. Equivalent Conversion
const getEquivalent = (numericGrade) => {
  if (numericGrade === null || numericGrade === undefined || isNaN(numericGrade)) return '--';
  
  const g = Math.round(numericGrade); // Round to nearest whole number for mapping

  if (g >= 100) return "1.0";
  if (g === 99) return "1.1";
  if (g === 98) return "1.2";
  if (g === 97) return "1.25";
  if (g === 96) return "1.3";
  if (g === 95) return "1.4";
  if (g === 94) return "1.5";
  if (g === 93) return "1.6";
  if (g === 92) return "1.7";
  if (g === 91) return "1.75";
  if (g === 90) return "1.8";
  if (g === 89) return "1.9";
  if (g === 88) return "2.0";
  if (g === 87) return "2.1";
  if (g === 86) return "2.2";
  if (g === 85) return "2.25";
  if (g === 84) return "2.3";
  if (g === 83) return "2.4";
  if (g === 82) return "2.5";
  if (g === 81) return "2.6";
  if (g === 80) return "2.7";
  if (g === 79) return "2.75";
  if (g === 78) return "2.8";
  if (g === 77) return "2.9";
  if (g >= 75) return "3.0"; // 75-76%
  if (g === 74) return "3.1";
  if (g === 73) return "3.2";
  if (g === 72) return "3.25";
  if (g === 71) return "3.3";
  if (g === 70) return "3.4";
  return "5.0"; // 69% and below
};

// 2. Final Grade Calculation (Weighted vs Average)
const calculateFinalGrade = (grade) => {
  const { prelim_grade: p, midterm_grade: m, semifinal_grade: s, final_grade: f } = grade;
  
  // Return null if any grade component is missing
  if ([p, m, s, f].some(v => v === null || v === undefined || v === '')) return null;

  const P = parseFloat(p);
  const M = parseFloat(m);
  const S = parseFloat(s);
  const F = parseFloat(f);

  // --- FIX IS HERE ---
  // The backend sends 'course', not 'course_name'
  const courseCode = grade.course || '';
  const subjectCode = grade.subject_code || '';
  const yearLevel = grade.year || '';

  // Check for DHT (Diploma in Hospitality Technology)
  const isDHT = courseCode.includes('DHT') || subjectCode.includes('DHT');
                
  // Check for Senior High School (SHS)
  const isSHS = yearLevel.includes('Grade 11') || yearLevel.includes('Grade 12');

  if (isDHT || isSHS) {
    // DHT/SHS Formula: Simple Average
    return (P + M + S + F) / 4; 
  } else {
    // Standard College Formula: Weighted Average
    return (P * 0.20) + (M * 0.20) + (S * 0.20) + (F * 0.40); 
  }
};

// --- COMPONENTS ---

const MotionDropdown = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;
  
    return (
      <div className="relative">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-red-700 focus:ring-2 focus:ring-red-700/20 flex items-center justify-between min-w-[200px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-gray-900">{selectedLabel}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
            >
              {options.map((option, index) => (
                <motion.button
                  key={option.value} type="button" onClick={() => { onChange(option.value); setIsOpen(false); }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b last:border-b-0"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
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

const GradeCard = ({ grade }) => {
    const computedFinal = calculateFinalGrade(grade);
    const equivalent = getEquivalent(computedFinal);

    const getStatusBadgeClass = (status) => {
        switch (status) {
          case 'Passed': return 'bg-green-100 text-green-800';
          case 'Failed': return 'bg-red-100 text-red-800';
          case 'In Progress': return 'bg-blue-100 text-blue-800';
          case 'Credited': return 'bg-blue-100 text-blue-800';
          case 'INC':
          case 'NFE':
          case 'NFR':
          case 'DA': return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="font-mono text-xs text-red-700 font-bold">{grade.subject_code}</p>
                        <h3 className="font-bold text-gray-900 leading-tight">{grade.descriptive_title}</h3>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                            <User className="w-3 h-3 mr-1.5" /> {grade.instructor_name}
                        </p>
                    </div>
                    <Badge className={getStatusBadgeClass(grade.status)}>{grade.status}</Badge>
                </div>

                {/* Raw Grades Grid */}
                <div className="border-t border-gray-100 pt-3 grid grid-cols-4 gap-2 text-xs mb-3">
                    <div className="text-center">
                        <p className="text-gray-400 mb-1">Prelim</p>
                        <p className="font-mono font-medium">{grade.prelim_grade || '-'}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 mb-1">Midterm</p>
                        <p className="font-mono font-medium">{grade.midterm_grade || '-'}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 mb-1">Semi</p>
                        <p className="font-mono font-medium">{grade.semifinal_grade || '-'}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 mb-1">Final</p>
                        <p className="font-mono font-medium">{grade.final_grade || '-'}</p>
                    </div>
                </div>

                {/* Computed Result Section */}
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                    <div className="flex flex-col items-center w-1/2 border-r border-gray-200">
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                            <Calculator size={12} /> Computed
                        </p>
                        <span className="text-lg font-bold text-gray-900 font-mono">
                           {computedFinal ? computedFinal.toFixed(2) : '--'}
                        </span>
                    </div>
                    <div className="flex flex-col items-center w-1/2">
                         <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                            <Equal size={12} /> Equivalent
                        </p>
                        <span className="text-lg font-bold text-red-700 font-mono">
                            {equivalent}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


const StudentGrade = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const isMobile = useIsMobile(); 

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await studentAPI.getMyGrades({ year: selectedYear, semester: selectedSemester });
        if (response.success) {
          setGrades(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch grades');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [selectedYear, selectedSemester]);

  const yearOptions = [
    { label: 'All Years', value: 'all' },
    { label: 'Grade 11', value: 'Grade 11' },
    { label: 'Grade 12', value: 'Grade 12' },
    { label: '1st Year', value: '1st Year' },
    { label: '2nd Year', value: '2nd Year' },
    { label: '3rd Year', value: '3rd Year' },
    { label: '4th Year', value: '4th Year' },
  ];

  const semesterOptions = [
    { label: 'All Semesters', value: 'all' },
    { label: '1st Semester', value: '1st Semester' },
    { label: '2nd Semester', value: '2nd Semester' },
  ];
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Passed': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Credited': return 'bg-blue-100 text-blue-800';
      case 'INC':
      case 'NFE':
      case 'NFR':
      case 'DA': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" color="red" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-10 bg-red-50 rounded-lg">
          <AlertCircle className="mx-auto w-12 h-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-red-800">Error Fetching Grades</h2>
          <p className="text-red-600">{error}</p>
        </div>
      );
    }
    
    if (grades.length === 0) {
        return (
            <div className="text-center p-10 bg-gray-50 rounded-lg">
                <Inbox className="mx-auto w-12 h-12 text-gray-400" />
                <h2 className="mt-4 text-xl font-semibold">No Grades Found</h2>
                <p className="text-gray-500">No grades are available for the selected year and semester.</p>
            </div>
        );
    }
    
    return isMobile ? (
        <div className="space-y-4">
            {grades.map((grade) => (
                <GradeCard key={grade.id} grade={grade} />
            ))}
        </div>
    ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[120px]">Subject Code</TableHead>
                  <TableHead className="min-w-[200px]">Descriptive Title</TableHead>
                  <TableHead className="min-w-[150px]">Instructor</TableHead>
                  <TableHead className="text-center w-[80px]">Prelim</TableHead>
                  <TableHead className="text-center w-[80px]">Midterm</TableHead>
                  <TableHead className="text-center w-[80px]">Semi</TableHead>
                  <TableHead className="text-center w-[80px]">Final</TableHead>
                  
                  {/* NEW COLUMNS */}
                  <TableHead className="text-center w-[100px] text-red-700 font-bold bg-red-50/50">Computed</TableHead>
                  <TableHead className="text-center w-[100px] font-bold">Equivalent</TableHead>
                  
                  <TableHead className="text-center w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => {
                  const computedFinal = calculateFinalGrade(grade);
                  const equivalent = getEquivalent(computedFinal);

                  return (
                    <TableRow key={grade.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs font-semibold">{grade.subject_code}</TableCell>
                      <TableCell className="font-medium text-sm">{grade.descriptive_title}</TableCell>
                      <TableCell className="text-sm text-gray-600">{grade.instructor_name}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{grade.prelim_grade || '–'}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{grade.midterm_grade || '–'}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{grade.semifinal_grade || '–'}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{grade.final_grade || '–'}</TableCell>
                      
                      {/* COMPUTED DATA CELLS */}
                      <TableCell className="text-center font-mono font-bold text-gray-900 bg-red-50/30">
                        {computedFinal ? computedFinal.toFixed(2) : '--'}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-red-700">
                        {equivalent}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge className={`${getStatusBadgeClass(grade.status)} whitespace-nowrap`}>{grade.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        </div>
    );
  };


  return (
    <motion.div
      className="p-6 max-w-7xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 text-red-700 mr-3" />
          My Grades
        </h1>
        <p className="text-gray-600 mt-1">View your academic performance for each semester.</p>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <p className="font-medium text-gray-700">Filter by:</p>
            <div className="flex-1 flex flex-col md:flex-row gap-4 w-full">
              <MotionDropdown value={selectedYear} onChange={setSelectedYear} options={yearOptions} placeholder="Select Year" />
              <MotionDropdown value={selectedSemester} onChange={setSelectedSemester} options={semesterOptions} placeholder="Select Semester" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        {renderContent()}
      </motion.div>
    </motion.div>
  );
};

export default StudentGrade;