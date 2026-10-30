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
import { ChevronDown, Download, Loader2, Printer, ReceiptText } from 'lucide-react';
import { SLIP_HEIGHT, SLIP_WIDTH, drawBalanceSlip } from '@/lib/balanceSlip';
import { loadSchoolLogo } from '@/lib/schoolLogo';

const safePart = (value) => String(value ?? '').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');

/**
 * Prints the student's statement of account on one crosswise third of a short
 * bond sheet — the strip the cashier's office already cuts for counter use.
 */
const PrintBalanceSlip = ({ student, paymentData, termPayments = [], priorPayments = [] }) => {
  const [busy, setBusy] = useState(false);

  const build = async () => {
    const logo = await loadSchoolLogo();

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [SLIP_WIDTH, SLIP_HEIGHT],
    });

    drawBalanceSlip(doc, { student, paymentData, termPayments, priorPayments, logo });

    return doc;
  };

  const fileName = [
    'Balance',
    safePart(student?.last_name),
    safePart(student?.school_year),
    safePart(student?.semester),
  ]
    .filter(Boolean)
    .join('_')
    .concat('.pdf');

  const run = async (mode) => {
    if (busy) return;
    setBusy(true);

    try {
      const doc = await build();

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
      console.error('Balance slip could not be generated', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={busy || !student}
          className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 h-auto flex items-center gap-2 cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ReceiptText className="w-4 h-4" />}
          Balance Slip
          <ChevronDown className="w-4 h-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 bg-white border shadow-md">
        <DropdownMenuLabel className="text-xs text-gray-500">
          Statement of account — 8.5&quot; &times; 3.67&quot; strip
        </DropdownMenuLabel>
        <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 p-2" onClick={() => run('print')}>
          <Printer className="w-4 h-4 mr-2" />
          Print now
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 p-2" onClick={() => run('save')}>
          <Download className="w-4 h-4 mr-2" />
          Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrintBalanceSlip;
