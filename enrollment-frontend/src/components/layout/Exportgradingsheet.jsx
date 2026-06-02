import React, { useState, useEffect, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, Search, X, ChevronDown, Loader2, Users, BookOpen, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { instructorAPI, sectionAPI } from '@/services/api';

// ---------------------------------------------------------------------------
// Helpers (mirror DownloadGradingSheet logic exactly)
// ---------------------------------------------------------------------------

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

const getGradeColor = (value) => {
  if (value === null || value === undefined || value === '') return [0, 0, 0];
  const num = parseFloat(value);
  if (isNaN(num)) return [0, 0, 0];
  return Math.round(num) < 75 ? [220, 38, 38] : [0, 0, 0];
};

// ---------------------------------------------------------------------------
// PDF Generator (mirrors DownloadGradingSheet.jsx logic)
// ---------------------------------------------------------------------------

const generateGradingSheetPDF = ({ subject, students, instructorName, sectionName }) => {
  if (!subject || !students || students.length === 0) return;

  const doc = new jsPDF('p', 'mm', 'legal');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // --- LOGO SECTION (exact match to DownloadGradingSheet) ---
  const logoWidth = 140;
  const logoHeight = 30;
  const logoX = (pageWidth - logoWidth) / 2;
  const logoY = 6;

  try {
    doc.addImage('/vipc.png', 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (e) {
    console.warn('Logo not found');
  }

  const headerTextY = logoY + logoHeight + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('GRADING SHEET', pageWidth / 2, headerTextY, { align: 'center' });

  const startY = headerTextY + 4;
  doc.setFontSize(9);
  const leftX = margin + 5;
  const rightX = pageWidth / 2 + 10;
  const lineHeight = 4.5;

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

  // --- Consolidated Row (Lec / Lab / No. of Hours / Total Units on one line) ---
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
  const sampleStudent = students[0];
  const courseYear = `${sampleStudent.courseCode || ''} - ${sampleStudent.year || ''}`;

  drawField('Course & Year:', courseYear, rightX, startY);
  drawField('Sem. & A.Y.:', `${subject.semester || ''}, ${subject.school_year || ''}`, rightX, startY + lineHeight);
  drawField('Section:', sectionName, rightX, startY + (lineHeight * 2));

  // --- Grade flags ---
  // NOTE: in data coming from ExportGradingSheet's handleExport, courseName holds
  // the course CODE (e.g. "DHT"), not the full name. Check both patterns.
  const isDHT = sampleStudent?.courseName?.includes('Diploma') ||
                sampleStudent?.courseName?.toUpperCase().startsWith('DHT') ||
                sampleStudent?.courseCode?.toUpperCase().startsWith('DHT') ||
                subject.subject_code?.includes('DHT');
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
    'Remarks',
  ];

  const calculateFinal = (s) => {
    const { prelim_grade: p, midterm_grade: m, semifinal_grade: sm, final_grade: f } = s.grades || {};
    if ([p, m, sm, f].some((v) => v == null || v === '')) return null;
    // Mirror StudentGrades.jsx: round the result so PASSED/FAILED threshold
    // matches exactly what the instructor sees in the grading table.
    const raw = showPercent
      ? (p * 0.2) + (m * 0.2) + (sm * 0.2) + (f * 0.4)
      : (p + m + sm + f) / 4;
    return Math.round(raw);
  };

  const gradeValues = [];

  const tableBody = students.map((s) => {
    const final = calculateFinal(s);
    const equiv = final ? getEquiv(final) : '';
    let remarks = s.grades?.status || '';
    if (final !== null) remarks = Math.round(final) >= 75 ? 'PASSED' : 'FAILED';
    const fmt = (v) => (v != null && v !== '' ? parseFloat(v).toFixed(2) : '');

    gradeValues.push({
      prelim:     s.grades?.prelim_grade,
      midterm:    s.grades?.midterm_grade,
      semi:       s.grades?.semifinal_grade,
      final:      s.grades?.final_grade,
      finalGrade: final,
      remarks,
    });

    return [
      s.name.toUpperCase(),
      fmt(s.grades?.prelim_grade),
      fmt(s.grades?.midterm_grade),
      fmt(s.grades?.semifinal_grade),
      fmt(s.grades?.final_grade),
      final ? final.toFixed(2) : '',
      equiv,
      remarks,
    ];
  });

  autoTable(doc, {
    startY: unitRowY + 6,
    head: [tableHeaders],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      fontSize: 7.5,
      halign: 'center',
    },
    styles: {
      fontSize: 7,
      lineColor: 0,
      lineWidth: 0.1,
      cellPadding: 1.2,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center', fontStyle: 'bold' },
      6: { halign: 'center', fontStyle: 'bold' },
      7: { halign: 'center', fontSize: 6.5 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const rowIndex = data.row.index;
      const colIndex = data.column.index;
      const gv = gradeValues[rowIndex];
      if (!gv) return;

      if      (colIndex === 1) data.cell.styles.textColor = getGradeColor(gv.prelim);
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
    { g: '1.0', r: '99-100' }, { g: '1.1', r: '99' },  { g: '1.2', r: '98' },  { g: '1.25', r: '97' },
    { g: '1.3', r: '96' },    { g: '1.4', r: '95' },  { g: '1.5', r: '94' },  { g: '1.6', r: '93' },
    { g: '1.7', r: '92' },    { g: '1.75', r: '91' }, { g: '1.8', r: '90' },  { g: '1.9', r: '89' },
    { g: '2.0', r: '88' },    { g: '2.1', r: '87' },  { g: '2.2', r: '86' },  { g: '2.25', r: '85' },
    { g: '2.3', r: '84' },    { g: '2.4', r: '83' },  { g: '2.5', r: '82' },  { g: '2.6', r: '81' },
    { g: '2.7', r: '80' },    { g: '2.75', r: '79' }, { g: '2.8', r: '78' },  { g: '2.9', r: '77' },
    { g: '3.0', r: '76-75' }, { g: '3.1', r: '74' },  { g: '3.2', r: '73' },  { g: '3.25', r: '72' },
    { g: '3.3', r: '71' },    { g: '3.4', r: '70' },  { g: '5.0', r: 'Below 75' },
    { g: 'NFE', r: 'NO FINAL EXAM' }, { g: 'NFR', r: 'NO FINAL REQUIREMENT' },
    { g: 'INC', r: 'INCOMPLETE' },    { g: 'DA',  r: 'DROP DUE TO ABSENCES' },
  ];

  const rowsPerCol = 7;
  const numColumns = Math.ceil(rawLegendData.length / rowsPerCol);
  const dynamicHeaderRow = [];
  const dynamicColStyles = {};

  for (let c = 0; c < numColumns; c++) {
    dynamicHeaderRow.push('Grade', 'Equivalent');
    dynamicColStyles[c * 2]       = { fontStyle: 'bold', cellWidth: 8 };
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
    columnStyles: dynamicColStyles,
  });

  const sigY = doc.lastAutoTable.finalY + 10;
  const drawSigBlock = (label, name, title, xPos) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, xPos, sigY);
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

  doc.save(`Grading_Sheet_${subject.subject_code}_${sectionName}.pdf`);
};

// ---------------------------------------------------------------------------
// Small reusable searchable dropdown
// ---------------------------------------------------------------------------

const SearchDropdown = ({ label, icon: Icon, placeholder, items, labelKey, value, onChange, disabled, loading }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    items.filter((i) => String(i[labelKey] || '').toLowerCase().includes(search.toLowerCase())),
    [items, search, labelKey],
  );

  const selectedItem = items.find((i) => i.id === value?.id);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm text-left bg-white transition
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-red-400 cursor-pointer'}
          ${open ? 'border-red-500 ring-1 ring-red-300' : 'border-gray-300'}`}
      >
        <span className={selectedItem ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {loading ? 'Loading…' : (selectedItem ? selectedItem[labelKey] : placeholder)}
        </span>
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-red-400"
                placeholder={`Search ${label.toLowerCase()}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">No results found</p>
            ) : filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { onChange(item); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-red-50 transition
                  ${value?.id === item.id ? 'bg-red-50 font-semibold text-red-800' : 'text-gray-800'}`}
              >
                {item[labelKey]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main modal component
// ---------------------------------------------------------------------------

const ExportGradingSheet = ({ onClose }) => {
  // Data lists
  const [instructors, setInstructors]   = useState([]);
  const [sections, setSections]         = useState([]);
  const [subjects, setSubjects]         = useState([]);

  // Loading states
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loadingSubjects, setLoadingSubjects]       = useState(false);
  const [loadingExport, setLoadingExport]           = useState(false);

  // Selections
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedSubject, setSelectedSubject]       = useState(null);
  const [selectedSection, setSelectedSection]       = useState(null);

  // Error
  const [error, setError] = useState('');

  // Fetch instructors & sections once on mount
  useEffect(() => {
    const fetchBase = async () => {
      setLoadingInstructors(true);
      try {
        const [instrRes, secRes] = await Promise.all([
          instructorAPI.getAll(),
          sectionAPI.getAll(),
        ]);
        if (instrRes.success) setInstructors(instrRes.data.map((i) => ({ ...i, label: i.name })));
        if (secRes.success)   setSections(secRes.data.map((s) => ({ ...s, label: s.name })));
      } catch (e) {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoadingInstructors(false);
      }
    };
    fetchBase();
  }, []);

  // Fetch subjects when instructor is chosen
  useEffect(() => {
    if (!selectedInstructor) { setSubjects([]); setSelectedSubject(null); return; }

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      setSelectedSubject(null);
      setError('');
      try {
        const res = await instructorAPI.getSpecificRoster(selectedInstructor.id);
        if (res.success) {
          const subjectMap = {};
          res.data.forEach((entry) => {
            // Key by the unique subject id so two distinct subjects that share the
            // same subject_code (e.g. ENTREP in OBM vs. ENTREP in HRS) don't collide
            // and overwrite each other. Fall back to code+title if id is missing.
            const key = entry.subject_id ?? `${entry.subject_code}|${entry.descriptive_title}`;
            if (!subjectMap[key]) {
              subjectMap[key] = {
                id: entry.subject_id ?? entry.subject_code,
                subject_id: entry.subject_id ?? null,
                subject_code: entry.subject_code,
                descriptive_title: entry.descriptive_title,
                schedule_info: entry.schedule_time || 'TBA',
                lec_hrs: entry.lec_hrs || 0,
                lab_hrs: entry.lab_hrs || 0,
                total_units: entry.total_units || 0,
                number_of_hours: entry.number_of_hours || 0,
                semester: entry.semester || '',
                school_year: entry.school_year || '',
                label: `${entry.subject_code} – ${entry.descriptive_title}`,
                _students: entry.students || [],
                _section_name: entry.section_name || 'All Sections',
              };
            }
          });
          setSubjects(Object.values(subjectMap));
        }
      } catch (e) {
        setError('Failed to load subjects for this instructor.');
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [selectedInstructor]);

  // Derive students from selected subject + section
  const previewStudents = useMemo(() => {
    if (!selectedSubject) return [];
    let students = selectedSubject._students || [];

    if (selectedSection) {
      students = students.filter((s) => {
        return String(s.section || '').toLowerCase() === String(selectedSection.name || '').toLowerCase();
      });
    }
    return students;
  }, [selectedSubject, selectedSection]);

  const handleExport = async () => {
    if (!selectedInstructor || !selectedSubject || !selectedSection) {
      setError('Please select an instructor, subject, and section.');
      return;
    }
    setError('');
    setLoadingExport(true);

    try {
      const res = await instructorAPI.getSpecificRoster(selectedInstructor.id);

      if (!res.success) throw new Error('Failed to load roster data.');

      // Pick the roster entries for the EXACT selected subject and section.
      // Match on the unique subject id when available so we don't merge students
      // from a different subject that shares the same code (e.g. ENTREP in OBM
      // vs. ENTREP in HRS). Fall back to code+title when id is missing.
      const matchingEntries = res.data.filter((e) => {
        const subjectMatches = selectedSubject.subject_id != null
          ? e.subject_id === selectedSubject.subject_id
          : e.subject_code === selectedSubject.subject_code &&
            e.descriptive_title === selectedSubject.descriptive_title;

        const sectionMatches = String(e.section_name || '').toLowerCase()
          === String(selectedSection.name || '').toLowerCase();

        return subjectMatches && sectionMatches;
      });

      const studentMap = {};
      matchingEntries.forEach((entry) => {
        (entry.students || []).forEach((s) => {
          if (
            selectedSection &&
            String(s.section || '').toLowerCase() !== String(selectedSection.name || '').toLowerCase()
          ) return;

          if (!studentMap[s.student_id || s.name]) {
            studentMap[s.student_id || s.name] = {
              id: s.student_id,
              name: s.name,
              studentId: s.student_id,
              year: s.year || '',
              courseCode: s.course || '',
              courseName: s.course || '',
              section: s.section || selectedSection.name,
              grades: {
                prelim_grade:    s.grades?.prelim_grade    ?? null,
                midterm_grade:   s.grades?.midterm_grade   ?? null,
                semifinal_grade: s.grades?.semifinal_grade ?? null,
                final_grade:     s.grades?.final_grade     ?? null,
                status:          s.grades?.status          ?? '',
              },
            };
          }
        });
      });

      const finalStudents = Object.values(studentMap);

      if (finalStudents.length === 0) {
        setError('No students with grade records found for this subject and section.');
        setLoadingExport(false);
        return;
      }

      generateGradingSheetPDF({
        subject: {
          subject_code:    selectedSubject.subject_code,
          descriptive_title: selectedSubject.descriptive_title,
          schedule_info:   selectedSubject.schedule_info,
          lec_hrs:         selectedSubject.lec_hrs,
          lab_hrs:         selectedSubject.lab_hrs,
          total_units:     selectedSubject.total_units,
          number_of_hours: selectedSubject.number_of_hours,
          semester:        selectedSubject.semester,
          school_year:     selectedSubject.school_year,
        },
        students:        finalStudents,
        instructorName:  selectedInstructor.name,
        sectionName:     selectedSection.name,
      });

    } catch (e) {
      setError(e.message || 'An error occurred while generating the PDF.');
    } finally {
      setLoadingExport(false);
    }
  };

  const canExport = selectedInstructor && selectedSubject && selectedSection;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* ✅ FIX 2: Removed 'overflow-hidden' from this container so the dropdowns can overlap the edges */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header - Added rounded-t-2xl to keep the top corners smooth */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-red-50 to-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <FileDown className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Export Grading Sheet</h2>
              <p className="text-xs text-gray-500">Export grades by instructor, subject &amp; section</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <SearchDropdown
            label="Instructor"
            icon={Users}
            placeholder="Select an instructor…"
            items={instructors}
            labelKey="label"
            value={selectedInstructor}
            onChange={(v) => { setSelectedInstructor(v); setSelectedSubject(null); setSelectedSection(null); setError(''); }}
            loading={loadingInstructors}
          />

          <SearchDropdown
            label="Subject"
            icon={BookOpen}
            placeholder={selectedInstructor ? 'Select a subject…' : 'Select instructor first'}
            items={subjects}
            labelKey="label"
            value={selectedSubject}
            onChange={(v) => { setSelectedSubject(v); setSelectedSection(null); setError(''); }}
            disabled={!selectedInstructor || loadingSubjects}
            loading={loadingSubjects}
          />

          <SearchDropdown
            label="Section"
            icon={LayoutList}
            placeholder={selectedSubject ? 'Select a section…' : 'Select subject first'}
            items={sections}
            labelKey="label"
            value={selectedSection}
            onChange={(v) => { setSelectedSection(v); setError(''); }}
            disabled={!selectedSubject}
          />

          {/* Preview count */}
          {selectedSubject && selectedSection && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm
              ${previewStudents.length > 0 ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              <Users className="w-4 h-4 shrink-0" />
              {previewStudents.length > 0
                ? <span><strong>{previewStudents.length}</strong> student{previewStudents.length !== 1 ? 's' : ''} found in roster preview.</span>
                : <span>No current students in roster preview — grade records may still exist (e.g. students moved to next semester). The export will still include all recorded grades.</span>
              }
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer - Added rounded-b-2xl to keep the bottom corners smooth */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport || loadingExport}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white cursor-pointer"
          >
            {loadingExport
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><FileDown className="w-4 h-4" /> Export PDF</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportGradingSheet;