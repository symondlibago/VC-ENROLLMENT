import React, { useState, useEffect, useMemo, useCallback, useTransition, useDeferredValue, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import {
  X, Loader2, Download, Wallet, CheckCircle2, AlertCircle, Users, Search, ChevronDown,
  FileSpreadsheet, FileText, UserMinus, GraduationCap
} from 'lucide-react';
import { paymentAPI } from '../../services/api';
import { termAccountFor } from '@/lib/accountBalance';
import {
  REPORT_FORMAT, REPORT_ORIENTATION, STATUS, TONES, drawPaymentStatusReport, finishReport, statusFor,
} from '@/lib/paymentStatusReport';
import { isEnrolled, isWithdrawn, reportedScholarship, scholarshipRank } from '@/lib/studentStatus';
import { loadSchoolLogo } from '@/lib/schoolLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Payment status report: enrolled students split into those who still owe money
 * and those who are fully paid, grouped by course and year level.
 *
 * The balance is not worked out here: it comes from summarizeAccount, the
 * same function behind the Term Payment modal and the printed balance slip.
 * An overpayment settles to zero rather than going negative, so it counts as
 * fully paid.
 *
 * Exports as a spreadsheet to work on, or a PDF to print and hand round.
 */

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Status colours for the spreadsheet, matching the printed report. */
const STATUS_ARGB = {
  [STATUS.UNASSESSED]: 'FFB45309',
  [STATUS.UNPAID]: 'FFB91C1C',
  [STATUS.PARTIAL]: 'FFB91C1C',
  [STATUS.SETTLED]: 'FF155E30',
};

// Year levels in school order, anything unexpected sorts last alphabetically
const YEAR_ORDER = [
  'Grade 11', 'Grade 12',
  '1st Year', '1st Year Summer',
  '2nd Year', '2nd Year Summer',
  '3rd Year', '4th Year',
];
const yearRank = (year) => {
  const i = YEAR_ORDER.indexOf(year);
  return i === -1 ? YEAR_ORDER.length : i;
};

// The account arithmetic lives in termAccountFor, beside the formula the
// payment modal and the printed balance slip use — three places that have to
// agree to the centavo about what a student owes.

/**
 * Outstanding, collected, and how many of these students nobody has billed.
 *
 * The unbilled count is carried beside the money because without it a group
 * reading "10 students · ₱14,750.01 due" looks like ten people owing between
 * them, when it can be one person owing and nine nobody has assessed.
 */
const sumOf = (students) => ({
  total: students.reduce((sum, r) => sum + (r.remaining || 0), 0),
  collected: students.reduce((sum, r) => sum + (r.paid || 0), 0),
  unbilled: students.reduce((count, r) => count + (r.hasRecord ? 0 : 1), 0),
});

const byCourseThenYear = {
  group: (row) => row.course || 'Unassigned Course',
  section: (row) => row.year || 'Unspecified Year',
  sectionRank: yearRank,
};

/** The scholars sheet leads with the scholarship, then splits by course. */
const byScholarshipThenCourse = {
  group: (row) => row.scholarship || 'Scholarship not recorded',
  section: (row) => row.course || 'Unassigned Course',
  groupRank: scholarshipRank,
  sectionRank: () => 0,
};

/**
 * Two levels of headings over a flat list of students.
 *
 * The accessors are passed in rather than hard-coded to course and year,
 * because the scholars sheet leads with the scholarship instead — and a
 * second copy of this grouping would be a second place for a subtotal to
 * drift away from the rows above it.
 */
const groupRows = (rows, { group, section, groupRank, sectionRank } = byCourseThenYear) => {
  const byGroup = new Map();

  rows.forEach(row => {
    const groupKey = group(row);
    if (!byGroup.has(groupKey)) byGroup.set(groupKey, new Map());

    const bySection = byGroup.get(groupKey);
    const sectionKey = section(row);
    if (!bySection.has(sectionKey)) bySection.set(sectionKey, []);
    bySection.get(sectionKey).push(row);
  });

  const rank = groupRank ?? (() => 0);
  const subRank = sectionRank ?? (() => 0);

  return [...byGroup.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([heading, bySection]) => {
      const all = [...bySection.values()].flat();

      return {
        heading,
        ...sumOf(all),
        count: all.length,
        sections: [...bySection.entries()]
          .sort((a, b) => subRank(a[0]) - subRank(b[0]) || a[0].localeCompare(b[0]))
          .map(([sectionHeading, students]) => ({
            heading: sectionHeading,
            students: students.sort((a, b) => a.name.localeCompare(b.name)),
            ...sumOf(students),
          })),
      };
    });
};

/**
 * The grouped student list, split out and memoised: it can run to several
 * hundred rows, so re-rendering it on every keystroke or dropdown click is what
 * made the filters feel sluggish.
 */
const BalancesList = memo(function BalancesList({ groups, showBalance }) {
  return (
    <div className="divide-y divide-gray-100">
      {groups.map(group => (
        <div key={group.heading}>
          {/* Group header — course, or scholarship on the scholars list */}
          <div className="sticky top-0 z-10 bg-(--dominant-red) text-white px-6 py-2.5 flex items-center justify-between">
            <span className="font-bold text-sm uppercase tracking-wide">{group.heading}</span>
            <span className="text-xs text-white/85">
              {group.count} student{group.count === 1 ? '' : 's'}
              {group.unbilled > 0 && ` · ${group.unbilled} not assessed`}
              {' · '}
              {showBalance ? `${peso(group.total)} due` : `${peso(group.collected)} collected`}
            </span>
          </div>

          {group.sections.map(section => (
            <div key={`${group.heading}-${section.heading}`}>
              {/* Sub-heading — year level, or course on the scholars list */}
              <div className="bg-gray-100 px-6 py-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase">{section.heading}</span>
                <span className="text-xs text-gray-500">
                  {section.students.length}
                  {section.unbilled > 0 && ` · ${section.unbilled} not assessed`}
                  {' · '}
                  {showBalance ? peso(section.total) : peso(section.collected)}
                </span>
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {section.students.map((student, i) => (
                    <tr key={student.id} className="border-t border-gray-50 hover:bg-(--whitish-pink)/40">
                      <td className="px-6 py-2.5 text-gray-400 w-10">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-gray-800">{student.name}</div>
                        <div className="text-xs text-gray-400 font-mono flex items-center gap-2 flex-wrap">
                          {student.studentId}
                          {student.scholarship && (
                            <span className="font-sans rounded-full bg-(--dominant-red)/10 text-(--dominant-red) px-2 py-0.5 text-[10px] font-bold">
                              {student.scholarship}
                            </span>
                          )}
                          {student.withdrawn && (
                            <span className="font-sans rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold">
                              Withdrawn
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{student.course}</td>
                      <td className="px-6 py-2.5 text-right whitespace-nowrap">
                        {!student.hasRecord ? (
                          <>
                            <span className="text-xs font-semibold text-amber-600">Not yet assessed</span>
                            <span className="block text-[11px] text-gray-400">no fees on record</span>
                          </>
                        ) : showBalance ? (
                          <>
                            <span className="font-bold text-(--dominant-red)">{peso(student.remaining)}</span>
                            <span className="block text-[11px] text-gray-400">
                              {peso(student.paid)} of {peso(student.assessed - student.discount)} paid
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-green-700">{peso(student.paid)}</span>
                            {/* The amount due, not the gross assessment: without
                                the discount step a settled row looks short-paid */}
                            <span className="block text-[11px] text-gray-400">
                              {student.advance > 0.005 ? `${peso(student.advance)} advance` : 'settled'}
                              {' · '}
                              {peso(student.assessed - student.discount)} due
                              {student.discount > 0.005 && ` after ${peso(student.discount)} discount`}
                            </span>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

const PaymentBalancesModal = ({ isOpen, onClose, students = [] }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('unpaid'); // 'unpaid' | 'paid'
  const [search, setSearch] = useState('');
  const [schoolYear, setSchoolYear] = useState('all');
  const [semester, setSemester] = useState('all');
  // Filtering re-renders a long list, so it runs as a non-urgent update: the
  // dropdown closes and the tab highlights immediately, the list catches up.
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const [isExporting, setIsExporting] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentAPI.getAll();
      setPayments(res.success && Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load payment records.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTab('unpaid');
      setSearch('');
      setSchoolYear('all');
      setSemester('all');
      fetchPayments();
    }
  }, [isOpen, fetchPayments]);

  // One row per enrolled student, with the balance attached
  const rows = useMemo(() => {
    const paymentByStudent = new Map(payments.map(p => [p.pre_enrolled_student_id, p]));

    return students
      .filter(isEnrolled)
      .map(s => {
        const account = termAccountFor(paymentByStudent.get(s.id), s);
        return {
          id: s.id,
          studentId: s.student_id_number,
          name: (s.name || '').toUpperCase(),
          course: s.courseName || 'Unassigned Course',
          courseCode: s.courseCode || null,
          year: s.year || 'Unspecified Year',
          section: s.sectionName,
          schoolYear: s.school_year || 'Unspecified',
          semester: s.semester || 'Unspecified',
          // City Scholar / Student Assistant only; other funding is not on
          // this report, and a withdrawn student is kept off the main lists
          scholarship: reportedScholarship(s),
          withdrawn: isWithdrawn(s),
          assessed: account?.assessed ?? 0,
          discount: account?.discount ?? 0,
          paid: account?.paid ?? 0,
          advance: account?.advance ?? 0,
          remaining: account?.remaining ?? null,
          hasRecord: account !== null,
        };
      });
  }, [students, payments]);

  // School years and semesters present in the data
  const schoolYearOptions = useMemo(
    () => [...new Set(rows.map(r => r.schoolYear))].sort().reverse(),
    [rows]
  );
  const semesterOptions = useMemo(
    () => [...new Set(rows.map(r => r.semester))].sort(),
    [rows]
  );

  // Balances are always for the student's current term, so filtering by term
  // means "students whose term is this one".
  const termRows = useMemo(() => rows.filter(r =>
    (schoolYear === 'all' || r.schoolYear === schoolYear) &&
    (semester === 'all' || r.semester === semester)
  ), [rows, schoolYear, semester]);

  /**
   * Four lists, and nobody is on two of them.
   *
   * Every student lands in exactly one: withdrawn first, then scholars, then
   * the paid / unpaid split for everyone else. Scholars used to appear in
   * both their own list and the unpaid one, which meant working through the
   * outstanding balances and then meeting the same names again further on —
   * so the four counts now add up to the students in view.
   */
  const { unpaid, paid, withdrawn, scholars } = useMemo(() => {
    const withdrawnRows = termRows.filter(r => r.withdrawn);
    const studying = termRows.filter(r => !r.withdrawn);
    const scholarRows = studying.filter(r => r.scholarship);
    const rest = studying.filter(r => !r.scholarship);

    return {
      // A student with no billing record yet can't be called fully paid
      unpaid: rest.filter(r => !r.hasRecord || r.remaining > 0.005),
      paid: rest.filter(r => r.hasRecord && r.remaining <= 0.005),
      withdrawn: withdrawnRows,
      scholars: scholarRows,
    };
  }, [termRows]);

  const activeRows = { paid, withdrawn, scholars }[tab] ?? unpaid;

  const visibleGroups = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const filtered = q
      ? activeRows.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.course.toLowerCase().includes(q) ||
          (r.studentId || '').toLowerCase().includes(q))
      : activeRows;
    // The scholars list leads with the scholarship on screen too, so what is
    // printed is what was being read
    return groupRows(filtered, tab === 'scholars' ? byScholarshipThenCourse : byCourseThenYear);
  }, [activeRows, deferredSearch, tab]);

  const visibleCount = visibleGroups.reduce((sum, g) => sum + g.count, 0);
  /**
   * The term's money, across both lists.
   *
   * Headline figures are deliberately term-wide rather than per-tab. Most of
   * what the school has taken in comes from students who have paid something
   * and still owe, so a "collected" figure scoped to the tab you happen to be
   * on reads as though three quarters of the term's takings vanished when you
   * click Fully Paid.
   */
  const termCollected = termRows.reduce((sum, r) => sum + (r.paid || 0), 0);
  const termOutstanding = termRows.reduce((sum, r) => sum + (r.remaining || 0), 0);
  // What the list currently on screen contributes to that
  const collectedTotal = activeRows.reduce((sum, r) => sum + (r.paid || 0), 0);
  // Students nobody has billed yet. They sit in the unpaid list because a
  // zero balance on an empty record is not a student who has settled.
  const unbilledCount = activeRows.reduce((count, r) => count + (r.hasRecord ? 0 : 1), 0);

  // Shown in the modal and written into the exported file so a saved report
  // always says which term it covers
  const termLabel = [
    schoolYear === 'all' ? 'All School Years' : schoolYear,
    semester === 'all' ? 'All Semesters' : semester,
  ].join(' · ');

  /** How the printed report should describe what it covers, in a sentence. */
  const scopeLabel = schoolYear === 'all' && semester === 'all'
    ? 'across every school year and semester'
    : `in ${termLabel}`;

  /** Keeps exports for different terms from overwriting each other. */
  const fileStem = `Payment Status Report${schoolYear === 'all' ? '' : ` - ${schoolYear}`}`
    + `${semester === 'all' ? '' : ` ${semester}`} - ${new Date().toISOString().split('T')[0]}`;

  /**
   * Each sheet is its own sheet of paper.
   *
   * Withdrawn students and scholars are printed apart from the main lists
   * because they are read by different people for different reasons — the
   * cashier chasing balances, and whoever reports on who the school is
   * funding.
   */
  const SHEETS = {
    unpaid: {
      rows: unpaid,
      name: 'Not Fully Paid',
      title: 'NOT FULLY PAID',
      accent: TONES.owed,
      subtitle: 'Outstanding balances — scholars and withdrawn students are listed on their own pages',
    },
    paid: {
      rows: paid,
      name: 'Fully Paid',
      title: 'FULLY PAID',
      accent: TONES.settled,
      subtitle: 'Students who have settled their account for the term',
    },
    withdrawn: {
      rows: withdrawn,
      name: 'Withdrawn',
      title: 'WITHDRAWN STUDENTS',
      accent: TONES.withdrawn,
      // Accurate about what the separation does: these students are out of
      // the paid and unpaid lists, but their balances are still counted in
      // the term's outstanding total below
      subtitle: 'Separated from the paid and unpaid lists — these students are no longer studying',
    },
    scholars: {
      rows: scholars,
      name: 'Scholars',
      title: 'SCHOLARS — CITY SCHOLAR & STUDENT ASSISTANT',
      accent: TONES.scholars,
      subtitle: 'Listed here only, not in the paid or unpaid pages. TESDA, CHED and other grants are not scholars here',
    },
  };

  /**
   * Two files, because they are two different jobs.
   *
   * Chasing money is one of them: who still owes, who left owing, and who is
   * on a scholarship — all in one document so the cashier prints once, each
   * list starting its own page so it can be pulled apart and handed on.
   * Confirming who has settled is the other, and it has no business padding
   * out the first.
   */
  const BUNDLES = {
    unpaid: { name: 'Not Fully Paid', sections: ['unpaid', 'withdrawn', 'scholars'] },
    paid: { name: 'Fully Paid', sections: ['paid'] },
  };

  const handleExportPdf = async (bundleKey) => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const bundle = BUNDLES[bundleKey];
      const logo = await loadSchoolLogo();
      const doc = new jsPDF({ orientation: REPORT_ORIENTATION, unit: 'mm', format: REPORT_FORMAT });

      // So the printed Collected figure is not mistaken for the term's
      const termSummary = {
        students: termRows.length,
        collected: termCollected,
        outstanding: termOutstanding,
        scope: scopeLabel,
      };

      // An empty section is left out rather than printing a page that says
      // nothing — but the list the file is named after always prints, so a
      // term with nobody owing still produces a readable sheet
      const printing = bundle.sections.filter(
        (key, index) => index === 0 || SHEETS[key].rows.length > 0,
      );

      // Where each section ends, so the footer can say which list a page
      // belongs to and how far through it you are
      const ranges = [];

      printing.forEach((key, index) => {
        const sheet = SHEETS[key];
        const isScholars = key === 'scholars';

        // Totals are left to the report to sum from the rows it prints, so a
        // figure in a summary band can never disagree with the list above it
        drawPaymentStatusReport(doc, {
          groups: groupRows(sheet.rows, isScholars ? byScholarshipThenCourse : byCourseThenYear),
          sectionTitle: sheet.title,
          accent: sheet.accent,
          subtitle: sheet.subtitle,
          termLabel,
          studentCount: sheet.rows.length,
          showScholarship: isScholars,
          termSummary,
          newPage: index > 0,
          logo,
        });

        ranges.push({ label: sheet.name, to: doc.getNumberOfPages() });
      });

      finishReport(doc, ranges);

      doc.save(`${fileStem} (${bundle.name}).pdf`);
    } catch (e) {
      setError(e.message || 'Failed to export the report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'VIPC Enroll';
      wb.created = new Date();

      // Twelve columns: No., ID, Name, Course, Year, Term, Assessed, Discount,
      // Collected, Balance or Advance, Status, Scholarship
      const span = (row) => `A${row}:L${row}`;

      const buildSheet = (name, list, showBalance, grouping = byCourseThenYear) => {
        const ws = wb.addWorksheet(name);
        [6, 18, 38, 30, 16, 24, 16, 14, 16, 16, 18, 22].forEach((width, i) => {
          ws.getColumn(i + 1).width = width;
        });

        const title = ws.getCell('A1');
        title.value = `VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE, INC. — ${name}`;
        title.font = { bold: true, size: 13, color: { argb: 'FF9C262C' } };
        ws.mergeCells(span(1));
        ws.getCell('A2').value =
          `Generated ${new Date().toLocaleString()} · ${termLabel} · ${list.length} student${list.length === 1 ? '' : 's'}`
          + ' · Assessed less discount less collected equals balance';
        ws.getCell('A2').font = { size: 10, color: { argb: 'FF6B7280' } };
        ws.mergeCells(span(2));

        /** The four money cells, written as numbers so they stay addable. */
        const writeMoney = (row, student) => {
          [student.assessed, student.discount, student.paid,
            showBalance ? student.remaining : student.advance]
            .forEach((amount, i) => {
              const cell = ws.getCell(row, 7 + i);
              if (!student.hasRecord) {
                cell.value = i === 3 ? 'Not yet assessed' : '—';
              } else {
                cell.value = amount;
                cell.numFmt = '#,##0.00';
              }
              cell.alignment = { horizontal: 'right' };
              if (i >= 2) {
                cell.font = { bold: true, color: { argb: showBalance && i === 3 ? 'FFB91C1C' : 'FF155E30' } };
              }
            });
        };

        let row = 4;
        groupRows(list, grouping).forEach(group => {
          const courseCell = ws.getCell(`A${row}`);
          courseCell.value = `${group.heading} — ${group.count} student(s), collected ${peso(group.collected)}`
            + (showBalance ? `, outstanding ${peso(group.total)}` : '');
          courseCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
          courseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B1A1E' } };
          ws.mergeCells(span(row));
          row++;

          group.sections.forEach(section => {
            const yearCell = ws.getCell(`A${row}`);
            yearCell.value = `${section.heading} (${section.students.length}) — collected ${peso(section.collected)}`
              + (showBalance ? `, outstanding ${peso(section.total)}` : '');
            yearCell.font = { bold: true, size: 11, color: { argb: 'FF374151' } };
            yearCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            ws.mergeCells(span(row));
            row++;

            const headers = ['No.', 'Student ID', 'Name', 'Course', 'Year', 'Semester / S.Y.',
              'Assessed', 'Discount', 'Collected', showBalance ? 'Balance' : 'Advance', 'Status', 'Scholarship'];
            headers.forEach((text, i) => {
              const cell = ws.getCell(row, i + 1);
              cell.value = text;
              cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
              cell.alignment = { horizontal: i >= 6 && i <= 9 ? 'right' : 'left', vertical: 'middle' };
            });
            row++;

            section.students.forEach((student, i) => {
              ws.getCell(row, 1).value = i + 1;
              ws.getCell(row, 2).value = student.studentId || '';
              ws.getCell(row, 3).value = student.name;
              ws.getCell(row, 4).value = student.courseCode || student.course;
              ws.getCell(row, 5).value = student.year;
              ws.getCell(row, 6).value = [student.semester, student.schoolYear].filter(Boolean).join(' · ');
              writeMoney(row, student);

              // The same wording the printed report uses, so a row looked up
              // in one can be matched in the other
              const status = ws.getCell(row, 11);
              status.value = statusFor(student);
              status.font = { bold: true, color: { argb: STATUS_ARGB[status.value] ?? 'FF111111' } };

              const scholarship = ws.getCell(row, 12);
              scholarship.value = student.scholarship || '';
              if (student.scholarship) {
                scholarship.font = { bold: true, color: { argb: 'FF9C262C' } };
              }

              row++;
            });

            row++; // blank line between year groups
          });
        });

        const totalLabel = ws.getCell(`F${row}`);
        totalLabel.value = `TOTAL — ${list.length} student(s)`;
        totalLabel.font = { bold: true, size: 11 };
        totalLabel.alignment = { horizontal: 'right' };

        [
          list.reduce((sum, r) => sum + (r.assessed || 0), 0),
          list.reduce((sum, r) => sum + (r.discount || 0), 0),
          list.reduce((sum, r) => sum + (r.paid || 0), 0),
          list.reduce((sum, r) => sum + (showBalance ? (r.remaining || 0) : (r.advance || 0)), 0),
        ].forEach((amount, i) => {
          const cell = ws.getCell(row, 7 + i);
          cell.value = amount;
          cell.numFmt = '#,##0.00';
          cell.font = {
            bold: true,
            size: 12,
            color: { argb: showBalance && i === 3 ? 'FFB91C1C' : 'FF155E30' },
          };
          cell.alignment = { horizontal: 'right' };
        });
      };

      buildSheet('NOT FULLY PAID', unpaid, true);
      buildSheet('FULLY PAID', paid, false);
      if (withdrawn.length) buildSheet('WITHDRAWN', withdrawn, true);
      if (scholars.length) buildSheet('SCHOLARS', scholars, true, byScholarshipThenCourse);

      const buf = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `${fileStem}.xlsx`
      );
    } catch (e) {
      setError(e.message || 'Failed to export the report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-(--dominant-red) text-white px-6 py-5 flex items-start justify-between shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold heading-bold">Payment Status Report</h2>
                  <p className="text-white/80 text-sm">Enrolled students by course and year level · {termLabel}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs, term filters, search and export */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 shrink-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => startTransition(() => setTab('unpaid'))}
                  className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    tab === 'unpaid' ? 'bg-(--dominant-red) text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  Not Fully Paid ({unpaid.length})
                </button>
                <button
                  onClick={() => startTransition(() => setTab('paid'))}
                  className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    tab === 'paid' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Fully Paid ({paid.length})
                </button>
                <button
                  onClick={() => startTransition(() => setTab('scholars'))}
                  className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    tab === 'scholars' ? 'bg-amber-700 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="City Scholars and Student Assistants, listed here instead of in the paid and unpaid lists"
                >
                  <GraduationCap className="w-4 h-4" />
                  Scholars ({scholars.length})
                </button>
                <button
                  onClick={() => startTransition(() => setTab('withdrawn'))}
                  className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    tab === 'withdrawn' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Kept out of the paid and unpaid figures — these students are no longer studying"
                >
                  <UserMinus className="w-4 h-4" />
                  Withdrawn ({withdrawn.length})
                </button>
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search name, ID or course..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={loading || isExporting || rows.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white cursor-pointer shrink-0"
                  >
                    {isExporting
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <Download className="w-4 h-4 mr-2" />}
                    Export
                    <ChevronDown className="w-4 h-4 ml-1.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuItem onSelect={() => handleExportPdf('unpaid')} className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2 shrink-0" />
                    <span>
                      PDF — Not Fully Paid ({unpaid.length})
                      <span className="block text-xs text-gray-500">
                        {['withdrawn', 'scholars']
                          .filter(key => SHEETS[key].rows.length)
                          .map(key => `${SHEETS[key].name} (${SHEETS[key].rows.length})`)
                          .join(' and ') || 'No withdrawn students or scholars'}
                        {['withdrawn', 'scholars'].some(key => SHEETS[key].rows.length)
                          ? ' follow, each on a new page'
                          : ''}
                      </span>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleExportPdf('paid')} className="cursor-pointer">
                    <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                    <span>
                      PDF — Fully Paid ({paid.length})
                      <span className="block text-xs text-gray-500">Its own file, on its own</span>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleExport} className="cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2 shrink-0" />
                    <span>
                      Excel — one workbook
                      <span className="block text-xs text-gray-500">
                        A worksheet per list, with the full fee breakdown
                      </span>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>

              {/* Term filters — balances always belong to a student's current term */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filter by</span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-52 justify-between bg-white cursor-pointer">
                      {schoolYear === 'all' ? 'All School Years' : schoolYear}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => startTransition(() => setSchoolYear('all'))}>All School Years</DropdownMenuItem>
                    {schoolYearOptions.map(sy => (
                      <DropdownMenuItem key={sy} onSelect={() => startTransition(() => setSchoolYear(sy))}>{sy}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-52 justify-between bg-white cursor-pointer">
                      {semester === 'all' ? 'All Semesters' : semester}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => startTransition(() => setSemester('all'))}>All Semesters</DropdownMenuItem>
                    {semesterOptions.map(sem => (
                      <DropdownMenuItem key={sem} onSelect={() => startTransition(() => setSemester(sem))}>{sem}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {(schoolYear !== 'all' || semester !== 'all') && (
                  <button
                    onClick={() => startTransition(() => { setSchoolYear('all'); setSemester('all'); })}
                    className="text-sm text-gray-500 hover:text-gray-800 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                <span className="ml-auto text-sm text-gray-500">
                  {termRows.length} student{termRows.length === 1 ? '' : 's'} in view
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-[320px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  Loading payment records…
                </div>
              ) : error ? (
                <div className="py-16 text-center text-red-500">{error}</div>
              ) : visibleGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Users className="w-12 h-12 mb-3 opacity-40" />
                  <p className="font-medium text-gray-500">No students to show here.</p>
                </div>
              ) : (
                <div className={isPending ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  <BalancesList groups={visibleGroups} showBalance={tab === 'unpaid'} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 rounded-b-2xl">
              <div className="flex items-center gap-3 text-gray-500 text-sm">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Showing {visibleCount} of {activeRows.length} student{activeRows.length === 1 ? '' : 's'}
                </span>
                {unbilledCount > 0 && (
                  <span
                    className="flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold"
                    title="A billing record exists but no fees have been entered, so these students cannot owe or have paid anything yet"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {unbilledCount} not yet assessed
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-7">
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Collected</div>
                  <div className="text-xl font-extrabold text-green-700 leading-tight">{peso(termCollected)}</div>
                  <div className="text-[11px] text-gray-400">
                    {peso(collectedTotal)} from the {activeRows.length} shown
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</div>
                  <div className="text-2xl font-extrabold text-(--dominant-red) leading-tight">{peso(termOutstanding)}</div>
                  <div className="text-[11px] text-gray-400">
                    across {termRows.length} student{termRows.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentBalancesModal;
