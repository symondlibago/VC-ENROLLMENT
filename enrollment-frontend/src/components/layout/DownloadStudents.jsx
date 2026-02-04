import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from 'file-saver';
import api from '@/services/api'; 

const DownloadStudents = ({ className, variant }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await api.get('/export-bachelor-students'); 
      
      const students = (response.data.data || []).sort((a, b) => 
        a.last_name.localeCompare(b.last_name)
      );

      if (!students || students.length === 0) {
        alert("No students found to export.");
        setIsExporting(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Bachelor Students');

      // ==========================================
      // 1. ADD STATIC HEADER INFORMATION
      // ==========================================
      
      worksheet.mergeCells('H1:K1'); 
      const titleRow1 = worksheet.getCell('H1');
      titleRow1.value = 'ENROLLMENT LIST';
      titleRow1.font = { name: 'Calibri', size: 11, bold: true };
      titleRow1.alignment = { horizontal: 'center' };

      worksheet.mergeCells('H2:K2');
      const titleRow2 = worksheet.getCell('H2');
      titleRow2.value = 'SY 2025-2026'; 
      titleRow2.font = { name: 'Calibri', size: 11, bold: true };
      titleRow2.alignment = { horizontal: 'center' };

      worksheet.mergeCells('H3:K3');
      const titleRow3 = worksheet.getCell('H3');
      titleRow3.value = 'SECOND SEMESTER'; 
      titleRow3.font = { name: 'Calibri', size: 11, bold: true };
      titleRow3.alignment = { horizontal: 'center' };

      // School Info
      worksheet.getCell('A5').value = 'SCHOOL INSTITUTIONAL CODE: 10123';
      worksheet.getCell('A5').font = { name: 'Calibri', size: 10, bold: true };

      worksheet.getCell('A6').value = 'SCHOOL NAME: VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE';
      worksheet.getCell('A6').font = { name: 'Calibri', size: 10, bold: true };

      worksheet.getCell('A7').value = 'ADRESS: PRINCE PADI. BLDG., ANTONIO LUNA ST., CAGAYAN DE ORO CITY';
      worksheet.getCell('A7').font = { name: 'Calibri', size: 10, bold: true };

      // Info on the Right
      worksheet.getCell('M5').value = 'TOTAL NO. OF STUDENTS:';
      worksheet.getCell('M5').font = { name: 'Calibri', size: 10, bold: true };
      worksheet.getCell('N5').value = students.length; 

      worksheet.getCell('M7').value = 'PREPARED BY:';
      worksheet.getCell('M7').font = { name: 'Calibri', size: 10, bold: true };

      worksheet.getCell('M9').value = 'APPROVED BY:';
      worksheet.getCell('M9').font = { name: 'Calibri', size: 10, bold: true };


      // ==========================================
      // 2. DEFINE TABLE COLUMNS
      // ==========================================
      
      const tableStartRow = 12;
      const headerRow = worksheet.getRow(tableStartRow);
      
      headerRow.values = [
        'PROGRAM NAME',    // 1
        'PROGRAM MAJOR',   // 2
        'CURRICULUM',      // 3
        'STUDENT NO.',     // 4
        'YEAR LEVEL',      // 5
        'LAST NAME',       // 6
        'FIRST NAME',      // 7
        'MIDDLE NAME',     // 8
        'EXT. NAME',       // 9
        'SEX',             // 10
        'NATIONALITY',     // 11
        'COURSE CODE',     // 12
        'COURSE DESCRIPTION', // 13
        'NO. OF UNITS',    // 14
        'GRADES',          // 15
        'REMARKS'          // 16
      ];

      worksheet.columns = [
        { key: 'program_name', width: 30 },
        { key: 'program_major', width: 25 },
        { key: 'curriculum', width: 25 },
        { key: 'student_no', width: 15 },
        { key: 'year_level', width: 10 },
        { key: 'last_name', width: 15 },
        { key: 'first_name', width: 20 },
        { key: 'middle_name', width: 15 },
        { key: 'ext_name', width: 10 },
        { key: 'gender', width: 11 },
        { key: 'nationality', width: 15 },
        { key: 'subject_code', width: 18 },
        { key: 'descriptive_title', width: 45 },
        { key: 'total_units', width: 12 },
        { key: 'grades', width: 10 },
        { key: 'remarks', width: 15 },
      ];

      // Header Styling
      headerRow.height = 30; 
      headerRow.font = { name: 'Calibri', bold: true, size: 9 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // ==========================================
      // 3. POPULATE DATA ROWS
      // ==========================================
      
      students.forEach(student => {
        const progName = (student.program_name || '').toUpperCase();
        const progMajor = (student.program_major || '').toUpperCase();
        const curriculum = `VIPC-${student.course_code || 'XXX'}-2018-2019`.toUpperCase();
        const studentNo = (student.student_id_number || '').toUpperCase();
        
        let yearLevel = (student.year_level || '').toUpperCase();
        if (yearLevel.includes('1ST')) yearLevel = '1';
        if (yearLevel.includes('2ND')) yearLevel = '2';
        if (yearLevel.includes('3RD')) yearLevel = '3';
        if (yearLevel.includes('4TH')) yearLevel = '4';

        const lastName = (student.last_name || '').toUpperCase();
        const firstName = (student.first_name || '').toUpperCase();
        const middleName = (student.middle_name || '').toUpperCase();
        const gender = (student.gender || '').toUpperCase();
        const nationality = (student.nationality || '').toUpperCase();

        if (student.subjects && student.subjects.length > 0) {
          student.subjects.forEach((subject, index) => {
            const isFirstItem = index === 0;

            const row = worksheet.addRow({
              program_name: isFirstItem ? progName : '',
              program_major: isFirstItem ? progMajor : '',
              curriculum: isFirstItem ? curriculum : '',
              student_no: isFirstItem ? studentNo : '',
              year_level: isFirstItem ? yearLevel : '',
              last_name: isFirstItem ? lastName : '',
              first_name: isFirstItem ? firstName : '',
              middle_name: isFirstItem ? middleName : '',
              ext_name: '', 
              gender: isFirstItem ? gender : '',
              nationality: isFirstItem ? nationality : '',
              
              subject_code: subject.subject_code,
              descriptive_title: subject.descriptive_title,
              total_units: subject.total_units,
              grades: '',
              remarks: ''
            });

            // --- KEY CHANGE: INCREASE ROW HEIGHT FOR TOP/BOTTOM SPACING ---
            row.height = 30; 

            // Style each cell in the row
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              cell.font = { name: 'Calibri', size: 9 };

              // --- BORDER LOGIC (Clean look) ---
              if (colNumber <= 11 && !isFirstItem) {
                  cell.border = {}; 
              } else {
                  cell.border = {
                      top: { style: 'thin' },
                      left: { style: 'thin' },
                      bottom: { style: 'thin' },
                      right: { style: 'thin' }
                  };
              }

              // --- ALIGNMENT & SPACING LOGIC ---
              
              // 1. Program Name: Center Middle
              if (colNumber === 1) {
                 cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              }
              // 2. Numbers / Short Data: Center Middle
              else if (colNumber === 5 || colNumber >= 14) { 
                 cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              } 
              // 3. Course Code & Description: EXTRA LEFT PADDING (Indent 3)
              else if (colNumber === 12 || colNumber === 13) {
                 cell.alignment = { 
                    vertical: 'middle', 
                    horizontal: 'left', 
                    indent: 3, 
                    wrapText: true 
                 };
              }
              // 4. Standard Text: Normal Padding (Indent 1)
              else {
                 cell.alignment = { 
                    vertical: 'middle', 
                    horizontal: 'left', 
                    indent: 1, 
                    wrapText: true 
                 };
              }
            });
          });
        } else {
          // Fallback row
          const row = worksheet.addRow({
            program_name: progName, program_major: progMajor, curriculum: curriculum, student_no: studentNo, year_level: yearLevel, last_name: lastName, first_name: firstName, middle_name: middleName, ext_name: '', gender: gender, nationality: nationality, subject_code: 'N/A', descriptive_title: 'NO SUBJECTS ENROLLED', total_units: '', grades: '', remarks: ''
          });
          
          row.height = 30; // Apply height here too
          
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
             cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
             cell.font = { name: 'Calibri', size: 10 }; 
             
             if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
             else if (colNumber === 5 || colNumber >= 14) cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
             else cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `VIPC_ER.xlsx`);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export Failed: ${error.message || "Unknown error"}`); 
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant={variant || "outline"}
      className={className || "liquid-button border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer"}
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {isExporting ? 'Exporting...' : 'Export Students'}
    </Button>
  );
};

export default DownloadStudents;