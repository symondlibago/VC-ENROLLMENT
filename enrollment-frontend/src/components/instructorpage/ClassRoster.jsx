// Modified ClassRoster.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookUser, Mail, Phone, Search, ChevronDown, GraduationCap, BookCopy, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { instructorAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner'; // Assuming this path based on your structure

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


const ClassRoster = () => {
  const [rosterData, setRosterData] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        setLoading(true);
        const response = await instructorAPI.getRoster();
        if (response.success) {
          setRosterData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch roster:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, []);
  
  const subjectOptions = useMemo(() => [
    { label: 'Filter by All Subjects', value: 'all' },
    ...rosterData.map(subject => ({
        label: `${subject.subject_code} - ${subject.descriptive_title}`,
        value: subject.subject_id.toString()
    }))
  ], [rosterData]);

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
  };

  const filteredStudents = useMemo(() => {
    let studentsToFilter = [];

    if (selectedSubjectId === 'all') {
      const allStudentsMap = new Map();
      rosterData.forEach(subject => {
          subject.students.forEach(student => {
              if (!allStudentsMap.has(student.id)) {
                  allStudentsMap.set(student.id, student);
              }
          });
      });
      studentsToFilter = Array.from(allStudentsMap.values());
    } else {
      const selectedSubject = rosterData.find(subject => subject.subject_id.toString() === selectedSubjectId);
      studentsToFilter = selectedSubject ? selectedSubject.students : [];
    }

    if (!searchTerm) {
      return studentsToFilter;
    }
    
    return studentsToFilter.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rosterData, selectedSubjectId, searchTerm]);

  const totalSubjects = useMemo(() => rosterData.length, [rosterData]);

  const totalUniqueStudents = useMemo(() => {
    const allStudentsMap = new Map();
    rosterData.forEach(subject => {
      subject.students.forEach(student => {
        if (!allStudentsMap.has(student.id)) {
          allStudentsMap.set(student.id, student);
        }
      });
    });
    return allStudentsMap.size;
  }, [rosterData]);

  const displayedStudents = filteredStudents.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  
  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" color="red" />
        </div>
      );
  }
  
  if (rosterData.length === 0) {
      return <div>No subjects or students found for your account.</div>
  }

  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
            <BookUser className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
            Class Roster
          </h1>
          <p className="text-gray-600 text-lg">Select a subject to view your students for the current semester.</p>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
        <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Total Subjects</p>
                    <p className="text-3xl font-bold heading-bold text-gray-900">{totalSubjects}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-full">
                    <BookCopy className="w-7 h-7 text-red-600" />
                </div>
            </CardContent>
        </Card>
         <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Total Unique Students</p>
                    <p className="text-3xl font-bold heading-bold text-gray-900">{totalUniqueStudents}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-full">
                    <GraduationCap className="w-7 h-7 text-blue-600" />
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Students Displayed</p>
                    <p className="text-3xl font-bold heading-bold text-gray-900">{displayedStudents}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-full">
                    <Users className="w-7 h-7 text-green-600" />
                </div>
            </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input 
                                placeholder="Search students by name or ID..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pl-10 border-1 border-gray-300 focus:border-red-800 focus:ring-1 focus:ring-red-800 rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="relative w-full md:w-auto min-w-[250px]">
                        <MotionDropdown 
                            value={selectedSubjectId} 
                            onChange={handleSubjectChange} 
                            options={subjectOptions} 
                            placeholder="Select a subject..."
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
      </motion.div>
      
      <motion.div 
        // Add the key prop here. When selectedSubjectId or searchTerm changes, 
        // this component remounts, forcing the animation to play immediately.
        key={`${selectedSubjectId}-${searchTerm}`}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden" // Ensure it starts hidden
        animate="visible" // Ensure it triggers the visible state immediately
      >
        {filteredStudents.map((student) => (
          <motion.div key={student.id} variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }}>
             {/* Card content remains the same */}
             <Card className="card-hover border-0 shadow-sm h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white shadow-lg">
                  <AvatarFallback className="text-xl bg-red-800 text-white font-bold">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-500 font-medium mb-2">{student.studentId}</p>
                <Badge variant={student.status === 'Enrolled' ? 'default' : 'destructive'} className="mb-4">
                  {student.status}
                </Badge>
                <p className="text-sm text-[var(--dominant-red)] font-semibold">{student.course}</p>
                <div className="mt-4 pt-4 border-t w-full space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{student.email}</span>
                    </div>
                     <div className="flex items-center justify-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{student.phone}</span>
                    </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ClassRoster;