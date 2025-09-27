import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    User, 
    Mail, 
    Phone, 
    Home, 
    BookOpen, 
    GraduationCap, 
    Briefcase, 
    Users as UsersIcon, 
    Image as ImageIcon, 
    PenSquare,
    Book,
    Building,
    Shield,
    Calendar
} from 'lucide-react';
import { enrollmentAPI, subjectAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper component to render detail items consistently
const DetailItem = ({ icon: Icon, label, value, fullWidth = false }) => (
  <div className={`flex items-start ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
    <Icon className="w-4 h-4 text-gray-500 mr-3 mt-1 shrink-0" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-sm text-gray-800 break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

const ViewStudentFullDetailsModal = ({ isOpen, onClose, studentId }) => {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [allCourseSubjects, setAllCourseSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('details'); // 'details' or 'subjects'

  useEffect(() => {
    const fetchDetails = async () => {
      if (!studentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const studentRes = await enrollmentAPI.getStudentDetails(studentId);
        if (!studentRes.success) throw new Error('Failed to load student details.');
        setStudentData(studentRes.data);
        
        const courseId = studentRes.data.student.course_id;
        if (courseId) {
          const subjectsRes = await subjectAPI.getByCourse(courseId);
          if (subjectsRes.success) {
            setAllCourseSubjects(subjectsRes.data);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, studentId]);

  const curriculum = useMemo(() => {
    return allCourseSubjects.reduce((acc, subject) => {
      const year = subject.year || 'Uncategorized';
      const semester = subject.semester || 'Uncategorized';
      if (!acc[year]) acc[year] = {};
      if (!acc[year][semester]) acc[year][semester] = [];
      acc[year][semester].push(subject);
      return acc;
    }, {});
  }, [allCourseSubjects]);

  const yearOrder = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Grade 11', 'Grade 12'];

  const student = studentData?.student;
  const enrolledSubjects = studentData?.subjects;

  if (!isOpen) return null;

  const renderStudentDetails = () => (
    <div className="space-y-6">
      {/* Basic & Enrollment Information */}
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <DetailItem icon={User} label="Full Name" value={`${student.last_name}, ${student.first_name} ${student.middle_name || ''}`} />
          <DetailItem icon={Mail} label="Email Address" value={student.email_address} />
          <DetailItem icon={Phone} label="Contact Number" value={student.contact_number} />
          <DetailItem icon={UsersIcon} label="Gender" value={student.gender} />
          <DetailItem icon={Calendar} label="Birth Date" value={new Date(student.birth_date).toLocaleDateString()} />
          <DetailItem icon={Home} label="Birth Place" value={student.birth_place} />
          <DetailItem icon={GraduationCap} label="Course" value={`[${student.course?.course_code}] ${student.course?.course_name}`} />
          <DetailItem icon={Book} label="Program" value={student.course?.program?.program_code} />
          <DetailItem icon={Briefcase} label="Enrollment Type" value={student.enrollment_type} />
          <DetailItem icon={Home} label="Address" value={student.address} fullWidth />
        </div>
      </div>
      
      {/* Parent/Guardian & Emergency Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent/Guardian Information</h3>
          <div className="space-y-4">
            <DetailItem icon={User} label="Father's Name" value={student.father_name} />
            <DetailItem icon={Phone} label="Father's Contact" value={student.father_contact_number} />
            <DetailItem icon={User} label="Mother's Name" value={student.mother_name} />
            <DetailItem icon={Phone} label="Mother's Contact" value={student.mother_contact_number} />
            <DetailItem icon={Home} label="Parents' Address" value={student.parents_address} fullWidth/>
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
          <div className="space-y-4">
            <DetailItem icon={Shield} label="Contact Name" value={student.emergency_contact_name} />
            <DetailItem icon={Phone} label="Contact Number" value={student.emergency_contact_number} />
            <DetailItem icon={Home} label="Contact Address" value={student.emergency_contact_address} fullWidth/>
          </div>
        </div>
      </div>

      {/* Educational Background & Identification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Educational Background</h3>
          <div className="space-y-3">
            {student.elementary && <div><p className="font-medium text-sm">Elementary</p><p className="text-sm text-gray-600">{student.elementary}</p></div>}
            {student.junior_high_school && <div><p className="font-medium text-sm">Junior High</p><p className="text-sm text-gray-600">{student.junior_high_school}</p></div>}
            {student.senior_high_school && <div><p className="font-medium text-sm">Senior High</p><p className="text-sm text-gray-600">{student.senior_high_school}</p></div>}
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Identification</h3>
          <div className="flex gap-4">
             {student.id_photo_url && (
                  <div>
                      <p className="text-xs text-gray-500 flex items-center mb-1"><ImageIcon className="w-4 h-4 mr-2"/>ID Photo</p>
                      <img src={student.id_photo_url} alt="ID" className="w-32 h-32 object-cover rounded-md border" />
                  </div>
             )}
             {student.signature_url && (
                  <div>
                      <p className="text-xs text-gray-500 flex items-center mb-1"><PenSquare className="w-4 h-4 mr-2"/>Signature</p>
                      <img src={student.signature_url} alt="Signature" className="w-32 h-32 object-contain rounded-md border bg-gray-50 p-2" />
                  </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubjects = () => (
     <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Subjects & Curriculum</h3>
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-2">Currently Enrolled Subjects</h4>
          {enrolledSubjects && enrolledSubjects.length > 0 ? (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[120px]">Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead className="w-[80px] text-center">Units</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {enrolledSubjects.map(sub => (
                          <TableRow key={sub.id}>
                              <TableCell>{sub.subject_code}</TableCell>
                              <TableCell>{sub.descriptive_title}</TableCell>
                              <TableCell className="text-center">{sub.total_units}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          ) : <p className="text-sm text-gray-500">No subjects currently enrolled.</p>}
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Full Course Curriculum</h4>
          <div className="space-y-4">
              {yearOrder.filter(year => curriculum[year]).map(year => (
                  <div key={year}>
                      <h5 className="font-bold text-md text-red-800">{year}</h5>
                      {Object.keys(curriculum[year]).map(semester => (
                          <div key={semester} className="pl-4 mt-2">
                              <p className="font-semibold text-gray-600">{semester}</p>
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead className="w-[120px]">Code</TableHead>
                                          <TableHead>Title</TableHead>
                                          <TableHead className="w-[80px] text-center">Units</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {curriculum[year][semester].map(sub => (
                                          <TableRow key={sub.id}>
                                              <TableCell>{sub.subject_code}</TableCell>
                                              <TableCell>{sub.descriptive_title}</TableCell>
                                              <TableCell className="text-center">{sub.total_units}</TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </div>
                      ))}
                  </div>
              ))}
          </div>
        </div>
      </div>
  );

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b bg-red-800 text-white rounded-t-lg">
            <h2 className="text-xl font-semibold">Student Full Details</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-96"><LoadingSpinner size="lg" color="red" /></div>
            ) : error ? (
              <div className="text-center text-red-500 p-8">{error}</div>
            ) : student ? (
              <div>
                <div className="mb-6 flex justify-center">
                    <div className="relative bg-gray-100 rounded-2xl p-1 inline-flex">
                        <motion.div
                            className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md"
                            initial={false}
                            animate={{ left: activeView === 'details' ? '4px' : '50%', right: activeView === 'details' ? '50%' : '4px' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <motion.button onClick={() => setActiveView('details')} className={`relative z-10 py-2 px-6 rounded-xl transition-colors duration-300 flex items-center gap-2 ${activeView === 'details' ? 'text-red-700' : 'text-gray-600'}`}><User size={16}/> Details</motion.button>
                        <motion.button onClick={() => setActiveView('subjects')} className={`relative z-10 py-2 px-6 rounded-xl transition-colors duration-300 flex items-center gap-2 ${activeView === 'subjects' ? 'text-red-700' : 'text-gray-600'}`}><BookOpen size={16} /> Subjects</motion.button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                    >
                        {activeView === 'details' ? renderStudentDetails() : renderSubjects()}
                    </motion.div>
                </AnimatePresence>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ViewStudentFullDetailsModal;