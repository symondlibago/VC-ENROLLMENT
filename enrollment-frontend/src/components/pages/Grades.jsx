import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
// ✅ 1. IMPORTED a few more icons
import { BookUser, Search, Eye, Users, Hash, User, GraduationCap, CalendarDays, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import StudentGradesModal from '@/components/modals/StudentGradesModal';

const Grades = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    studentId: null,
    studentName: '',
  });

  useEffect(() => {
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
  }, []);

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;
  }

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
          <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
            <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
              <BookUser className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
              Student Gradebook
            </h1>
            <p className="text-gray-600 text-lg">
              View the academic records of all enrolled students.
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              {/* ✅ 2. ADDED icon to the card title */}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-1 border-gray-300"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black uppercase">
                    <tr>
                      <th className="px-6 py-3 flex items-center gap-2">
                        <Hash size={16} /> Student ID
                      </th>
                      <th className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <User size={16} /> Name
                        </div>
                      </th>
                      <th className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap size={16} /> Course
                        </div>
                      </th>
                      <th className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={16} /> Year Level
                        </div>
                      </th>
                      <th className="px-6 py-3">
                        <div className="flex items-center gap-2">
                           <Settings2 size={16} /> Action
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono">
                          <div className="flex items-center gap-2">
                            <Hash size={14} className="text-gray-500" />
                            <span>{student.student_id_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                           <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-500" />
                            <span>{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                            <GraduationCap size={14} className="text-gray-500" />
                            <span>{student.courseName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-gray-500" />
                            <span>{student.year}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewGrades(student.id, student.name)}
                            className="gradient-primary text-white liquid-button cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Grades
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No students found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Grades;