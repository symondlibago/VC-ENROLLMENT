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
    // 1. SETUP: Long Bond Paper (8.5" x 13")
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [215.9, 330.2] 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = 8; 

    // --- 1. HEADER ---
    const imgWidth = 50; 
    const imgHeight = 10;
    const imgX = (pageWidth - imgWidth) / 2;
    
    // Logo
    try {
        doc.addImage(vineyardLogo, 'PNG', imgX, y, imgWidth, imgHeight);
    } catch (e) {
        console.error("Logo missing", e);
    }
    
    // --- REMOVED PERMIT NUMBER TEXT HERE ---
    // We just simply move 'y' down to clear the logo area.
    // The logo height is 10, so we move down 12 to leave a small gap.
    y += 12; 

    // Top Dashed Line
    doc.setLineDashPattern([2, 1], 0);
    doc.setLineWidth(0.1);
    doc.line(margin, y, pageWidth - margin, y);
    
    // Title
    y += 4;
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('E X A M   P E R M I T', pageWidth / 2, y, { align: 'center' });
    y += 2;
    
    // Bottom Dashed Line
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0); 
    y += 1; 

    // --- 2. COMPACT STUDENT DETAILS GRID ---
    doc.setFontSize(8);
    const rowHeight = 4.5; 
    
    const col1Label = margin; 
    const col1Data = margin + 18; 
    const col2Label = pageWidth / 2 + 5; 
    const col2Data = pageWidth / 2 + 35; 

    // ROW 1
    y += rowHeight;
    doc.setFont('helvetica', 'bold').text('ID:', col1Label, y);
    doc.setFont('helvetica', 'normal').text(student.student_id_number || '', col1Data, y);
    doc.setFont('helvetica', 'bold').text('ACADEMIC YEAR:', col2Label, y);
    doc.setFont('helvetica', 'normal').text(student.school_year || '', col2Data, y);

    // ROW 2
    y += rowHeight;
    doc.setFont('helvetica', 'bold').text('NAME:', col1Label, y);
    const fullName = `${student.last_name}, ${student.first_name} ${student.middle_name?.[0] || ''}.`;
    doc.setFont('helvetica', 'normal').text(fullName.toUpperCase(), col1Data, y);
    doc.setFont('helvetica', 'bold').text('SEMESTER:', col2Label, y);
    doc.setFont('helvetica', 'normal').text(student.semester.toUpperCase() || '', col2Data, y);

    // ROW 3
    y += rowHeight;
    doc.setFont('helvetica', 'bold').text('COURSE:', col1Label, y);
    doc.setFont('helvetica', 'normal').text(student.course?.course_code || '', col1Data, y);
    doc.setFont('helvetica', 'bold').text('PERMIT FOR:', col2Label, y);
    doc.setFont('helvetica', 'bold').text(examType.toUpperCase(), col2Data, y);

    // ROW 4
    y += rowHeight;
    doc.setFont('helvetica', 'bold').text('YEAR:', col1Label, y);
    doc.setFont('helvetica', 'normal').text(student.year.toUpperCase() || '', col1Data, y);
    doc.setFont('helvetica', 'bold').text('DATE ISSUED:', col2Label, y);
    doc.setFont('helvetica', 'normal');
    const dateIssued = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    doc.text(dateIssued, col2Data, y);
    
    // Grid Separator
    y += 2;
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.1); 
    y += 1; 
    doc.line(margin, y, pageWidth - margin, y);

    // --- 3. SUBJECTS TABLE ---
    const subjects = student.subjects || [];
    const minRows = 8;
    const tableBody = subjects.map(sub => [
        sub.subject_code,
        sub.descriptive_title,
        '', 
        '' 
    ]);

    for (let i = tableBody.length; i < minRows; i++) {
        tableBody.push(['', '', '', '']);
    }

    autoTable(doc, {
        startY: y + 1,
        head: [['SUBJECT CODE', 'DESCRIPTION', 'DATE', "INSTRUCTOR'S SIGNATURE"]],
        body: tableBody,
        theme: 'plain',
        styles: {
            fontSize: 7, 
            cellPadding: { top: 0.8, bottom: 0.8, left: 2, right: 2 },
            valign: 'middle',
            lineWidth: 0, 
            minCellHeight: 4
        },
        headStyles: {
            fontStyle: 'bold',
            halign: 'center',
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0, 
            cellPadding: { top: 1, bottom: 1, left: 2, right: 2 },
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 25 }, 
            1: { halign: 'center' }, 
            2: { halign: 'center', cellWidth: 25 }, 
            3: { halign: 'center', cellWidth: 50 }, 
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && (data.column.index === 2 || data.column.index === 3)) {
                 doc.setLineWidth(0.1);
                 const x = data.cell.x;
                 const y = data.cell.y + data.cell.height - 1; 
                 const w = data.cell.width;
                 doc.line(x + 2, y, x + w - 2, y);
            }
        }
    });

    // --- 4. FOOTER ---
    y = doc.lastAutoTable.finalY + 8;

    const cashierName = 'MIKAELLA JANE REMOTO';
    const cashierTitle = 'CASHIER';

    const lineLength = 50; 
    const lineEnd = pageWidth - margin;
    const lineStart = lineEnd - lineLength;
    const lineCenter = lineStart + (lineLength / 2);

    // 1. Draw Name ABOVE the line
    doc.setFontSize(8).setFont('helvetica', 'bold');
    doc.text(cashierName, lineCenter, y - 1, { align: 'center' });

    // 2. Draw Signature Line
    doc.setLineWidth(0.3);
    doc.line(lineStart, y, lineEnd, y); 
    
    // 3. Draw Title BELOW the line
    doc.setFontSize(7).setFont('helvetica', 'normal');
    doc.text(cashierTitle, lineCenter, y + 4, { align: 'center' });

    // --- 5. OUTER BORDER ---
    const totalHeight = y + 8; 
    doc.setDrawColor(0, 0, 139); 
    doc.setLineWidth(0.8);
    doc.rect(5, 5, pageWidth - 10, totalHeight - 5);

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
        {['Preliminary', 'Midterm', 'Semi-Final', 'Final'].map((type) => (
             <DropdownMenuItem 
                key={type}
                className="cursor-pointer hover:bg-gray-100 p-2"
                onClick={() => generatePDF(type)}
            >
              {type}
            </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DownloadExamPermit;