// In SubjectEnrolled.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, MapPin, User, AlertTriangle, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentAPI } from '@/services/api'; // Import your new API service
import LoadingSpinner from '@/components/layout/LoadingSpinner'; // Assuming you have a loading spinner

const SubjectCard = ({ subject, index }) => {
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: index * 0.1 },
      },
    };
  
    return (
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}
      >
        <Card className="h-full flex flex-col overflow-hidden shadow-sm">
          {/* Added `min-h-24` to ensure a consistent header height */}
          <div className="bg-gradient-to-br from-red-800 to-red-700 p-4 text-white min-h-30 flex flex-col justify-center">
            <div className="flex justify-between items-start">
              <div>
                <Badge className="mb-2 bg-white text-red-800 font-bold">
                  {subject.subject_code}
                </Badge>
                <h3 className="text-lg font-bold text-white">
                  {subject.descriptive_title}
                </h3>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {subject.status}
              </Badge>
            </div>
          </div>
  
          <CardContent className="p-4 flex-grow flex flex-col justify-between">
            <div className="space-y-3 text-sm text-gray-600">
              {/* Instructor */}
              {subject.instructor && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                  <span>{subject.instructor}</span>
                </div>
              )}
  
              {/* Schedule Display */}
              {subject.schedules && subject.schedules.length > 0 && (
                <div className="flex items-start">
                  <Clock className="w-4 h-4 mr-3 text-gray-400 mt-1 flex-shrink-0" />
                  <ul className="list-none space-y-1">
                    {subject.schedules.map((sched, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{sched.day}</span> -{" "}
                        <span className="font-medium font-mono">{sched.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
  
              {/* Room */}
              {subject.room && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                  <span>{subject.room}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex justify-between items-center">
              <span>{subject.semester}</span>
              <span className='font-mono'>S.Y. {subject.school_year}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };


const SubjectEnrolled = () => {
  // --- 1. State management ---
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 2. Data fetching with useEffect ---
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await studentAPI.getEnrolledSubjects();
        if (response.success) {
          setSubjects(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []); // Empty array ensures this runs only once on component mount

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  // --- 3. Conditional Rendering ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" color="red" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10">
        <AlertTriangle className="mx-auto w-12 h-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold">Could not load subjects</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BookOpen className="w-8 h-8 text-red-700 mr-3" />
          My Enrolled Subjects
        </h1>
        <p className="text-gray-600 mt-1">Here is your class schedule for the current semester.</p>
      </motion.div>
      
      {subjects.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {subjects.map((subject, index) => (
            <SubjectCard key={subject.id} subject={subject} index={index} />
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-10 bg-gray-50 rounded-lg mt-8"
        >
          <Inbox className="mx-auto w-12 h-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold">No Subjects Found</h2>
          <p className="text-gray-500">You are not currently enrolled in any subjects for this semester.</p>
        </motion.div>
      )}
    </div>
  );
};

export default SubjectEnrolled;