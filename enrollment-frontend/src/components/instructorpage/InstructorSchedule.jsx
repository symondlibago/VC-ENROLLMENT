import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Book, MapPin, CalendarOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { instructorAPI } from '@/services/api';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/layout/LoadingSpinner'; // Make sure this path is correct

const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const InstructorSchedule = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await instructorAPI.getSchedule();
        if (response.success) {
          setScheduleData(response.data);
        } else {
          toast.error(response.message || 'Failed to load schedule.');
        }
      } catch (error) {
        toast.error(error.message || 'An error occurred while fetching the schedule.');
        console.error("Schedule fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const groupedSchedule = daysOrder.map(day => ({
    day,
    schedules: scheduleData.filter(s => s.day === day),
  })).filter(group => group.schedules.length > 0); // Only keep days with schedules

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[40vh]">
          <LoadingSpinner size="lg" color="red" />
        </div>
      );
    }
    
    if (groupedSchedule.length === 0) {
      return (
        <motion.div variants={itemVariants} className="text-center py-12">
           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarOff className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Found</h3>
            <p className="text-gray-500">There are no classes or events scheduled for you this week.</p>
        </motion.div>
      );
    }
    
    return (
      <motion.div className="space-y-8" variants={containerVariants}>
        {groupedSchedule.map(({ day, schedules }) => (
          <motion.div key={day} variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{day}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schedules.map((schedule, index) => (
                <motion.div key={index} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                  <Card className="card-hover border-0 shadow-sm h-full">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                             <Book className="w-5 h-5 text-red-800" />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-gray-900 leading-tight">{schedule.subject}</p>
                            <p className="text-sm text-gray-500 font-mono">{schedule.code}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-700">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-[var(--dominant-red)]" />
                          <span>{schedule.time || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-[var(--dominant-red)]" />
                          <span>{schedule.room || 'Not specified'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

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
            <Calendar className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
            My Weekly Schedule
          </h1>
          <p className="text-gray-600 text-lg">Your teaching and consultation hours for the week.</p>
        </div>
      </motion.div>

      {renderContent()}
    </motion.div>
  );
};

export default InstructorSchedule;