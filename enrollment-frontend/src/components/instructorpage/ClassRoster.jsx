import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookUser, Mail, Phone, Search, ChevronDown, GraduationCap, BookCopy, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { instructorAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

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
        className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-2 focus:ring-[var(--dominant-red)]/20 flex items-center justify-between min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900">{selectedOption.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 text-gray-900"
              >
                {option.label}
              </button>
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

  const filteredStudents = useMemo(() => {
    let studentsToFilter = [];
    if (selectedSubjectId === 'all') {
      const allStudentsMap = new Map();
      rosterData.forEach(subject => {
        subject.students.forEach(student => {
          if (!allStudentsMap.has(student.id)) allStudentsMap.set(student.id, student);
        });
      });
      studentsToFilter = Array.from(allStudentsMap.values());
    } else {
      const selectedSubject = rosterData.find(subject => subject.subject_id.toString() === selectedSubjectId);
      studentsToFilter = selectedSubject ? selectedSubject.students : [];
    }

    if (!searchTerm) return studentsToFilter;
    return studentsToFilter.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rosterData, selectedSubjectId, searchTerm]);

  const totalSubjects = rosterData.length;
  const totalUniqueStudents = useMemo(() => {
    const allStudentsMap = new Map();
    rosterData.forEach(subject => {
      subject.students.forEach(student => {
        if (!allStudentsMap.has(student.id)) allStudentsMap.set(student.id, student);
      });
    });
    return allStudentsMap.size;
  }, [rosterData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" color="red" /></div>;
  if (rosterData.length === 0) return <div className="p-6">No subjects or students found for your account.</div>;

  return (
    <motion.div className="p-6 space-y-6 max-w-7xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <BookUser className="w-8 h-8 text-red-700 mr-3" />
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
              <p className="text-3xl font-bold text-gray-900">{totalSubjects}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-full"><BookCopy className="w-7 h-7 text-red-600" /></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{totalUniqueStudents}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full"><GraduationCap className="w-7 h-7 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Displayed</p>
              <p className="text-3xl font-bold text-gray-900">{filteredStudents.length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full"><Users className="w-7 h-7 text-green-600" /></div>
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
                    placeholder="Search students..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10 rounded-lg"
                  />
                </div>
              </div>
              <div className="w-full md:w-auto min-w-[250px]">
                <MotionDropdown value={selectedSubjectId} onChange={setSelectedSubjectId} options={subjectOptions} placeholder="Select a subject..." />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* --- Updated from Grid to Table --- */}
      <motion.div 
        variants={itemVariants}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Student Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Student ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Course</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Contact Info</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-gray-50 transition-colors cursor-default"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border shadow-sm">
                        <AvatarFallback className="bg-red-800 text-white text-xs font-bold">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-gray-900">{student.name.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap font-mono">
                    {student.studentId}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-red-800 font-semibold">{student.course}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-500 gap-2">
                        <Mail className="w-3 h-3" /> {student.email}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 gap-2">
                        <Phone className="w-3 h-3" /> {student.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={student.status === 'Enrolled' ? 'default' : 'destructive'} className="text-xs">
                      {student.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-12 text-center text-gray-500">No students found matches your search/filter.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClassRoster;