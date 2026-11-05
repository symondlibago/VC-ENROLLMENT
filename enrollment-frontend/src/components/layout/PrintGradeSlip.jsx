import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, FileText, Loader2, Printer } from 'lucide-react';
import {
  SLIP_HEIGHT, SLIP_WIDTH, drawGradeSlip, slipRow, surnameOf, termLine, termParts,
} from '@/lib/gradeSlip';
import { loadSchoolLogo } from '@/lib/schoolLogo';
import { loadSignatures } from '@/lib/signatures';

// Hyphens are kept so a school year stays readable as 2026-2027
const safePart = (value) => String(value ?? '').replace(/[^a-z0-9-]+/gi, '_').replace(/^_+|_+$/g, '');

/**
 * Prints the student's grade slip on half a short bond sheet, cut crosswise —
 * the slip the registrar's office already issues over the counter.
 *
 * Takes the rows exactly as the modal is showing them, so what is on screen
 * and what comes out of the printer cannot disagree.
 */
const PrintGradeSlip = ({ student, grades = [], schoolYear = '', year }) => {
  const [busy, setBusy] = useState(false);

  // A school year picked by hand wins: most grades were recorded before the
  // column existed, so the rows frequently cannot answer for themselves
  const term = termLine(grades, schoolYear);
  // Not `year` — that prop is the student's year level, not the school year
  const { semester, year: termYear } = termParts(grades, schoolYear);

  // Filed the way the office looks one up: whose it is, then which term
  const fileName = ['Grade_Slip', safePart(surnameOf(student?.name)), safePart(semester), safePart(termYear)]
    .filter(Boolean)
    .join('_')
    .concat('.pdf');

  const run = async (mode) => {
    if (busy || grades.length === 0) return;
    setBusy(true);

    try {
      const [logo, signatures] = await Promise.all([loadSchoolLogo(), loadSignatures()]);

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [SLIP_WIDTH, SLIP_HEIGHT],
      });

      drawGradeSlip(doc, {
        student,
        rows: grades.map((grade) => slipRow(grade, year)),
        term,
        logo,
        signatures,
      });

      if (mode === 'save') {
        doc.save(fileName);
        return;
      }

      doc.autoPrint();
      const opened = window.open(doc.output('bloburl'), '_blank');

      // A blocked pop-up would otherwise look like the button did nothing
      if (!opened) {
        doc.save(fileName);
      }
    } catch (error) {
      console.error('Grade slip could not be generated', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={busy || grades.length === 0}
          className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2 cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Grade Slip
          <ChevronDown className="w-4 h-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white border shadow-md">
        <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
          {grades.length} subject{grades.length === 1 ? '' : 's'}
          {term ? ` — ${term}` : ''}
          <span className="block text-[11px] text-gray-400">8.5&quot; &times; 5.5&quot; half sheet</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 p-2" onClick={() => run('print')}>
          <Printer className="w-4 h-4 mr-2" />
          Print now
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 p-2" onClick={() => run('save')}>
          <Download className="w-4 h-4 mr-2" />
          Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrintGradeSlip;
