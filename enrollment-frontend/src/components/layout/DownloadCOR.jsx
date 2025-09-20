import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import vineyardLogo from '../../assets/vineyard.png'; // Main logo
import circleLogo from '../../assets/circlelogo.jpg'; // The new circular logo for the second section

const DownloadCOR = ({ student, subjectsWithSchedules, paymentData }) => {

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header for the first section (Registrar's Copy)
    const drawBrandingAndTitle = (startY) => {
      const imgWidth = 80; const imgHeight = 15;
      const imgX = (pageWidth - imgWidth) / 2;
      doc.addImage(vineyardLogo, 'PNG', imgX, startY, imgWidth, imgHeight);

      let y = startY + imgHeight + 5;
      doc.setFontSize(8).setFont('helvetica', 'normal');
      doc.text('Prince Pad Bldg., Antonio Luna St., Mabulay Subd.,', pageWidth / 2, y, { align: 'center' });
      y += 3;
      doc.text('Cagayan de Oro City', pageWidth / 2, y, { align: 'center' });
      y += 4;

      doc.setFontSize(9).setFont('helvetica', 'bold');
      doc.text('ENROLLMENT FORM', pageWidth / 2, y, { align: 'center' });
      y += 3;
      
      doc.setFontSize(9).setFont('helvetica', 'normal');
      doc.text(`A.Y. ${student.school_year || 'N/A'} - ${student.semester || 'N/A'}`, pageWidth / 2, y, { align: 'center' });
      return y;
    };
    
    // Draws student details, used in both sections
    const drawStudentDetails = (startY) => {
      let y = startY + 7;
      doc.setFontSize(8);
      doc.text('Student No.:', margin, y);
      doc.text(student.student_id_number || 'N/A', margin + 30, y);
      y += 4;
      doc.text('Student Name:', margin, y);
      doc.text(`${student.last_name}, ${student.first_name} ${student.middle_name || ''}`, margin + 30, y);
      y += 4;
      doc.text('Course & Year:', margin, y);
      const courseText = `[${student.course?.course_code || 'N/A'}] ${student.course?.course_name || 'N/A'} - ${student.year || 'N/A'} (${student.enrollment_type || ''})`;
      doc.text(courseText, margin + 30, y);
      return y;
    };

    // Header for the second section (Student's Copy)
    const drawSecondSectionHeader = (startY) => {
        const logoSize = 15;
        doc.addImage(circleLogo, 'JPG', margin, startY, logoSize, logoSize);

        const textX = margin + logoSize + 4;
        let textY = startY + 3;

        doc.setFontSize(11).setFont('helvetica', 'bold');
        doc.text('VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE, INC.', textX, textY);
        textY += 4;

        doc.setFontSize(8).setFont('helvetica', 'normal');
        doc.text('Prince Pad Bldg., Antonio Luna St., Mabulay Subd., Cagayan de Oro City', textX, textY);
        textY += 4;
        doc.text('(088) 856 8646 / +639639477295', textX, textY);

        let finalY = startY + logoSize + 4;
        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text('CERTIFICATE OF REGISTRATION', pageWidth / 2, finalY, { align: 'center' });
        return finalY;
    };

    // --- Section 1: Registrar's Copy ---
    let yPos1 = drawBrandingAndTitle(10);
    yPos1 = drawStudentDetails(yPos1);

    let totalLecHrs = 0, totalLabHrs = 0, totalUnits = 0;
    const subjectsTableRows = [];
    subjectsWithSchedules.forEach(subject => {
      subjectsTableRows.push([ subject.subject_code, subject.descriptive_title, subject.lec_hrs, subject.lab_hrs, subject.total_units, subject.schedules?.map(s => s.day || 'TBA').join('\n') || 'TBA', subject.schedules?.map(s => s.time || 'TBA').join('\n') || 'TBA', subject.schedules?.map(s => s.room_no || 'TBA').join('\n') || 'TBA' ]);
      totalLecHrs += subject.lec_hrs || 0;
      totalLabHrs += subject.lab_hrs || 0;
      totalUnits += subject.total_units || 0;
    });
    subjectsTableRows.push(['', 'TOTAL', totalLecHrs, totalLabHrs, totalUnits, '', '', '']);

    autoTable(doc, {
      head: [["Code", "Descriptive Title", "Lec", "Lab", "Units", "Day", "Time", "Room"]], body: subjectsTableRows, startY: yPos1 + 5,
      margin: { left: margin, right: margin }, theme: 'grid', headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 100, fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.1, lineColor: 100, valign: 'middle' }, columnStyles: { 1: { cellWidth: 50 } },
      didParseCell: (data) => { if (data.row.index === subjectsTableRows.length - 1) data.cell.styles.fontStyle = 'bold'; },
    });
    
    // --- MODIFICATION START: Replaced "REGISTRAR'S COPY" with approval lines ---
    const finalY1 = doc.lastAutoTable.finalY;
    const approvalY = finalY1 + 15;
    
    doc.setFontSize(8).setFont('helvetica', 'normal');

    const drawApproval = (text, x) => {
      doc.text(text, x, approvalY);
      const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      doc.line(x, approvalY + 1, x + textWidth, approvalY + 1);
    };

    const approvalText2 = 'Approved by: Registrar';
    const textWidth2 = doc.getStringUnitWidth(approvalText2) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    
    drawApproval('Approved by: Program Head', margin);
    drawApproval(approvalText2, (pageWidth / 2) - (textWidth2 / 2));
    drawApproval('Approved by: Cashier', pageWidth - margin - 40); // Right aligned with a fixed width for the signature
    
    const separatorY = approvalY + 5;
    doc.setLineDashPattern([2, 1], 0).line(margin, separatorY, pageWidth - margin, separatorY).setLineDashPattern([], 0);

    // --- Section 2: Student's Copy ---
    let yPos2 = drawSecondSectionHeader(separatorY + 2);
    yPos2 = drawStudentDetails(yPos2);

    const fullSubjectsBody = [...subjectsTableRows]; 
    const formatCurrency = (val) => `${parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const paymentBody = [
        ['Previous Account', formatCurrency(paymentData.previous_account)], ['Registration Fee', formatCurrency(paymentData.registration_fee)], ['Tuition Fee', formatCurrency(paymentData.tuition_fee)],
        ['Laboratory Fee', formatCurrency(paymentData.laboratory_fee)], ['Miscellaneous Fee', formatCurrency(paymentData.miscellaneous_fee)], ['Other Fees', formatCurrency(paymentData.other_fees)],
        ['Bundled Program Fee', formatCurrency(paymentData.bundled_program_fee)], ['TOTAL', formatCurrency(paymentData.total_amount)], ['Payment', formatCurrency(paymentData.payment_amount)],
        ['Discount', formatCurrency(paymentData.discount)], ['REMAINING AMOUNT', formatCurrency(paymentData.remaining_amount)], ['TERM PAYMENT', formatCurrency(paymentData.term_payment)],
    ];
    
    autoTable(doc, {
        head: [["Course Code", "Course Description", "Lec", "Lab", "Total Units", "Time", "Day", "Room No."]], body: fullSubjectsBody, startY: yPos2 + 5,
        margin: { left: margin, right: pageWidth * 0.32 }, theme: 'grid', headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 100, fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.1, lineColor: 100, valign: 'middle' }, columnStyles: { 1: { cellWidth: 35 } },
        didParseCell: (data) => { if (data.row.index === fullSubjectsBody.length - 1) data.cell.styles.fontStyle = 'bold'; }
    });
    autoTable(doc, {
        head: [["ACCOUNT", "AMOUNT"]], body: paymentBody, startY: yPos2 + 5,
        margin: { left: pageWidth * 0.68 + 2, right: margin }, theme: 'grid', headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 100, fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.1, lineColor: 100 }, columnStyles: { 1: { halign: 'right' } },
        didParseCell: (data) => {
            const boldRows = ['TOTAL', 'REMAINING AMOUNT', 'TERM PAYMENT'];
            if (boldRows.includes(data.row.raw[0])) data.cell.styles.fontStyle = 'bold';
        }
    });

    let finalY2 = doc.lastAutoTable.finalY;

    // Check if there is enough space for the footer, if not, add a new page.
    if (finalY2 > 250) {
        doc.addPage();
        finalY2 = 10; // Reset Y position for the new page
    }
    
    doc.setFontSize(9).setFont('helvetica', 'normal').text('This is to certify that the information indicated above are true and correct.', margin, finalY2 + 8);
    doc.line(margin, finalY2 + 20, margin + 70, finalY2 + 20);
    doc.text('Student\'s Signature over Printed Name', margin, finalY2 + 24);

    const releaseName = 'MIKAELLA JANE REMOTO'; const releaseTitle = 'Finance Officer';
    const releaseNameWidth = doc.getStringUnitWidth(releaseName) * 9 / doc.internal.scaleFactor;
    const releaseX = pageWidth - margin - releaseNameWidth;
    const signatureLineY = finalY2 + 20;
    
    doc.text('RELEASED BY:', releaseX, finalY2 + 15);
    doc.line(releaseX, signatureLineY, pageWidth - margin, signatureLineY);
    doc.setFont('helvetica', 'bold').text(releaseName, releaseX, signatureLineY);
    doc.setFont('helvetica', 'normal').text(releaseTitle, releaseX, signatureLineY + 4);
    
    doc.save(`COR_${student.student_id_number}_${student.school_year}.pdf`);
  };

  return (
    <Button onClick={generatePDF} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-auto">
      <Download className="w-4 h-4 mr-2" />
      Download COR
    </Button>
  );
};

export default DownloadCOR;