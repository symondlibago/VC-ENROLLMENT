import React, { useState, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SectionDetailsModal from '../modals/SectionDetailsModal';
import AddSectionModal from '../modals/AddSectionModal';

// Import your API methods
import { sectionAPI, enrollmentAPI , courseAPI } from '@/services/api';
import { toast } from 'sonner';

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSection, setSelectedSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);

  // State for data from backend
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSectionLoading, setIsSectionLoading] = useState(false); // For modal loading state

  // ... useEffect and stats hooks remain the same ...
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sectionsRes, coursesRes, studentsRes] = await Promise.all([
          sectionAPI.getAll(),
          courseAPI.getAll(),
          enrollmentAPI.getEnrolledStudents(),
        ]);
        
        setSections(sectionsRes.data || []);
        setCourses(coursesRes.data || []);
        setEnrolledStudents(studentsRes.data || []);
      } catch (error) {
        toast.error('Failed to load data. Please try again.');
        console.error("Data fetching error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: 'Total Sections',
      value: sections.length.toString(),
      change: `+${sections.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week`,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Enrolled Students',
      value: enrolledStudents.length.toString(),
      change: 'All active',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
        title: 'Total Courses',
        value: courses.length.toString(),
        change: 'Available',
        icon: GraduationCap,
        color: 'text-[var(--dominant-red)]',
        bgColor: 'bg-red-50'
    },
    {
      title: 'Empty Sections',
      value: sections.filter(s => s.students_count === 0).length.toString(),
      change: 'Needs students',
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


  // FIX: Updated handleSectionClick to fetch details before opening modal
  const handleSectionClick = async (section) => {
    setIsSectionLoading(true);
    setIsModalOpen(true); // Open modal shell immediately
    try {
      const response = await sectionAPI.getById(section.id);
      if (response.success) {
        setSelectedSection(response.data);
      } else {
        toast.error('Could not load section details.');
        setIsModalOpen(false); // Close modal on error
      }
    } catch (error) {
      toast.error('An error occurred while fetching details.');
      setIsModalOpen(false);
    } finally {
      setIsSectionLoading(false);
    }
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

  const handleAddSection = async (sectionData) => {
    try {
      const response = await sectionAPI.create({
        name: sectionData.name,
        course_id: sectionData.course.id,
      });

      if (response.success) {
        setSections(prevSections => [response.data, ...prevSections]);
        toast.success('Section added successfully!');
        handleCloseAddSectionModal();
      } else {
        toast.error('Failed to add section.');
      }
    } catch (error) {
      toast.error('An error occurred while adding the section.');
      console.error("Add section error:", error);
    }
  };

  const handleAddStudentsToSection = async (sectionId, studentIds) => {
    try {
      const response = await sectionAPI.addStudents(sectionId, studentIds);
      if (response.success) {
        // The response from addStudents now contains the updated section with the full student list
        const updatedSection = response.data;

        // Update the main sections list with the new student count
        setSections(prevSections =>
          prevSections.map(sec =>
            sec.id === sectionId
              ? { ...sec, students_count: updatedSection.students.length }
              : sec
          )
        );

        // Update the selected section in the modal with the full new data
        setSelectedSection(updatedSection);

        toast.success('Students added successfully!');
      } else {
        toast.error('Failed to add students.');
      }
    } catch (error) {
      toast.error('An error occurred while adding students.');
      console.error("Add students error:", error);
    }
  };
  
  // ... filteredSections and loading checks remain the same ...
  const filteredSections = sections.filter(section => {
    const courseName = section.course?.course_name || '';
    const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'with-students') return matchesSearch && section.students_count > 0;
    if (selectedFilter === 'empty') return matchesSearch && section.students_count === 0;
    
    return matchesSearch;
  });

  if (loading) {
    return <div className='p-6'>Loading...</div>;
  }


  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ... The rest of the JSX is unchanged ... */}
      {/* Header, Stats, Search, and Sections Grid remain the same */}
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
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
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
              <div className="flex-1 w-full md:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search sections by name or course..."
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
              <Card className="card-hover border-0 shadow-sm h-full flex flex-col">
                <CardContent className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[var(--dominant-red)] rounded-xl flex items-center justify-center shrink-0">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{section.name}</h3>
                           {/* FIX: Used students_count from API instead of studentIds.length */}
                          <Badge 
                            className={`text-xs mt-1 ${
                              section.students_count > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {section.students_count} student{section.students_count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                            <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="truncate">{section.course?.course_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{section.course?.program?.program_code || 'No Program'}</span>
                        </div>
                    </div>
                  </div>

                  {/* FIX: Removed avatar preview since student details are not in this API call */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Click to view students</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Empty State */}
      {filteredSections.length === 0 && !loading && (
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

      {/* FIX: Updated props passed to SectionDetailsModal */}
      <SectionDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        section={selectedSection}
        isLoading={isSectionLoading} // Pass loading state
        allStudents={enrolledStudents} // This is the list of ALL students available to be added
        onAddStudentsToSection={handleAddStudentsToSection}
      />

      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={handleCloseAddSectionModal}
        onAddSection={handleAddSection}
        courses={courses}
      />
    </motion.div>
  );
};

export default Students;