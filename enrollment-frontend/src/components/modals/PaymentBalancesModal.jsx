import React, { useState, useEffect, useMemo, useCallback, useTransition, useDeferredValue, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  X, Loader2, Download, Wallet, CheckCircle2, AlertCircle, Users, Search, ChevronDown
} from 'lucide-react';
import { paymentAPI } from '../../services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Payment status report: enrolled students split into those who still owe money
 * and those who are fully paid, grouped by course and year level.
 *
 * The balance is worked out exactly the way the Term Payment modal does:
 *   total     = previous account + registration + tuition + laboratory
 *               + miscellaneous + other + bundled program fees
 *   remaining = total − discount deduction − down payment − term payments
 *               recorded for the student's current year / semester / school year
 * A negative remainder means an advance payment, so it counts as fully paid.
 */

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const num = (v) => {
  const parsed = parseFloat(v);
  return Number.isFinite(parsed) ? parsed : 0;
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

const computeRemaining = (payment, student) => {
  if (!payment) return null; // no billing record yet

  const total =
    num(payment.previous_account) +
    num(payment.registration_fee) +
    num(payment.tuition_fee) +
    num(payment.laboratory_fee) +
    num(payment.miscellaneous_fee) +
    num(payment.other_fees) +
    num(payment.bundled_program_fee);

  // Only payments stamped with the student's current term count against it
  const termPaid = (payment.term_payments || [])
    .filter(t =>
      t.year === student.year &&
      t.semester === student.semester &&
      t.school_year === student.school_year
    )
    .reduce((sum, t) => sum + num(t.amount), 0);

  const remaining = total - num(payment.discount_deduction) - num(payment.payment_amount) - termPaid;
  return Math.round(remaining * 100) / 100;
};

/** Groups rows by course, then by year level, both in a sensible order. */
const groupRows = (rows) => {
  const byCourse = new Map();

  rows.forEach(row => {
    const course = row.course || 'Unassigned Course';
    if (!byCourse.has(course)) byCourse.set(course, new Map());

    const byYear = byCourse.get(course);
    const year = row.year || 'Unspecified Year';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(row);
  });

  return [...byCourse.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([course, byYear]) => ({
      course,
      total: [...byYear.values()].flat().reduce((sum, r) => sum + (r.remaining || 0), 0),
      count: [...byYear.values()].flat().length,
      years: [...byYear.entries()]
        .sort((a, b) => yearRank(a[0]) - yearRank(b[0]) || a[0].localeCompare(b[0]))
        .map(([year, students]) => ({
          year,
          students: students.sort((a, b) => a.name.localeCompare(b.name)),
          total: students.reduce((sum, r) => sum + (r.remaining || 0), 0),
        })),
    }));
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
        <div key={group.course}>
          {/* Course header */}
          <div className="sticky top-0 z-10 bg-(--dominant-red) text-white px-6 py-2.5 flex items-center justify-between">
            <span className="font-bold text-sm uppercase tracking-wide">{group.course}</span>
            <span className="text-xs text-white/85">
              {group.count} student{group.count === 1 ? '' : 's'}
              {showBalance && ` · ${peso(group.total)}`}
            </span>
          </div>

          {group.years.map(yearGroup => (
            <div key={`${group.course}-${yearGroup.year}`}>
              {/* Year header */}
              <div className="bg-gray-100 px-6 py-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase">{yearGroup.year}</span>
                <span className="text-xs text-gray-500">
                  {yearGroup.students.length}
                  {showBalance && ` · ${peso(yearGroup.total)}`}
                </span>
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {yearGroup.students.map((student, i) => (
                    <tr key={student.id} className="border-t border-gray-50 hover:bg-(--whitish-pink)/40">
                      <td className="px-6 py-2.5 text-gray-400 w-10">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-gray-800">{student.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{student.studentId}</div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{student.course}</td>
                      <td className="px-6 py-2.5 text-right whitespace-nowrap">
                        {!student.hasRecord ? (
                          <span className="text-xs font-semibold text-amber-600">No payment record</span>
                        ) : showBalance ? (
                          <span className="font-bold text-(--dominant-red)">{peso(student.remaining)}</span>
                        ) : (
                          <span className="text-xs font-semibold text-green-700">Fully Paid</span>
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
      .filter(s => String(s.enrollment_status || '').toLowerCase() === 'enrolled')
      .map(s => {
        const remaining = computeRemaining(paymentByStudent.get(s.id), s);
        return {
          id: s.id,
          studentId: s.student_id_number,
          name: (s.name || '').toUpperCase(),
          course: s.courseName || 'Unassigned Course',
          year: s.year || 'Unspecified Year',
          section: s.sectionName,
          schoolYear: s.school_year || 'Unspecified',
          semester: s.semester || 'Unspecified',
          remaining,
          hasRecord: remaining !== null,
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

  const { unpaid, paid } = useMemo(() => ({
    // A student with no billing record yet can't be called fully paid
    unpaid: termRows.filter(r => !r.hasRecord || r.remaining > 0.005),
    paid: termRows.filter(r => r.hasRecord && r.remaining <= 0.005),
  }), [termRows]);

  const activeRows = tab === 'unpaid' ? unpaid : paid;

  const visibleGroups = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const filtered = q
      ? activeRows.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.course.toLowerCase().includes(q) ||
          (r.studentId || '').toLowerCase().includes(q))
      : activeRows;
    return groupRows(filtered);
  }, [activeRows, deferredSearch]);

  const visibleCount = visibleGroups.reduce((sum, g) => sum + g.count, 0);
  const outstandingTotal = unpaid.reduce((sum, r) => sum + (r.remaining || 0), 0);

  // Shown in the modal and written into the exported file so a saved report
  // always says which term it covers
  const termLabel = [
    schoolYear === 'all' ? 'All School Years' : schoolYear,
    semester === 'all' ? 'All Semesters' : semester,
  ].join(' · ');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'VIPC Enroll';
      wb.created = new Date();

      const buildSheet = (name, list, showBalance) => {
        const ws = wb.addWorksheet(name);
        ws.getColumn(1).width = 6;
        ws.getColumn(2).width = 18;
        ws.getColumn(3).width = 38;
        ws.getColumn(4).width = 38;
        ws.getColumn(5).width = 18;
        ws.getColumn(6).width = 18;

        const title = ws.getCell('A1');
        title.value = `VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE, INC. — ${name}`;
        title.font = { bold: true, size: 13, color: { argb: 'FF9C262C' } };
        ws.mergeCells('A1:F1');
        ws.getCell('A2').value =
          `Generated ${new Date().toLocaleString()} · ${termLabel} · ${list.length} student${list.length === 1 ? '' : 's'}`;
        ws.getCell('A2').font = { size: 10, color: { argb: 'FF6B7280' } };
        ws.mergeCells('A2:F2');

        let row = 4;
        groupRows(list).forEach(group => {
          const courseCell = ws.getCell(`A${row}`);
          courseCell.value = showBalance
            ? `${group.course} — ${group.count} student(s), outstanding ${peso(group.total)}`
            : `${group.course} — ${group.count} student(s)`;
          courseCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
          courseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B1A1E' } };
          ws.mergeCells(`A${row}:F${row}`);
          row++;

          group.years.forEach(yearGroup => {
            const yearCell = ws.getCell(`A${row}`);
            yearCell.value = showBalance
              ? `${yearGroup.year} (${yearGroup.students.length}) — ${peso(yearGroup.total)}`
              : `${yearGroup.year} (${yearGroup.students.length})`;
            yearCell.font = { bold: true, size: 11, color: { argb: 'FF374151' } };
            yearCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            ws.mergeCells(`A${row}:F${row}`);
            row++;

            const headers = ['No.', 'Student ID', 'Name', 'Course', 'Year', showBalance ? 'Remaining Balance' : 'Status'];
            headers.forEach((text, i) => {
              const cell = ws.getCell(row, i + 1);
              cell.value = text;
              cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
              cell.alignment = { horizontal: i === 5 ? 'right' : 'left', vertical: 'middle' };
            });
            row++;

            yearGroup.students.forEach((student, i) => {
              ws.getCell(row, 1).value = i + 1;
              ws.getCell(row, 2).value = student.studentId || '';
              ws.getCell(row, 3).value = student.name;
              ws.getCell(row, 4).value = student.course;
              ws.getCell(row, 5).value = student.year;

              const last = ws.getCell(row, 6);
              if (!showBalance) {
                last.value = 'Fully Paid';
              } else if (!student.hasRecord) {
                last.value = 'No payment record';
              } else {
                last.value = student.remaining;
                last.numFmt = '#,##0.00';
                last.font = { bold: true, color: { argb: 'FFB91C1C' } };
              }
              last.alignment = { horizontal: 'right' };
              row++;
            });

            row++; // blank line between year groups
          });
        });

        if (showBalance) {
          const totalLabel = ws.getCell(`E${row}`);
          totalLabel.value = 'TOTAL OUTSTANDING';
          totalLabel.font = { bold: true, size: 11 };
          totalLabel.alignment = { horizontal: 'right' };

          const totalCell = ws.getCell(`F${row}`);
          totalCell.value = list.reduce((sum, r) => sum + (r.remaining || 0), 0);
          totalCell.numFmt = '#,##0.00';
          totalCell.font = { bold: true, size: 12, color: { argb: 'FFB91C1C' } };
          totalCell.alignment = { horizontal: 'right' };
        }
      };

      buildSheet('NOT FULLY PAID', unpaid, true);
      buildSheet('FULLY PAID', paid, false);

      const buf = await wb.xlsx.writeBuffer();
      const stamp = new Date().toISOString().split('T')[0];
      saveAs(
        new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        // Keep the term in the file name so exports for different terms don't clash
        `Payment Status Report${schoolYear === 'all' ? '' : ` - ${schoolYear}`}${semester === 'all' ? '' : ` ${semester}`} - ${stamp}.xlsx`
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

              <Button
                onClick={handleExport}
                disabled={loading || isExporting || rows.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer shrink-0"
              >
                {isExporting
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Download className="w-4 h-4 mr-2" />}
                Export to Excel
              </Button>
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
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Users className="w-4 h-4" />
                Showing {visibleCount} of {activeRows.length} student{activeRows.length === 1 ? '' : 's'}
              </div>
              {tab === 'unpaid' && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Outstanding</span>
                  <span className="text-2xl font-extrabold text-(--dominant-red)">{peso(outstandingTotal)}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentBalancesModal;
