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
import circleLogo from '../../assets/circlelogo.jpg';
import { SLIP_HEIGHT, SLIP_WIDTH, drawBalanceSlip } from '@/lib/balanceSlip';

/**
 * The logo, converted once per session to something jsPDF can embed directly.
 *
 * Handing jsPDF the bundled asset URL also works, but only because it falls
 * back to a synchronous XHR — which blocks the tab for as long as the fetch
 * takes. Loading it properly costs one promise and nothing afterwards.
 */
let logoPromise = null;

const loadLogo = () => {
  if (logoPromise) return logoPromise;

  logoPromise = new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      try {
        // The slot is 11mm square, so 256px is already more than a 300dpi
        // printer can use. Scaling down here keeps the slip small enough to
        // reprint all day without filling the cashier's downloads folder.
        const size = Math.min(256, image.naturalWidth || 256);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);

        resolve({ data: canvas.toDataURL('image/jpeg', 0.92), format: 'JPEG' });
      } catch (error) {
        console.error('Balance slip logo could not be prepared', error);
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = circleLogo;
  });

  return logoPromise;
};

const safePart = (value) => String(value ?? '').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');

/**
 * Prints the student's statement of account on one crosswise third of a short
 * bond sheet — the strip the cashier's office already cuts for counter use.
 */
const PrintBalanceSlip = ({ student, paymentData, termPayments = [], priorPayments = [] }) => {
  const [busy, setBusy] = useState(false);

  const build = async () => {
    const logo = await loadLogo();

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
