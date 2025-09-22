import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import vineyardLogo from '../../assets/vineyard.png';
import circleLogo from '../../assets/circlelogo.jpg';

const DownloadCOR = ({ student, subjectsWithSchedules, paymentData }) => {

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

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

    // --- UPDATED drawStudentPersonalDetails function ---
    const drawStudentPersonalDetails = () => {
      doc.addPage();
      const startY = 15;
      let y = startY;
      const smallMargin = 10;
      const contentWidth = pageWidth - 2 * smallMargin;

      // Title
      doc.setFontSize(10).setFont('helvetica', 'bold').text('STUDENT PERSONAL DATA', pageWidth / 2, y, { align: 'center' });
      y += 8;

      // Basic Info Fields
      const fieldSpacing = 5;
      const labelFontSize = 8;
      const valueFontSize = 9;

      // Name
      const nameLineY = y + 1;
      doc.setFontSize(labelFontSize).text('Name:', smallMargin, y);
      doc.setFontSize(valueFontSize).text(student.last_name || 'N/A', smallMargin + 18, y);
      doc.setFontSize(valueFontSize).text(student.first_name || 'N/A', smallMargin + 65, y);
      doc.setFontSize(valueFontSize).text(student.middle_name || 'N/A', smallMargin + 112, y);
      doc.setFontSize(6).text('(Last Name)', smallMargin + 18, y + 4);
      doc.setFontSize(6).text('(First Name)', smallMargin + 65, y + 4);
      doc.setFontSize(6).text('(Middle Name)', smallMargin + 112, y + 4);
      doc.line(smallMargin + 18, nameLineY, smallMargin + 60, nameLineY);
      doc.line(smallMargin + 65, nameLineY, smallMargin + 107, nameLineY);
      doc.line(smallMargin + 112, nameLineY, smallMargin + 154, nameLineY);
      y += fieldSpacing * 2;

      // Birth Date and Place
      doc.setFontSize(labelFontSize).text('Birth Date:', smallMargin, y);
      doc.setFontSize(valueFontSize).text(new Date(student.birth_date).toLocaleDateString() || 'N/A', smallMargin + 25, y);
      doc.setFontSize(labelFontSize).text('Birth Place:', pageWidth / 2, y);
      doc.setFontSize(valueFontSize).text(student.birth_place || 'N/A', pageWidth / 2 + 25, y);
      doc.line(smallMargin + 25, y + 1, smallMargin + 60, y + 1);
      doc.line(pageWidth / 2 + 25, y + 1, pageWidth - smallMargin, y + 1);
      y += fieldSpacing;

      // Nationality, Civil Status, Religion
      doc.setFontSize(labelFontSize).text('Nationality:', smallMargin, y);
      doc.setFontSize(valueFontSize).text(student.nationality || 'N/A', smallMargin + 25, y);
      doc.setFontSize(labelFontSize).text('Civil Status:', smallMargin + 60, y);
      doc.setFontSize(valueFontSize).text(student.civil_status || 'N/A', smallMargin + 85, y);
      doc.setFontSize(labelFontSize).text('Religion:', smallMargin + 120, y);
      doc.setFontSize(valueFontSize).text(student.religion || 'N/A', smallMargin + 140, y);
      doc.line(smallMargin + 25, y + 1, smallMargin + 55, y + 1);
      doc.line(smallMargin + 85, y + 1, smallMargin + 115, y + 1);
      doc.line(smallMargin + 140, y + 1, smallMargin + 170, y + 1);
      y += fieldSpacing;

      // Address
      doc.setFontSize(labelFontSize).text('Address:', smallMargin, y);
      doc.setFontSize(valueFontSize).text(student.address || 'N/A', smallMargin + 25, y);
      doc.line(smallMargin + 25, y + 1, pageWidth - smallMargin, y + 1);
      y += fieldSpacing;

      // Contact Number & Email
      doc.setFontSize(labelFontSize).text('Contact No.:', smallMargin, y);
      doc.setFontSize(valueFontSize).text(student.contact_number || 'N/A', smallMargin + 28, y);
      doc.setFontSize(labelFontSize).text('Email Address:', pageWidth / 2, y);
      doc.setFontSize(valueFontSize).text(student.email_address || 'N/A', pageWidth / 2 + 28, y);
      doc.line(smallMargin + 28, y + 1, smallMargin + 70, y + 1);
      doc.line(pageWidth / 2 + 28, y + 1, pageWidth - smallMargin, y + 1);
      y += fieldSpacing * 2;

      // Parents Information Header
      doc.setFontSize(10).setFont('helvetica', 'bold').text('PARENT\'S INFORMATION', smallMargin, y);
      y += 3;
      doc.line(smallMargin, y, pageWidth - smallMargin, y);
      y += 5;

      // Father's Details
      doc.setFontSize(labelFontSize).setFont('helvetica', 'normal');
      doc.text('Father\'s Name:', smallMargin, y);
      doc.setFontSize(valueFontSize).text(student.father_name || 'N/A', smallMargin + 30, y);
      doc.setFontSize(labelFontSize).text('Occupation:', smallMargin + 80, y);
      doc.setFontSize(valueFontSize).text(student.father_occupation || 'N/A', smallMargin + 100, y);
      doc.setFontSize(labelFontSize).text('Contact No.:', smallMargin + 140, y);
      doc.setFontSize(valueFontSize).text(student.father_contact_number || 'N/A', smallMargin + 162, y);
      doc.line(smallMargin + 30, y + 1, smallMargin + 70, y + 1);
      doc.line(smallMargin + 100, y + 1, smallMargin + 135, y + 1);
      doc.line(smallMargin + 162, y + 1, pageWidth - smallMargin, y + 1);
      y += fieldSpacing;

      // Mother's Details
      doc.setFontSize(labelFontSize).text('Mother\'s Name:', smallMargin, y);
      doc.setFontSize(valueFontSize).text(student.mother_name || 'N/A', smallMargin + 30, y);
      doc.setFontSize(labelFontSize).text('Occupation:', smallMargin + 80, y);
      doc.setFontSize(valueFontSize).text(student.mother_occupation || 'N/A', smallMargin + 100, y);
      doc.setFontSize(labelFontSize).text('Contact No.:', smallMargin + 140, y);
      doc.setFontSize(valueFontSize).text(student.mother_contact_number || 'N/A', smallMargin + 162, y);
      doc.line(smallMargin + 30, y + 1, smallMargin + 70, y + 1);
      doc.line(smallMargin + 100, y + 1, smallMargin + 135, y + 1);
      doc.line(smallMargin + 162, y + 1, pageWidth - smallMargin, y + 1);
      y += fieldSpacing * 2;

      // School Attended Header
      doc.setFontSize(10).setFont('helvetica', 'bold').text('SCHOOL ATTENDED', smallMargin, y);
      y += 3;
      doc.line(smallMargin, y, pageWidth - smallMargin, y);
      y += 5;

      // Educational Background Table
      const schools = [
          { label: 'Elementary', name: student.elementary, date: student.elementary_date_completed },
          { label: 'Junior High School', name: student.junior_high_school, date: student.junior_high_date_completed },
          { label: 'Senior High School (SHS)', name: student.senior_high_school, date: student.senior_high_date_completed },
          { label: 'High School (Non-K12)', name: student.high_school_non_k12, date: student.high_school_non_k12_date_completed },
          { label: 'College', name: student.college, date: student.college_date_completed },
      ].filter(s => s.name);

      const tableData = schools.map(s => [s.label, s.name, s.date]);

      autoTable(doc, {
          startY: y,
          head: [['Level', 'School Name', 'Date Completed']],
          body: tableData,
          margin: { left: smallMargin, right: smallMargin },
          theme: 'striped',
          headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 8, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 },
          didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                doc.setFontSize(10).setFont('helvetica', 'bold').text('SCHOOL ATTENDED', smallMargin, 10);
                doc.line(smallMargin, 13, pageWidth - smallMargin, 13);
            }
          }
      });
      y = doc.lastAutoTable.finalY + 10;
      
      // Final Certification Line
      doc.setFontSize(7).setFont('helvetica', 'normal');
      doc.text('I hereby certify to the truth of the foregoing information and with my enrollment, I hereby bind myself to abide by', smallMargin, y);
      y += 3;
      doc.text('and comply with the rules and policies of Vineyard International Polytechnic College.', smallMargin, y);
      y += 10;

      // Student's Signature
      doc.line(smallMargin, y, smallMargin + 50, y);
      doc.setFontSize(7).text('Student\'s Signature over Printed Name', smallMargin, y + 3);
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
    drawApproval('Approved by: Cashier', pageWidth - margin - 40);
    
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

    if (finalY2 > 250) {
        doc.addPage();
        finalY2 = 10;
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

    // Call the updated function to draw the second page
    drawStudentPersonalDetails();

    doc.save(`COR_${student.last_name}_${student.school_year}.pdf`);
  };

  return (
    <Button onClick={generatePDF} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-auto">
      <Download className="w-4 h-4 mr-2" />
      Download COR
    </Button>
  );
};

export default DownloadCOR;