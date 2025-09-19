import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const DownloadCOR = ({ student, subjectsWithSchedules }) => {

  const generatePDF = () => {
    const doc = new jsPDF();

    // Add School Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHOOL OF TOMORROW', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Cagayan de Oro City, 9000 Philippines', doc.internal.pageSize.getWidth() / 2, 27, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF REGISTRATION', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const sySem = `A.Y. ${student.school_year || 'N/A'} - ${student.semester || 'N/A'}`;
    doc.text(sySem, doc.internal.pageSize.getWidth() / 2, 46, { align: 'center' });


    // Student Details
    doc.setFontSize(10);
    let yPos = 60;

    doc.setFont('helvetica', 'bold');
    doc.text('Student No.:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(student.student_id_number || 'N/A', 45, yPos);
    
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Student Name:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${student.last_name || ''}, ${student.first_name || ''} ${student.middle_name || ''}`, 45, yPos);
    
    yPos += 7;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Course & Year:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    const courseText = `[${student.course?.course_code || 'N/A'}] ${student.course?.course_name || 'N/A'} - ${student.year || 'N/A'} (${student.enrollment_type || ''})`;
    doc.text(courseText, 45, yPos);

    // Subjects Table
    const tableColumn = ["Code", "Descriptive Title", "Lec", "Lab", "Units", "Day", "Time", "Room"];
    const tableRows = [];

    subjectsWithSchedules.forEach(subject => {
      if (subject.schedules && subject.schedules.length > 0) {
        subject.schedules.forEach(schedule => {
            tableRows.push([
                subject.subject_code,
                subject.descriptive_title,
                subject.lec_hrs,
                subject.lab_hrs,
                subject.total_units,
                schedule.day || 'TBA',
                schedule.time || 'TBA',
                schedule.room_no || 'TBA'
            ]);
        });
      } else {
        // If no schedule, push one row with TBA
        tableRows.push([
            subject.subject_code,
            subject.descriptive_title,
            subject.lec_hrs,
            subject.lab_hrs,
            subject.total_units,
            'TBA',
            'TBA',
            'TBA'
        ]);
      }
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPos + 10,
      headStyles: { fillColor: [148, 20, 20], fontSize: 8 }, // Red header
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: {
        1: { cellWidth: 60 }, // Descriptive Title column wider
      }
    });
    
    const finalY = doc.previousAutoTable.finalY;

    // Footer note
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a system-generated document and is not valid without the school\'s official seal.', 14, finalY + 15);
    
    doc.save(`COR_${student.student_id_number}_${student.school_year}.pdf`);
  };

  return (
    <Button
      onClick={generatePDF}
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-auto"
    >
      <Download className="w-4 h-4 mr-2" />
      Download COR
    </Button>
  );
};

export default DownloadCOR;