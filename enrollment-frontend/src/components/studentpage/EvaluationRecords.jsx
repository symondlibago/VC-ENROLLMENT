import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { studentAPI } from '@/services/api';
import { ClipboardList, AlertCircle, Inbox, CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

const EvaluationRecords = () => {
  const [curriculumData, setCurriculumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurriculum = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await studentAPI.getCurriculum();
        if (response.success) {
          setCurriculumData(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCurriculum();
  }, []);

  // Create an efficient lookup map for subject grades and statuses
  const subjectStatusMap = useMemo(() => {
    if (!curriculumData?.grades) return new Map();
    return curriculumData.grades.reduce((map, grade) => {
      map.set(grade.subject_id, grade.status);
      return map;
    }, new Map());
  }, [curriculumData]);


  // Process the flat subject list into a nested object grouped by year and semester
  const curriculumByYear = useMemo(() => {
    if (!curriculumData?.subjects) return {};
    return curriculumData.subjects.reduce((acc, subject) => {
      const year = subject.year || 'Uncategorized';
      const semester = subject.semester || 'Uncategorized';
      if (!acc[year]) acc[year] = {};
      if (!acc[year][semester]) acc[year][semester] = [];
      acc[year][semester].push(subject);
      return acc;
    }, {});
  }, [curriculumData]);

  // Define the display order for years/grades
  const yearOrder = ['Grade 11', 'Grade 12', '1st Year', '2nd Year', '3rd Year', '4th Year'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const getStatusIndicator = (status) => {
      if (status === 'Passed') {
          return <CheckCircle className="w-5 h-5 text-green-600" />;
      }
      if (status === 'Failed') {
          return <XCircle className="w-5 h-5 text-red-600" />;
      }
      return null; // Return null for 'In Progress' or no grade
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
          <ClipboardList className="w-8 h-8 text-red-700 mr-3" />
          Evaluation Records
        </h1>
        <p className="text-gray-600 mt-1">
          Showing the full curriculum for: <span className="font-semibold text-gray-800">{curriculumData?.course_name || 'your course'}</span>
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="flex justify-center items-center py-20"><LoadingSpinner size="lg" color="red" /></div>
        ) : error ? (
          <div className="text-center p-10 bg-red-50 rounded-lg">
            <AlertCircle className="mx-auto w-12 h-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-red-800">Could Not Load Curriculum</h2>
            <p className="text-red-600">{error}</p>
          </div>
        ) : curriculumData && curriculumData.subjects.length > 0 ? (
          <div className="space-y-8">
            {yearOrder.filter(year => curriculumByYear[year]).map(year => (
              <div key={year}>
                <h2 className="text-2xl font-bold text-red-800 border-b-2 border-red-200 pb-2 mb-4">{year}</h2>
                {Object.keys(curriculumByYear[year]).map(semester => (
                  <div key={semester} className="mb-6">
                    <h3 className="font-semibold text-lg text-gray-700 mb-2">{semester}</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Subject Code</TableHead>
                                    <TableHead>Descriptive Title</TableHead>
                                    <TableHead className="w-[120px]">Prerequisite</TableHead>
                                    <TableHead className="text-center w-[80px]">Units</TableHead>
                                    <TableHead className="text-center w-[100px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {curriculumByYear[year][semester].map(subject => {
                                    const status = subjectStatusMap.get(subject.id);
                                    let rowClass = '';
                                    if (status === 'Passed') {
                                        rowClass = 'bg-green-200 hover:bg-green-200';
                                    } else if (status === 'Failed') {
                                        rowClass = 'bg-red-200 hover:bg-red-200';
                                    }
                                    
                                    return (
                                        <TableRow key={subject.id} className={`${rowClass} transition-colors`}>
                                            <TableCell className="font-mono">{subject.subject_code}</TableCell>
                                            <TableCell className="font-medium">{subject.descriptive_title}</TableCell>
                                            <TableCell className="font-mono">{subject.prerequisite?.subject_code || 'None'}</TableCell>
                                            <TableCell className="text-center font-mono">{subject.total_units || subject.number_of_hours}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    {getStatusIndicator(status)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-10 bg-gray-50 rounded-lg">
            <Inbox className="mx-auto w-12 h-12 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold">No Curriculum Found</h2>
            <p className="text-gray-500">We could not find a curriculum for your enrolled course.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default EvaluationRecords;
