import React from 'react';
import { motion } from 'framer-motion';
import { X, FileDown, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import circleLogo from '@/assets/circlelogo.jpg';
import { downloadCredentialForms, SIGNATORIES } from '@/lib/credentialFormPdf';
import { CREDENTIAL_ROWS, STEPS, longDate } from '@/lib/credentialOptions';

/**
 * The soft copy of VIPC-RO-15: the request as filed, the clearances it
 * collected and the claim stub — previewed on screen, then exported as PDF.
 */

/** Shapes a request for the printed form. */
export const buildCredentialForm = (request) => {
  const entries = {};
  let othersText = '';

  (request.credentials ?? []).forEach((line) => {
    if (line.type === 'others') {
      othersText = [line.label, line.pages ? `${line.pages} page${Number(line.pages) === 1 ? '' : 's'}` : '', line.remarks]
        .filter(Boolean)
        .join(' — ');
      return;
    }
    entries[line.type] = { pages: line.pages, remarks: line.remarks };
  });

  const clearance = {};
  STEPS.forEach(({ key }) => {
    if (request.approvals?.[key]) {
      clearance[key] = {
        name: request.approval_names?.[key] || '✓',
        date: request.approvals[key].split(' ')[0],
      };
    }
  });

  return {
    requestNumber: request.request_number,
    // The form is dated when it is issued
    date: longDate(request.claim?.released_at?.split(' ')[0] || request.requested_on),
    studentName: request.student?.name || '',
    course: request.student?.course || '',
    semester: request.student?.semester || '',
    schoolYear: request.student?.school_year || '',
    entries,
    othersText,
    purposeText: (request.purpose_labels ?? []).join(', '),
    clearance,
    claim: {
      name: request.student?.name || '',
      course: request.student?.course || '',
      requestedOn: longDate(request.requested_on),
      claimOn: request.claim?.date ? longDate(request.claim.date) : '',
    },
  };
};

/** The value printed on a credential's line. */
const lineValue = (entry) => {
  if (!entry) return '';
  const parts = [];
  if (entry.pages) parts.push(`${entry.pages} page${Number(entry.pages) === 1 ? '' : 's'}`);
  if (entry.remarks) parts.push(entry.remarks);
  return parts.join(' — ') || '✓';
};

const FilledLine = ({ value, className = '' }) => (
  <span className={`inline-block border-b border-gray-700 align-bottom px-1 ${className}`}>
    {value || <span>&nbsp;</span>}
  </span>
);

const ClearanceLine = ({ label, signed }) => (
  <div className="flex items-end gap-2">
    <span className="whitespace-nowrap">{label}</span>
    <span className="flex-1 border-b border-gray-700 text-center text-[11px] leading-tight">
      {signed ? (
        <>
          <span className="font-semibold">{signed.name}</span>
          <span className="block text-[9px] text-gray-500">{signed.date}</span>
        </>
      ) : <>&nbsp;</>}
    </span>
  </div>
);

const CredentialDocumentModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  const form = buildCredentialForm(request);
  const pending = STEPS.filter((step) => !request.approvals?.[step.key]).map((step) => step.label);

  const handleExport = async () => {
    const safeName = (request.student?.name || 'student')
      .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    await downloadCredentialForms([form], `Credential_Request_${safeName}_${request.request_number}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-(--dominant-red) text-white px-6 py-5 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold heading-bold truncate">Credential Request Form</h2>
              <p className="text-white/80 text-sm truncate">
                {request.request_number} · {request.student?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg p-1.5 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto bg-gray-100 p-6">
          {pending.length > 0 && (
            <div className="mb-4 mx-auto max-w-3xl flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              Still awaiting: {pending.join(', ')}. The form can be exported, but the clearance is not complete.
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg border mx-auto w-full max-w-3xl p-10 text-[12px] leading-relaxed text-gray-900">
            {/* Letterhead */}
            <div className="flex items-center gap-4 pb-3">
              <img src={circleLogo} alt="VIPC" className="w-20 h-20 object-contain shrink-0" />
              <div className="flex-1 text-center">
                <p className="font-bold text-[15px] tracking-tight">VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE</p>
                <p className="text-[11px]">Prince Padi Bldg., A. Luna Street, Mabulay Subdivision</p>
                <p className="text-[11px]">Cagayan de Oro City, Philippines 9000</p>
                <p className="text-[11px]">Tel. Nos. (088) 856-8646 / (08822) 729-419</p>
                <p className="text-[11px]">E-mail Address: vipc_cdo07@yahoo.com.ph</p>
              </div>
            </div>
            <div className="border-b-2 border-gray-800 mb-6" />

            <p className="mb-5 pl-10">CREDENTIAL REQUEST FORM</p>

            <div className="flex justify-end mb-5">
              <span>Date:&nbsp;</span>
              <FilledLine value={form.date} className="min-w-[170px] text-center" />
            </div>

            <p className="mb-1">
              I <FilledLine value={form.studentName} className="min-w-[240px] text-center font-semibold" />
              {' '}with a course of <FilledLine value={form.course} className="min-w-[120px] text-center font-semibold" />
              {' '}in the
            </p>
            <p className="mb-5">
              <FilledLine value={form.semester} className="min-w-[70px] text-center" /> semester, Academic Year{' '}
              <FilledLine value={form.schoolYear} className="min-w-[110px] text-center" /> will request the following:
            </p>

            {/* Credential lines */}
            <div className="space-y-1.5 mb-4">
              {CREDENTIAL_ROWS.map(([key, label]) => (
                <div key={key} className="flex items-end gap-2">
                  <span className="w-[200px] shrink-0">{label}</span>
                  <span>:</span>
                  <span className="flex-1 border-b border-gray-700 px-1">
                    {lineValue(form.entries[key]) || <>&nbsp;</>}
                  </span>
                </div>
              ))}

              <div className="flex items-end gap-2">
                <span className="w-[80px] shrink-0">Others</span>
                <span className="whitespace-nowrap">Please Specify:</span>
                <span className="flex-1 border-b border-gray-700 px-1">{form.othersText || <>&nbsp;</>}</span>
              </div>

              <div className="flex items-end gap-2 pl-[80px]">
                <span className="whitespace-nowrap">Purpose:</span>
                <span className="flex-1 border-b border-gray-700 px-1">{form.purposeText || <>&nbsp;</>}</span>
              </div>
            </div>

            {/* Clearance */}
            <p className="font-bold underline mt-6 mb-3">Clearance</p>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 mb-6">
              <ClearanceLine label="Finance Officer/Cashier:" signed={form.clearance.cashier} />
              <ClearanceLine label="Laboratory:" signed={form.clearance.laboratory} />
              <ClearanceLine label="Librarian:" signed={form.clearance.librarian} />
              <ClearanceLine label="Registrar:" signed={form.clearance.registrar} />
              <ClearanceLine label="Program Head:" signed={form.clearance.program_head} />
            </div>

            {/* Claim stub */}
            <div className="border-t border-dashed border-gray-500 pt-4 mt-6">
              <p className="text-center mb-4">CLAIM STUB</p>

              <div className="flex items-end gap-2 mb-3">
                <span>Name:</span>
                <span className="flex-1 border-b border-gray-700 px-1 font-semibold">{form.claim.name || <>&nbsp;</>}</span>
                <span className="ml-4">Course:</span>
                <span className="w-[140px] border-b border-gray-700 px-1">{form.claim.course || <>&nbsp;</>}</span>
              </div>

              <div className="flex items-end gap-2">
                <span>Requested on:</span>
                <span className="w-[160px] border-b border-gray-700 px-1 text-center">{form.claim.requestedOn || <>&nbsp;</>}</span>
                <span className="ml-6">Please claim on:</span>
                <span className="flex-1 border-b border-gray-700 px-1 text-center font-semibold">
                  {form.claim.claimOn || <>&nbsp;</>}
                </span>
              </div>
            </div>

            {/* Release */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <p className="mb-6">Released by:</p>
                <p className="font-bold border-b border-gray-700 inline-block">{SIGNATORIES.registrar}</p>
                <p className="italic text-[11px] pl-4">School Registrar</p>
              </div>
              <div className="self-end">
                <div className="flex items-end gap-2">
                  <span>Received by:</span>
                  <span className="flex-1 border-b border-gray-700">&nbsp;</span>
                </div>
                <p className="text-[10px] text-center mt-1">Signature over Printed Name</p>
              </div>
            </div>

            {/* Form identifiers */}
            <div className="flex justify-between items-end mt-10 text-[10px] text-gray-600">
              <div>
                <p className="italic text-[11px]">VIPC-RO-15</p>
                <p className="text-gray-400 mt-1">Ref. {form.requestNumber}</p>
              </div>
              <div className="text-right">
                <p>Revision code: 0</p>
                <p>Issue date: February 2009</p>
              </div>
            </div>

            <p className="text-center font-bold mt-8 text-[11px]">
              “We measure our success in terms of our graduates’ gainful employment.”
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-gray-500">
            The PDF keeps the soft copy of this request, with the clearances it has collected.
          </p>
          <div className="flex gap-3 shrink-0">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">Close</Button>
            <Button onClick={handleExport} className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer min-w-[150px]">
              <FileDown className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CredentialDocumentModal;
