import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookUser, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const mockStudents = [
  { id: 1, name: 'Eleanor Vance', studentId: 'S2023-001', course: 'BS in Computer Science', email: 'eleanor.v@example.com', phone: '555-0101', status: 'Enrolled' },
  { id: 2, name: 'Marcus Holloway', studentId: 'S2023-002', course: 'BS in Information Technology', email: 'marcus.h@example.com', phone: '555-0102', status: 'Enrolled' },
  { id: 3, name: 'Clara Oswald', studentId: 'S2023-003', course: 'BS in Computer Science', email: 'clara.o@example.com', phone: '555-0103', status: 'Enrolled' },
  { id: 4, name: 'Aiden Pearce', studentId: 'S2023-004', course: 'BS in Information Technology', email: 'aiden.p@example.com', phone: '555-0104', status: 'Conditional' },
  { id: 5, name: 'Jodie Whittaker', studentId: 'S2023-005', course: 'BS in Computer Science', email: 'jodie.w@example.com', phone: '555-0105', status: 'Enrolled' },
  { id: 6, name: 'Arthur Pendragon', studentId: 'S2023-006', course: 'BS in Game Development', email: 'arthur.p@example.com', phone: '555-0106', status: 'Enrolled' },
];

const ClassRoster = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
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
            <BookUser className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
            Class Roster
          </h1>
          <p className="text-gray-600 text-lg">Your students for the current semester.</p>
        </div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {mockStudents.map((student) => (
          <motion.div key={student.id} variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }}>
            <Card className="card-hover border-0 shadow-sm h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white shadow-lg">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt={student.name} />
                  <AvatarFallback className="text-xl bg-gray-200">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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