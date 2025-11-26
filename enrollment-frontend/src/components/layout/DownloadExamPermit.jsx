import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { FileText, ChevronDown } from 'lucide-react';
import vineyardLogo from '../../assets/vineyard.png';

const DownloadExamPermit = ({ student }) => {

  const generatePDF = (examType) => {
    const doc = new jsPDF('p', 'mm', 'a4'); // Portrait, millimeters, A4
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    let y = 10;

    // --- 1. HEADER ---
    const imgWidth = 60; 
    const imgHeight = 12;
    const imgX = (pageWidth - imgWidth) / 2;
    
    // Logo
    try {
        doc.addImage(vineyardLogo, 'PNG', imgX, y, imgWidth, imgHeight);
    } catch (e) {
        console.error("Logo missing", e);
    }

    // Permit No (Red Text)
    doc.setFontSize(9).setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black
    doc.text('Permit No.:', margin, y + 8);
    
    doc.setTextColor(180, 0, 0); // Red
    // Generate a pseudo permit number based on year and ID
    const permitNo = `VIPC${new Date().getFullYear().toString().slice(-2)}-${student.student_id_number?.split('-')[1] || '0000'}`;
    doc.text(permitNo, margin + 20, y + 8);
    
    doc.setTextColor(0, 0, 0); // Reset to Black
    y += 15;

    // Dashed Line
    doc.setLineDashPattern([3, 1], 0);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0); // Reset solid
    y += 5;

    // Title
    doc.setFontSize(11).setFont('helvetica', 'bold');
    doc.text('E X A M   P E R M I T', pageWidth / 2, y, { align: 'center' });
    y += 2;
    
    doc.setLineDashPattern([3, 1], 0);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0);
    y += 6;

    // --- 2. STUDENT DETAILS GRID ---
    doc.setFontSize(9).setFont('helvetica', 'bold');
    
    // Left Column X positions
    const col1Label = margin;
    const col1Data = margin + 20;
    
    // Right Column X positions
    const col2Label = pageWidth / 2 + 10;
    const col2Data = pageWidth / 2 + 45;

    const rowHeight = 5;

    // Row 1
    doc.text('ID:', col1Label, y);
    doc.setFont('helvetica', 'normal');
    doc.text(student.student_id_number || '', col1Data, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC YEAR:', col2Label, y);
    doc.setFont('helvetica', 'normal');
    doc.text(student.school_year || '', col2Data, y);
    y += rowHeight;

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('NAME:', col1Label, y);
    doc.setFont('helvetica', 'normal');
    const fullName = `${student.last_name}, ${student.first_name} ${student.middle_name?.[0] || ''}.`;
    doc.text(fullName.toUpperCase(), col1Data, y);

    doc.setFont('helvetica', 'bold');
    doc.text('SEMESTER:', col2Label, y);
    doc.setFont('helvetica', 'normal');
    doc.text(student.semester.toUpperCase() || '', col2Data, y);
    y += rowHeight;

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.text('COURSE:', col1Label, y);
    doc.setFont('helvetica', 'normal');
    doc.text(student.course?.course_code || '', col1Data, y);

    doc.setFont('helvetica', 'bold');
    doc.text('PERMIT FOR:', col2Label, y);
    doc.setFont('helvetica', 'bold'); // Bold for the exam type
    doc.text(examType.toUpperCase(), col2Data, y);
    y += rowHeight;

    // Row 4
    doc.setFont('helvetica', 'bold');
    doc.text('YEAR:', col1Label, y);
    doc.setFont('helvetica', 'normal');
    doc.text(student.year.toUpperCase() || '', col1Data, y);

    doc.setFont('helvetica', 'bold');
    doc.text('DATE ISSUED:', col2Label, y);
    doc.setFont('helvetica', 'normal');
    const dateIssued = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    doc.text(dateIssued, col2Data, y);
    y += 5; // Spacing before table

    // Double Line before table
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.1); // Reset
    y += 1; // tiny gap
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // --- 3. SUBJECTS TABLE ---
    
    // Prepare data
    // Assuming student.subjects is available. If strictly using the image layout,
    // we map subjects to rows.
    const subjects = student.subjects || [];
    
    // Fill empty rows to make it look like the permit in the image (approx 8-10 rows total)
    const minRows = 8;
    const tableBody = subjects.map(sub => [
        sub.subject_code,
        sub.descriptive_title,
        '', // Date column empty
        ''  // Signature column empty
    ]);

    // Add empty rows if needed
    for (let i = tableBody.length; i < minRows; i++) {
        tableBody.push(['', '', '', '']);
    }

    // Add "0" rows as seen in image bottom? Or just empty. 
    // The image has '0' in Code and Desc for empty slots, but empty is cleaner.
    // Let's stick to empty strings for professional look, or '0' if you want exact replica.
    
    autoTable(doc, {
        startY: y,
        head: [['SUBJECT CODE', 'DESCRIPTION', 'DATE', "INSTRUCTOR'S SIGNATURE"]],
        body: tableBody,
        theme: 'plain', // Minimalist styling like the image
        styles: {
            fontSize: 8,
            cellPadding: 3,
            valign: 'middle',
            lineWidth: 0, // No vertical lines by default in 'plain'
        },
        headStyles: {
            fontStyle: 'bold',
            halign: 'center',
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 30 }, // Code
            1: { halign: 'center' }, // Description
            2: { halign: 'center', cellWidth: 30 }, // Date
            3: { halign: 'center', cellWidth: 50 }, // Signature
        },
        didParseCell: (data) => {
            // Add borderlines manually to match the Excel-like grid in the image
            // Horizontal lines
            // data.cell.styles.lineWidth = 0.1;
            // data.cell.styles.lineColor = [200, 200, 200];
        },
        didDrawCell: (data) => {
            // Draw lines for signature in the last column
            if (data.section === 'body' && data.column.index === 3) {
                const x = data.cell.x;
                const y = data.cell.y + data.cell.height - 2;
                const width = data.cell.width;
                // Draw line at bottom of cell for signature
                doc.setLineWidth(0.1);
                doc.line(x + 2, y, x + width - 2, y);
            }
            // Draw line for Date in 3rd column
            if (data.section === 'body' && data.column.index === 2) {
                const x = data.cell.x;
                const y = data.cell.y + data.cell.height - 2;
                const width = data.cell.width;
                doc.line(x + 2, y, x + width - 2, y);
            }
        }
    });

    y = doc.lastAutoTable.finalY + 10;

    // --- 4. FOOTER (Cashier) ---
    const cashierName = 'MIKAELLA JANE REMOTO';
    const cashierTitle = 'CASHIER';

    // Right aligned box
    const footerX = pageWidth - margin - 60;
    
    doc.setLineWidth(0.3);
    doc.line(footerX, y, pageWidth - margin, y); // Signature Line
    
    doc.setFontSize(9).setFont('helvetica', 'bold');
    doc.text(cashierName, footerX + 30, y + 5, { align: 'center' });
    
    doc.setFontSize(8).setFont('helvetica', 'normal');
    doc.text(cashierTitle, footerX + 30, y + 9, { align: 'center' });

    // --- 5. BORDER (Optional, blue border in image) ---
    // The image has a blue thick border. Let's add it for style.
    doc.setDrawColor(0, 0, 139); // Dark Blue
    doc.setLineWidth(0.8);
    doc.rect(5, 5, pageWidth - 10, (y + 15) - 5); // Rect around content

    doc.save(`Exam_Permit_${student.last_name}_${examType}.pdf`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Download Exam Permit
          <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white border shadow-md">
        <DropdownMenuItem 
            className="cursor-pointer hover:bg-gray-100 p-2"
            onClick={() => generatePDF('Preliminary')}
        >
          Preliminary
        </DropdownMenuItem>
        <DropdownMenuItem 
            className="cursor-pointer hover:bg-gray-100 p-2"
            onClick={() => generatePDF('Midterm')}
        >
          Midterm
        </DropdownMenuItem>
        <DropdownMenuItem 
            className="cursor-pointer hover:bg-gray-100 p-2"
            onClick={() => generatePDF('Semi-Final')}
        >
          Semi-Final
        </DropdownMenuItem>
        <DropdownMenuItem 
            className="cursor-pointer hover:bg-gray-100 p-2"
            onClick={() => generatePDF('Final')}
        >
          Final
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DownloadExamPermit;