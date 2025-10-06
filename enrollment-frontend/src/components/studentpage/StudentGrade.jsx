import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentAPI } from '@/services/api';
import { FileText, ChevronDown, AlertCircle, Inbox, Book, User, Star } from 'lucide-react';
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
import { useIsMobile } from "@/hooks/use-mobile"; // Step 1: Import the hook

// (The MotionDropdown component remains the same as before)
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

// --- Step 2: Create a new component for the mobile card view ---
const GradeCard = ({ grade }) => {
    const getStatusBadgeClass = (status) => {
        switch (status) {
          case 'Passed': return 'bg-green-100 text-green-800';
          case 'Failed': return 'bg-red-100 text-red-800';
          case 'In Progress': return 'bg-blue-100 text-blue-800';
          default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <Card className="w-full shadow-sm">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="font-mono text-xs text-red-700">{grade.subject_code}</p>
                        <h3 className="font-bold text-gray-800">{grade.descriptive_title}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                            <User className="w-3 h-3 mr-1.5" /> {grade.instructor_name}
                        </p>
                    </div>
                    <Badge className={getStatusBadgeClass(grade.status)}>{grade.status}</Badge>
                </div>

                <div className="border-t pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p className="text-gray-500">Prelim:</p>
                    <p className="font-mono text-right font-medium">{grade.prelim_grade || '–'}</p>
                    
                    <p className="text-gray-500">Midterm:</p>
                    <p className="font-mono text-right font-medium">{grade.midterm_grade || '–'}</p>
                    
                    <p className="text-gray-500">Semifinal:</p>
                    <p className="font-mono text-right font-medium">{grade.semifinal_grade || '–'}</p>
                    
                    <p className="text-gray-500">Final:</p>
                    <p className="font-mono text-right font-medium text-red-700">{grade.final_grade || '–'}</p>
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
  const isMobile = useIsMobile(); // Use the hook to check screen size

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

  // --- Step 3: Create the main content renderer ---
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
    
    // --- CONDITIONAL RENDERING LOGIC ---
    return isMobile ? (
        // Mobile View: A list of cards
        <div className="space-y-4">
            {grades.map((grade) => (
                <GradeCard key={grade.id} grade={grade} />
            ))}
        </div>
    ) : (
        // Desktop View: The original table
        <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Code</TableHead>
                  <TableHead>Descriptive Title</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead className="text-center">Prelim</TableHead>
                  <TableHead className="text-center">Midterm</TableHead>
                  <TableHead className="text-center">Semifinal</TableHead>
                  <TableHead className="text-center">Final</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-mono">{grade.subject_code}</TableCell>
                    <TableCell className="font-medium">{grade.descriptive_title}</TableCell>
                    <TableCell>{grade.instructor_name}</TableCell>
                    <TableCell className="text-center font-mono">{grade.prelim_grade || '–'}</TableCell>
                    <TableCell className="text-center font-mono">{grade.midterm_grade || '–'}</TableCell>
                    <TableCell className="text-center font-mono">{grade.semifinal_grade || '–'}</TableCell>
                    <TableCell className="text-center font-mono">{grade.final_grade || '–'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusBadgeClass(grade.status)}>{grade.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
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