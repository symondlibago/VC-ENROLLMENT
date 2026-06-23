import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

const DownloadGradingSheet = ({ subject, students, instructorName }) => {

  const generatePDF = () => {
    if (!subject || students.length === 0) return;

    const doc = new jsPDF('p', 'mm', 'legal'); 
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;

    const studentsBySection = students.reduce((acc, student) => {
      const sec = student.section || 'Unassigned';
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(student);
      return acc;
    }, {});

    const sectionKeys = Object.keys(studentsBySection).sort();

    sectionKeys.forEach((sectionName, index) => {
      if (index > 0) doc.addPage(); 

      const sectionStudents = studentsBySection[sectionName];
      
      // --- LOGO SECTION (Fixed Squeezing) ---
      const logoWidth = 140; 
      const logoHeight = 30; // Increased height so it's not squashed
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = 6; // Start slightly higher

      try {
        doc.addImage('/vipc.png', 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (e) {
        console.warn("Logo not found");
      }

      // Reduced gap between logo and "GRADING SHEET"
      const headerTextY = logoY + logoHeight + 7; 

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('GRADING SHEET', pageWidth / 2, headerTextY, { align: 'center' });

      const startY = headerTextY + 4;
      doc.setFontSize(9);
      const leftX = margin + 5;
      const rightX = pageWidth / 2 + 10;
      const lineHeight = 4.5; // Slightly tighter line height

      const drawField = (label, value, x, y) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.text(label, x, y);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value || ''), x + doc.getTextWidth(label) + 2, y);
      };

      // --- Left Column ---
      const maxNameWidth = (pageWidth / 2) - margin - 30;
      
      drawField('Course Code:', subject.subject_code, leftX, startY);
      
      const courseLabel = 'Course Name:';
      doc.setFont('helvetica', 'normal');
      doc.text(courseLabel, leftX, startY + lineHeight);
      doc.setFont('helvetica', 'bold');
      const courseTitle = subject.descriptive_title || '';
      const wrappedTitle = doc.splitTextToSize(courseTitle, maxNameWidth);
      doc.text(wrappedTitle, leftX + doc.getTextWidth(courseLabel) + 2, startY + lineHeight);
      
      const verticalOffset = (wrappedTitle.length - 1) * lineHeight;

      drawField('Class Schedule:', subject.schedule_info || 'TBA', leftX, startY + (lineHeight * 2) + verticalOffset);

      // --- Consolidated Row ---
      const unitRowY = startY + (lineHeight * 3) + verticalOffset;
      const spacing = 32; 

      const drawInlineField = (label, val, x) => {
        doc.setFont('helvetica', 'normal');
        doc.text(label, x, unitRowY);
        doc.setFont('helvetica', 'bold');
        doc.text(String(val || '0'), x + doc.getTextWidth(label) + 1.5, unitRowY);
      };

      drawInlineField('Lec:', subject.lec_hrs, leftX);
      drawInlineField('Lab:', subject.lab_hrs, leftX + (spacing * 0.5));
      drawInlineField('No. of Hours:', subject.number_of_hours, leftX + spacing + 2);
      drawInlineField('Total Units:', subject.total_units, leftX + (spacing * 2) + 10);
      
      // --- Right Column ---
      const sampleStudent = sectionStudents[0];
      const courseYear = `${sampleStudent.courseCode || ''} - ${sampleStudent.year || ''}`;
      
      drawField('Course & Year:', courseYear, rightX, startY);
      drawField('Sem. & A.Y.:', `${subject.semester || ''}, ${subject.school_year || ''}`, rightX, startY + lineHeight);
      drawField('Section:', sectionName, rightX, startY + (lineHeight * 2));

      // --- GRADES TABLE (Text Size Reduced to 7) ---
      const isDHT = sampleStudent?.courseName?.includes('Diploma') || subject.subject_code?.includes('DHT');
      const isSHS = sampleStudent?.year?.includes('Grade');
      const showPercent = !isDHT && !isSHS;

      const tableHeaders = [
        'Student Name',
        showPercent ? 'Prelim (20%)' : 'Prelim',
        showPercent ? 'Midterm (20%)' : 'Midterm',
        showPercent ? 'Semi (20%)' : 'Semi',
        showPercent ? 'Final (40%)' : 'Final',
        'Final Grade',
        'Equivalent',
        'Remarks'
      ];

      const getEquiv = (val) => {
        if (val === null || val === undefined) return '';
        const grade = Math.round(val);
        if (grade >= 100) return '1.0';
        if (grade === 99) return '1.1';
        if (grade === 98) return '1.2';
        if (grade === 97) return '1.25';
        if (grade === 96) return '1.3';
        if (grade === 95) return '1.4';
        if (grade === 94) return '1.5';
        if (grade === 93) return '1.6';
        if (grade === 92) return '1.7';
        if (grade === 91) return '1.75';
        if (grade === 90) return '1.8';
        if (grade === 89) return '1.9';
        if (grade === 88) return '2.0';
        if (grade === 87) return '2.1';
        if (grade === 86) return '2.2';
        if (grade === 85) return '2.25';
        if (grade === 84) return '2.3';
        if (grade === 83) return '2.4';
        if (grade === 82) return '2.5';
        if (grade === 81) return '2.6';
        if (grade === 80) return '2.7';
        if (grade === 79) return '2.75';
        if (grade === 78) return '2.8';
        if (grade === 77) return '2.9';
        if (grade === 76 || grade === 75) return '3.0';
        if (grade === 74) return '3.1';
        if (grade === 73) return '3.2';
        if (grade === 72) return '3.25';
        if (grade === 71) return '3.3';
        if (grade === 70) return '3.4';
        return '5.0'; 
      };

      const calculateFinal = (s) => {
        const { prelim_grade: p, midterm_grade: m, semifinal_grade: sm, final_grade: f } = s.grades || {};
        if ([p, m, sm, f].some(v => v == null || v === '')) return null;
        if (showPercent) return (p * 0.25) + (m * 0.25) + (sm * 0.25) + (f * 0.25);
        return (p + m + sm + f) / 4;
      };

      const getGradeColor = (value) => {
        if (value === null || value === undefined || value === '') return [0, 0, 0];
        const num = parseFloat(value);
        if (isNaN(num)) return [0, 0, 0];
        return Math.round(num) < 75 ? [220, 38, 38] : [0, 0, 0];
      };

      const gradeValues = [];

      const tableBody = sectionStudents.map(s => {
        const final = calculateFinal(s);
        const equiv = final ? getEquiv(final) : '';
        let remarks = s.grades?.status || '';
        if (final !== null) remarks = Math.round(final) >= 75 ? 'PASSED' : 'FAILED';
        const fmt = (v) => (v != null && v !== '' ? parseFloat(v).toFixed(2) : '');

        gradeValues.push({
          prelim: s.grades?.prelim_grade, midterm: s.grades?.midterm_grade,
          semi: s.grades?.semifinal_grade, final: s.grades?.final_grade,
          finalGrade: final, remarks,
        });

        return [
          s.name.toUpperCase(),
          fmt(s.grades?.prelim_grade),
          fmt(s.grades?.midterm_grade),
          fmt(s.grades?.semifinal_grade),
          fmt(s.grades?.final_grade),
          final ? final.toFixed(2) : '',
          equiv,
          remarks
        ];
      });

      autoTable(doc, {
        startY: unitRowY + 6, // Pulled up closer
        head: [tableHeaders],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: 0,
          lineWidth: 0.1,
          lineColor: 0,
          fontSize: 7.5, // Header slightly larger than body
          halign: 'center'
        },
        styles: {
          fontSize: 7, // Reduced font size for names and grades
          lineColor: 0,
          lineWidth: 0.1,
          cellPadding: 1.2,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold' },
          6: { halign: 'center', fontStyle: 'bold' },
          7: { halign: 'center', fontSize: 6.5 }
        },
        didParseCell: (data) => {
          if (data.section !== 'body') return;
          const rowIndex = data.row.index;
          const colIndex = data.column.index;
          const gv = gradeValues[rowIndex];
          if (!gv) return;

          if (colIndex === 1) data.cell.styles.textColor = getGradeColor(gv.prelim);
          else if (colIndex === 2) data.cell.styles.textColor = getGradeColor(gv.midterm);
          else if (colIndex === 3) data.cell.styles.textColor = getGradeColor(gv.semi);
          else if (colIndex === 4) data.cell.styles.textColor = getGradeColor(gv.final);
          else if (colIndex === 5) data.cell.styles.textColor = getGradeColor(gv.finalGrade);
          else if (colIndex === 6) data.cell.styles.textColor = getGradeColor(gv.finalGrade);
          else if (colIndex === 7) data.cell.styles.textColor = gv.remarks === 'FAILED' ? [220, 38, 38] : [0, 0, 0];
        },
      });

      // --- FOOTER & SIGNATURES ---
      const pageHeight = doc.internal.pageSize.getHeight();
      let finalY = doc.lastAutoTable.finalY + 5;
      
      if (finalY > pageHeight - 60) {
        doc.addPage();
        finalY = margin + 10;
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('GRADING SYSTEM:', margin, finalY);
       
      const rawLegendData = [
        { g: '1.0', r: '99-100' }, { g: '1.1', r: '99' }, { g: '1.2', r: '98' }, { g: '1.25', r: '97' },
        { g: '1.3', r: '96' }, { g: '1.4', r: '95' }, { g: '1.5', r: '94' }, { g: '1.6', r: '93' },
        { g: '1.7', r: '92' }, { g: '1.75', r: '91' }, { g: '1.8', r: '90' }, { g: '1.9', r: '89' },
        { g: '2.0', r: '88' }, { g: '2.1', r: '87' }, { g: '2.2', r: '86' }, { g: '2.25', r: '85' },
        { g: '2.3', r: '84' }, { g: '2.4', r: '83' }, { g: '2.5', r: '82' }, { g: '2.6', r: '81' },
        { g: '2.7', r: '80' }, { g: '2.75', r: '79' }, { g: '2.8', r: '78' }, { g: '2.9', r: '77' },
        { g: '3.0', r: '76-75' }, { g: '3.1', r: '74' }, { g: '3.2', r: '73' }, { g: '3.25', r: '72' },
        { g: '3.3', r: '71' }, { g: '3.4', r: '70' }, { g: '5.0', r: 'Below 75' },
        { g: 'NFE', r: 'NO FINAL EXAM' }, { g: 'NFR', r: 'NO FINAL REQUIREMENT' },
        { g: 'INC', r: 'INCOMPLETE' }, { g: 'DA', r: 'DROP DUE TO ABSENCES' },
      ];

      const rowsPerCol = 7;
      const numColumns = Math.ceil(rawLegendData.length / rowsPerCol); 
      const dynamicHeaderRow = [];
      const dynamicColStyles = {};
       
      for (let c = 0; c < numColumns; c++) {
        dynamicHeaderRow.push('Grade', 'Equivalent');
        dynamicColStyles[c * 2] = { fontStyle: 'bold', cellWidth: 8 }; 
        dynamicColStyles[(c * 2) + 1] = { cellWidth: 28 }; 
      }

      const legendTableBody = [];
      for (let r = 0; r < rowsPerCol; r++) {
        const rowData = [];
        for (let c = 0; c < numColumns; c++) {
          const dataIndex = (c * rowsPerCol) + r;
          if (rawLegendData[dataIndex]) {
            rowData.push(rawLegendData[dataIndex].g, rawLegendData[dataIndex].r);
          } else {
            rowData.push('', '');
          }
        }
        legendTableBody.push(rowData);
      }

      autoTable(doc, {
        startY: finalY + 2,
        head: [dynamicHeaderRow],
        body: legendTableBody,
        theme: 'plain',
        margin: { left: margin },
        tableWidth: 'wrap', 
        styles: { fontSize: 6, cellPadding: 0.5 },
        headStyles: { fontStyle: 'bold', fontSize: 6 },
        columnStyles: dynamicColStyles
      });

      const sigY = doc.lastAutoTable.finalY + 10;
      const drawSigBlock = (label, name, title, xPos) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(label, xPos, sigY);
        // Add spacing (2 blank lines) between label and name
        const nameY = sigY + 12;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(name, xPos, nameY);
        const lineWidth = Math.max(doc.getTextWidth(name) + 2, 40);
        doc.line(xPos, nameY + 1, xPos + lineWidth, nameY + 1);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(title, xPos, nameY + 4);
      };

      const iName = instructorName ? instructorName.toUpperCase() : 'INSTRUCTOR';
      drawSigBlock('Prepared by:', iName, "Instructor's signature", margin);
      drawSigBlock('Approved by:', 'LOYDA B. DACANAY, LPT, MBA', 'Program Head', (pageWidth / 2) - 20);
      drawSigBlock('Certified True & Correct:', 'ARCHIE MAY L. MANANGKILA', 'Registrar', pageWidth - margin - 50);
    });

    doc.save(`Grading_Sheet_${subject.subject_code}.pdf`);
  };

  return (
    <Button 
      onClick={generatePDF} 
      variant="outline" 
      className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-700 cursor-pointer"
      disabled={!students || students.length === 0}
    >
      <FileDown className="w-4 h-4" />
      Export Grading Sheet
    </Button>
  );
};

export default DownloadGradingSheet;