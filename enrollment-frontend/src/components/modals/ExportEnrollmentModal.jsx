import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileSpreadsheet, FileText, Loader2, X, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { saveAs } from 'file-saver';

import { Button } from '@/components/ui/button';
import MotionDropdown from '../idreleasing/MotionDropdown';

const SCHOOL_NAME = 'VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE';
const SCHOOL_ADDRESS = 'Prince Padi Bldg., Antonio Luna St., Cagayan de Oro City';

const ALL = '';

/** The columns both files share, so the PDF and the workbook cannot drift. */
const COLUMNS = [
  { key: 'index', label: '#', width: 6 },
  { key: 'student_id_number', label: 'Student ID', width: 14 },
  { key: 'name', label: 'Name', width: 34 },
  { key: 'course_code', label: 'Course', width: 14 },
  { key: 'year', label: 'Year', width: 14 },
  { key: 'semester', label: 'Semester', width: 16 },
  { key: 'school_year', label: 'School Year', width: 14 },
  { key: 'enrollment_date', label: 'Enrolled On', width: 14 },
  { key: 'status', label: 'Status', width: 20 },
];

/** Options for one filter, taken from the rows themselves so nothing is offered that cannot match. */
const optionsFrom = (rows, key, allLabel) => {
  const seen = [...new Set(rows.map((row) => (row?.[key] ?? '').toString().trim()).filter(Boolean))];
  seen.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return [{ value: ALL, label: allLabel }, ...seen.map((value) => ({ value, label: value }))];
};

const stamp = () => new Date().toISOString().slice(0, 10);

/**
 * Export the enrollment list, narrowed first.
 *
 * Filters down the rows the page already has rather than asking the server
 * again: the list is loaded in full, so a second round trip would only risk
 * exporting something different from what is on screen.
 */
const ExportEnrollmentModal = ({ students = [], onClose }) => {
  const [schoolYear, setSchoolYear] = useState(ALL);
  const [semester, setSemester] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [course, setCourse] = useState(ALL);
  const [busy, setBusy] = useState('');

  const schoolYearOptions = useMemo(() => optionsFrom(students, 'school_year', 'All school years'), [students]);
  const semesterOptions = useMemo(() => optionsFrom(students, 'semester', 'All semesters'), [students]);
  const yearOptions = useMemo(() => optionsFrom(students, 'year', 'All year levels'), [students]);
  const courseOptions = useMemo(() => optionsFrom(students, 'course', 'All courses'), [students]);

  const matches = useMemo(() => {
    const same = (a, b) => (a ?? '').toString().trim() === b;

    return students
      .filter((row) => (schoolYear === ALL || same(row.school_year, schoolYear))
        && (semester === ALL || same(row.semester, semester))
        && (year === ALL || same(row.year, year))
        && (course === ALL || same(row.course, course)))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [students, schoolYear, semester, year, course]);

  /** The chosen filters in words, for the heading on the file. */
  const subtitle = useMemo(() => {
    const parts = [
      schoolYear && `SY ${schoolYear}`,
      semester,
      year,
      course,
    ].filter(Boolean);

    return parts.length ? parts.join('  ·  ') : 'All enrollments';
  }, [schoolYear, semester, year, course]);

  const rows = () => matches.map((row, index) => COLUMNS.map((column) => (column.key === 'index'
    ? index + 1
    : (row[column.key] ?? '—').toString())));

  const fileName = () => {
    const bits = ['Enrollment-List', schoolYear, semester, year, course, stamp()]
      .filter(Boolean)
      .map((bit) => bit.toString().replace(/[^\w.-]+/g, '_'));

    return bits.join('_');
  };

  const exportPdf = () => {
    setBusy('pdf');
    try {
      // Landscape: ten columns do not sit on a portrait page without the
      // names wrapping onto two lines each.
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
      const width = doc.internal.pageSize.getWidth();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(SCHOOL_NAME, width / 2, 14, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(SCHOOL_ADDRESS, width / 2, 19, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('ENROLLMENT LIST', width / 2, 26, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(subtitle, width / 2, 31, { align: 'center' });

      autoTable(doc, {
        startY: 36,
        head: [COLUMNS.map((column) => column.label)],
        body: rows(),
        styles: { fontSize: 8, cellPadding: 1.6, overflow: 'linebreak' },
        headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: { 0: { halign: 'right', cellWidth: 9 } },
        margin: { left: 10, right: 10 },
        didDrawPage: () => {
          const page = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(110);
          doc.text(
            `${matches.length} student${matches.length === 1 ? '' : 's'}  ·  generated ${stamp()}`,
            10,
            doc.internal.pageSize.getHeight() - 7
          );
          doc.text(`Page ${page}`, width - 10, doc.internal.pageSize.getHeight() - 7, { align: 'right' });
          doc.setTextColor(0);
        },
      });

      doc.save(`${fileName()}.pdf`);
      onClose();
    } finally {
      setBusy('');
    }
  };

  const exportExcel = async () => {
    setBusy('excel');
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Enrollment List');
      const last = String.fromCharCode(64 + COLUMNS.length); // 10 columns -> 'J'

      const heading = (cell, text, size, bold) => {
        sheet.mergeCells(cell);
        const target = sheet.getCell(cell.split(':')[0]);
        target.value = text;
        target.font = { name: 'Calibri', size, bold };
        target.alignment = { horizontal: 'center' };
      };

      heading(`A1:${last}1`, SCHOOL_NAME, 13, true);
      heading(`A2:${last}2`, SCHOOL_ADDRESS, 9, false);
      heading(`A3:${last}3`, 'ENROLLMENT LIST', 11, true);
      heading(`A4:${last}4`, subtitle, 10, false);

      sheet.getRow(6).values = COLUMNS.map((column) => column.label);
      sheet.getRow(6).eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'thin' } };
      });

      rows().forEach((row) => sheet.addRow(row));

      sheet.columns = COLUMNS.map((column) => ({ width: column.width }));
      // The header block is merged across the table, so freezing below it
      // keeps the column names in view on a long list.
      sheet.views = [{ state: 'frozen', ySplit: 6 }];

      sheet.addRow([]);
      const total = sheet.addRow([`${matches.length} student${matches.length === 1 ? '' : 's'}`]);
      total.getCell(1).font = { name: 'Calibri', size: 10, bold: true, italic: true };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }), `${fileName()}.xlsx`);
      onClose();
    } finally {
      setBusy('');
    }
  };

  const nothingToExport = matches.length === 0;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
      >
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="bg-red-50 p-2.5 rounded-xl">
              <FileDown className="h-6 w-6 text-(--dominant-red)" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Export Enrollment List</h2>
              <p className="text-sm text-gray-500 mt-0.5">Narrow it down, then choose a format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 space-y-3">
          <Field label="School Year">
            <MotionDropdown value={schoolYear} onChange={setSchoolYear} options={schoolYearOptions}
              placeholder="All school years" />
          </Field>
          <Field label="Semester">
            <MotionDropdown value={semester} onChange={setSemester} options={semesterOptions}
              placeholder="All semesters" />
          </Field>
          <Field label="Year Level">
            <MotionDropdown value={year} onChange={setYear} options={yearOptions}
              placeholder="All year levels" />
          </Field>
          <Field label="Course">
            {/* The only list here long enough to scroll past */}
            <MotionDropdown value={course} onChange={setCourse} options={courseOptions}
              placeholder="All courses" searchable searchPlaceholder="Search courses…" />
          </Field>
        </div>

        <div className="px-6 pt-4">
          <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 border ${
            nothingToExport
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
          >
            <Users size={15} className="shrink-0" />
            {nothingToExport
              ? 'No students match these filters.'
              : <span><strong>{matches.length}</strong> student{matches.length === 1 ? '' : 's'} will be exported.</span>}
          </div>
        </div>

        <div className="p-6 pt-4 flex gap-2">
          <Button
            variant="outline"
            disabled={nothingToExport || busy !== ''}
            onClick={exportPdf}
            className="flex-1 h-11 cursor-pointer bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            {busy === 'pdf'
              ? <Loader2 size={16} className="animate-spin mr-2" />
              : <FileText size={16} className="mr-2" />}
            PDF
          </Button>
          <Button
            disabled={nothingToExport || busy !== ''}
            onClick={exportExcel}
            className="flex-1 h-11 gradient-primary text-white cursor-pointer"
          >
            {busy === 'excel'
              ? <Loader2 size={16} className="animate-spin mr-2" />
              : <FileSpreadsheet size={16} className="mr-2" />}
            Excel
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

export default ExportEnrollmentModal;
