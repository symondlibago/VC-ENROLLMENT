import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Book, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockSchedule = [
  { day: 'Monday', time: '09:00 AM - 11:00 AM', subject: 'Introduction to Algorithms', code: 'CS 201', room: 'Room 301', section: 'BSCS-3A' },
  { day: 'Monday', time: '01:00 PM - 03:00 PM', subject: 'Data Structures', code: 'CS 202', room: 'Lab 2', section: 'BSCS-3B' },
  { day: 'Tuesday', time: '10:00 AM - 12:00 PM', subject: 'Web Development', code: 'IT 305', room: 'Lab 5', section: 'BSIT-4A' },
  { day: 'Wednesday', time: '09:00 AM - 11:00 AM', subject: 'Introduction to Algorithms', code: 'CS 201', room: 'Room 301', section: 'BSCS-3A' },
  { day: 'Thursday', time: '10:00 AM - 12:00 PM', subject: 'Web Development', code: 'IT 305', room: 'Lab 5', section: 'BSIT-4A' },
  { day: 'Friday', time: '01:00 PM - 03:00 PM', subject: 'Data Structures', code: 'CS 202', room: 'Lab 2', section: 'BSCS-3B' },
  { day: 'Friday', time: '03:00 PM - 04:00 PM', subject: 'Faculty Consultation', code: 'N/A', room: 'Faculty Room', section: '' },
];

const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const InstructorSchedule = () => {
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const groupedSchedule = daysOrder.map(day => ({
    day,
    schedules: mockSchedule.filter(s => s.day === day),
  }));

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

      <motion.div className="space-y-8" variants={containerVariants}>
        {groupedSchedule.map(({ day, schedules }) => (
          schedules.length > 0 && (
            <motion.div key={day} variants={itemVariants}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{day}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedules.map((schedule, index) => (
                  <motion.div key={index} whileHover={{ scale: 1.02 }}>
                    <Card className="card-hover border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                           <div>
                                <p className="font-bold text-lg text-gray-900">{schedule.subject}</p>
                                <p className="text-sm text-gray-500">{schedule.code}</p>
                           </div>
                           {schedule.section && <Badge>{schedule.section}</Badge>}
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-[var(--dominant-red)]" />
                            <span>{schedule.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-[var(--dominant-red)]" />
                            <span>{schedule.room}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        ))}
      </motion.div>
    </motion.div>
  );
};

export default InstructorSchedule;