import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, GraduationCap, ArrowDownAZ, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subjectAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';
// PDF Generation
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ViewStudentsModal = ({ isOpen, onClose, subject }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && subject?.id) {
      const fetchStudents = async () => {
        setLoading(true);
        try {
          const response = await subjectAPI.getEnrolledStudents(subject.id);
          if (response.success) {
            // Sort by Section first, then by Name
            const sortedData = [...response.data].sort((a, b) => {
              const secA = a.section || "Unassigned";
              const secB = b.section || "Unassigned";
              if (secA !== secB) return secA.localeCompare(secB);
              return a.name.localeCompare(b.name);
            });
            setStudents(sortedData);
          }
        } catch (error) {
          console.error("Error fetching students:", error);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      };
      fetchStudents();
    }
  }, [isOpen, subject]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleDateString();
    
    // PDF Title & Header Info
    doc.setFontSize(20);
    doc.setTextColor(153, 27, 27); // Dark Red
    doc.text('OFFICIAL CLASS ROSTER', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Subject: ${subject?.subject_code} - ${subject?.descriptive_title}`, 14, 30);
    doc.text(`Academic Period: ${subject?.semester} | Date: ${timestamp}`, 14, 35);
    doc.text(`Total Enrolled: ${students.length}`, 14, 40);

    // Prepare Table Data with Grouping Rows
    const finalTableRows = [];
    let currentSection = null;

    students.forEach((student) => {
      // If the section changes, insert a "Section Header" row into the PDF table
      if (student.section !== currentSection) {
        currentSection = student.section;
        finalTableRows.push([
          { 
            content: `SECTION: ${currentSection || 'UNASSIGNED'}`, 
            colSpan: 4, 
            styles: { 
                fillColor: [243, 244, 246], // Light Gray background
                textColor: [31, 41, 55],    // Dark Gray text
                fontStyle: 'bold',
                halign: 'left'
            } 
          }
        ]);
      }

      // Add the actual student data row
      finalTableRows.push([
        student.student_id,
        student.name?.toUpperCase(),
        `${student.course} - ${student.year}`,
        student.section || 'N/A'
      ]);
    });

    autoTable(doc, {
      startY: 45,
      head: [['ID Number', 'Student Name', 'Course & Year', 'Section']],
      body: finalTableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [153, 27, 27], // Red header
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 'auto' },
        3: { fontStyle: 'bold' }
      },
      // Ensure section headers don't get separated from their students on page breaks
      didParseCell: function (data) {
        if (data.row.raw[0] && data.row.raw[0].content && data.row.raw[0].content.includes('SECTION:')) {
            data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save(`${subject?.subject_code}_Roster.pdf`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b bg-red-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Enrolled Students</h2>
                <p className="text-sm text-white">{subject?.subject_code} - {subject?.descriptive_title}</p>
              </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:text-red-800 hover:bg-white hover:white cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </Button>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : students.length > 0 ? (
              <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID Number</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Course & Year</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                         Section <ArrowDownAZ className="w-3 h-3"/>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student, index) => {
                      const isNewSection = index === 0 || student.section !== students[index - 1].section;
                      return (
                        <React.Fragment key={student.id}>
                          {isNewSection && (
                            <tr className="bg-blue-50/50">
                              <td colSpan="4" className="px-4 py-2 text-xs font-bold text-blue-700 uppercase tracking-widest border-y border-blue-100">
                                {student.section || 'UNASSIGNED'}
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-sm text-red-600">{student.student_id}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{student.name?.toUpperCase()}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.course} - {student.year}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600">{student.section}</td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500 italic">No students found.</div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">
              Total Enrolled: <span className="text-gray-900 font-bold">{students.length}</span>
            </span>
            <div className="flex gap-3">
               <Button 
                onClick={handleExportPDF} 
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                disabled={students.length === 0}
               >
                 <Download className="w-4 h-4" />
                 Export Roster
               </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ViewStudentsModal;