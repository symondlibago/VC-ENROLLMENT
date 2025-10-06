// src/components/studentpage/StudentSchedule.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { studentAPI } from '@/services/api';
import { Calendar, Clock, MapPin, User, BookOpen, AlertCircle, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const response = await studentAPI.getSchedule();
        if (response.success) {
          setSchedule(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch schedule');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  // Helper function to sort schedules by time
  const parseTime = (timeStr) => {
    if (!timeStr) return 2400; // Push items with no time to the end
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return 2400;
    let [_, hours, minutes, period] = match;
    hours = parseInt(hours);
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 100 + parseInt(minutes);
  };

  // Group schedules by day and sort them
  const groupedSchedule = useMemo(() => {
    const grouped = schedule.reduce((acc, item) => {
      const day = item.day || 'Unscheduled';
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(item);
      return acc;
    }, {});
    
    // Sort schedules within each day by time
    for (const day in grouped) {
        grouped[day].sort((a, b) => parseTime(a.time) - parseTime(b.time));
    }
    
    return grouped;
  }, [schedule]);

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
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
          <Calendar className="w-8 h-8 text-red-700 mr-3" />
          My Weekly Schedule
        </h1>
        <p className="text-gray-600 mt-1">Your class schedule for the current semester.</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20"><LoadingSpinner size="lg" color="red" /></div>
      ) : error ? (
        <div className="text-center p-10 bg-red-50 rounded-lg">
          <AlertCircle className="mx-auto w-12 h-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-red-800">Could Not Load Schedule</h2>
          <p className="text-red-600">{error}</p>
        </div>
      ) : schedule.length > 0 ? (
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
        >
          {dayOrder.filter(day => groupedSchedule[day]).map(day => (
            <motion.div key={day} variants={itemVariants}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl text-red-800">{day}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSchedule[day].map(item => (
                    <div key={item.id} className="p-3 bg-red-50 rounded-lg border">
                      <p className="font-bold text-gray-800 flex items-center mb-1">
                        <Clock className="w-4 h-4 mr-2 text-red-700" />
                        {item.time || 'No time set'}
                      </p>
                      <div className="text-sm space-y-1 pl-6">
                         <p className="flex items-start">
                           <BookOpen className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                           <span className="font-semibold">{item.subject_code}</span>: {item.descriptive_title}
                         </p>
                         <p className="flex items-center">
                           <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                           {item.room_no || 'TBA'}
                         </p>
                         <p className="flex items-center">
                           <User className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                           {item.instructor_name}
                         </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="text-center p-10 bg-gray-50 rounded-lg">
          <Inbox className="mx-auto w-12 h-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold">No Schedule Found</h2>
          <p className="text-gray-500">You do not have any classes scheduled for this semester.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StudentSchedule;