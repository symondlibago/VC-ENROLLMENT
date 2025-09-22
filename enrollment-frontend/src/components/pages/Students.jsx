import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter,
  Plus,
  BookOpen,
  GraduationCap,
  UserPlus,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SectionDetailsModal from '../modals/SectionDetailsModal';
import AddSectionModal from '../modals/AddSectionModal';

// Static sample data
const initialSections = [
  {
    id: 1,
    name: 'Mathematics 101',
    studentIds: [1, 2, 6],
    description: 'Introduction to Calculus and Algebra',
    instructor: 'Dr. Smith',
    schedule: 'MWF 9:00-10:00 AM'
  },
  {
    id: 2,
    name: 'Physics 201',
    studentIds: [3, 4],
    description: 'Classical Mechanics and Thermodynamics',
    instructor: 'Prof. Johnson',
    schedule: 'TTh 2:00-3:30 PM'
  },
  {
    id: 3,
    name: 'Chemistry 301',
    studentIds: [5],
    description: 'Organic Chemistry Fundamentals',
    instructor: 'Dr. Williams',
    schedule: 'MWF 11:00-12:00 PM'
  },
  {
    id: 4,
    name: 'Biology 101',
    studentIds: [],
    description: 'Introduction to Cell Biology',
    instructor: 'Dr. Brown',
    schedule: 'TTh 10:00-11:30 AM'
  },
  {
    id: 5,
    name: 'Computer Science 201',
    studentIds: [],
    description: 'Data Structures and Algorithms',
    instructor: 'Prof. Davis',
    schedule: 'MWF 1:00-2:00 PM'
  },
  {
    id: 6,
    name: 'English Literature 301',
    studentIds: [],
    description: 'Modern American Literature',
    instructor: 'Dr. Wilson',
    schedule: 'TTh 3:30-5:00 PM'
  }
];

const allStudents = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    address: 'New York, NY',
    enrollmentDate: '2024-01-15',
    status: 'active',
    courses: 3,
    gpa: '3.8',
    avatar: 'SJ',
    courseCode: 'MATH101'
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 234-5678',
    address: 'San Francisco, CA',
    enrollmentDate: '2024-01-10',
    status: 'active',
    courses: 4,
    gpa: '3.9',
    avatar: 'MC',
    courseCode: 'MATH101'
  },
  {
    id: 3,
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1 (555) 345-6789',
    address: 'Chicago, IL',
    enrollmentDate: '2024-01-08',
    status: 'inactive',
    courses: 2,
    gpa: '3.6',
    avatar: 'ED',
    courseCode: 'PHY201'
  },
  {
    id: 4,
    name: 'James Wilson',
    email: 'james.wilson@email.com',
    phone: '+1 (555) 456-7890',
    address: 'Boston, MA',
    enrollmentDate: '2024-01-12',
    status: 'active',
    courses: 5,
    gpa: '4.0',
    avatar: 'JW',
    courseCode: 'PHY201'
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    email: 'lisa.anderson@email.com',
    phone: '+1 (555) 567-8901',
    address: 'Seattle, WA',
    enrollmentDate: '2024-01-05',
    status: 'graduated',
    courses: 6,
    gpa: '3.7',
    avatar: 'LA',
    courseCode: 'CHEM301'
  },
  {
    id: 6,
    name: 'David Brown',
    email: 'david.brown@email.com',
    phone: '+1 (555) 678-9012',
    address: 'Austin, TX',
    enrollmentDate: '2024-01-20',
    status: 'active',
    courses: 2,
    gpa: '3.5',
    avatar: 'DB',
    courseCode: 'MATH101'
  },
  {
    id: 7,
    name: 'Olivia White',
    email: 'olivia.white@email.com',
    phone: '+1 (555) 789-0123',
    address: 'Miami, FL',
    enrollmentDate: '2024-02-01',
    status: 'active',
    courses: 1,
    gpa: '3.2',
    avatar: 'OW',
    courseCode: 'BIO101'
  },
  {
    id: 8,
    name: 'Daniel Green',
    email: 'daniel.green@email.com',
    phone: '+1 (555) 890-1234',
    address: 'Denver, CO',
    enrollmentDate: '2024-02-05',
    status: 'active',
    courses: 2,
    gpa: '3.5',
    avatar: 'DG',
    courseCode: 'CS201'
  },
  {
    id: 9,
    name: 'Sophia Hall',
    email: 'sophia.hall@email.com',
    phone: '+1 (555) 901-2345',
    address: 'Portland, OR',
    enrollmentDate: '2024-02-10',
    status: 'inactive',
    courses: 1,
    gpa: '3.0',
    avatar: 'SH',
    courseCode: 'ENG301'
  }
];

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSection, setSelectedSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [sections, setSections] = useState(initialSections);

  const stats = [
    {
      title: 'Total Sections',
      value: sections.length.toString(),
      change: '+2 new',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Students',
      value: allStudents.length.toString(),
      change: '+12.5%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Students',
      value: allStudents.filter(s => s.status === 'active').length.toString(),
      change: '+8.2%',
      icon: GraduationCap,
      color: 'text-[var(--dominant-red)]',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Enrolled Students',
      value: allStudents.filter(s => s.status !== 'graduated').length.toString(),
      change: '+5.4%',
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSection(null);
  };

  const handleAddSectionClick = () => {
    setIsAddSectionModalOpen(true);
  };

  const handleCloseAddSectionModal = () => {
    setIsAddSectionModalOpen(false);
  };

  const handleAddSection = (sectionData) => {
    const newSection = {
      id: sections.length + 1,
      name: sectionData.name,
      studentIds: [],
      description: `Course description for ${sectionData.course.name}`,
      instructor: 'TBD',
      schedule: 'TBD'
    };
    
    setSections([...sections, newSection]);
  };

  const handleAddStudentsToSection = (sectionId, studentIds) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? { ...section, studentIds: [...section.studentIds, ...studentIds] }
          : section
      )
    );
    
    // Update the selected section if it's currently open
    if (selectedSection && selectedSection.id === sectionId) {
      setSelectedSection(prevSection => ({
        ...prevSection,
        studentIds: [...prevSection.studentIds, ...studentIds]
      }));
    }
  };

  const filteredSections = sections.filter(section => {
    const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'with-students') return matchesSearch && section.studentIds.length > 0;
    if (selectedFilter === 'empty') return matchesSearch && section.studentIds.length === 0;
    
    return matchesSearch;
  });

  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="animate-fade-in">
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
                <BookOpen className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Students & Sections
              </h1>
              <p className="text-gray-600 text-lg">
                Manage sections and view enrolled students by clicking on section cards.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                className="gradient-primary text-white liquid-button"
                onClick={handleAddSectionClick}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
              <Button variant="outline" className="liquid-button">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              whileHover={{ scale: 1.02 }}
              className="liquid-hover"
            >
              <Card className="card-hover border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold heading-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-green-600 font-medium mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search sections by name or instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 liquid-morph"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph"
                >
                  <option value="all">All Sections</option>
                  <option value="with-students">With Students</option>
                  <option value="empty">Empty Sections</option>
                </select>
                <Button variant="outline" className="liquid-button">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="liquid-button">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sections Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.23, 1, 0.32, 1]
                }
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="liquid-hover cursor-pointer"
              onClick={() => handleSectionClick(section)}
            >
              <Card className="card-hover border-0 shadow-sm h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[var(--dominant-red)] rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{section.name}</h3>
                        <Badge 
                          className={`text-xs mt-1 ${
                            section.studentIds.length > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {section.studentIds.length} student{section.studentIds.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {section.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                        {section.instructor}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        {section.schedule}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Click to view students</span>
                      <div className="flex -space-x-2">
                        {section.studentIds.slice(0, 3).map((studentId, idx) => {
                          const student = allStudents.find(s => s.id === studentId);
                          return student ? (
                            <div
                              key={studentId}
                              className="w-8 h-8 bg-[var(--dominant-red)] rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                            >
                              {student.avatar}
                            </div>
                          ) : null;
                        })}
                        {section.studentIds.length > 3 && (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white">
                            +{section.studentIds.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Empty State */}
      {filteredSections.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sections found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Button 
            className="gradient-primary text-white liquid-button"
            onClick={handleAddSectionClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Section
          </Button>
        </motion.div>
      )}

      {/* Section Details Modal */}
      <SectionDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        section={selectedSection}
        students={allStudents}
        allStudents={allStudents}
        onAddStudentsToSection={handleAddStudentsToSection}
      />

      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={handleCloseAddSectionModal}
        onAddSection={handleAddSection}
      />
    </motion.div>
  );
};

export default Students;

