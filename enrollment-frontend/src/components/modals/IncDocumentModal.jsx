import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileDown, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadIncForms, SIGNATORIES } from '@/lib/incFormPdf';
import vineyardLogo from '@/assets/vineyard.png';
import { getEquivalentGrade } from '@/lib/gradeEquivalent';
import { transmuteGrade, usesTransmutation } from '@/lib/transmutation';

/**
 * Registrar's "Generate Document" view: pick which of a student's INC subjects
 * to issue, preview each completion form on screen, then export them as PDF —
 * one page per subject.
 */

const ordinal = (semester) => {
  if (!semester) return '';
  const match = String(semester).match(/1st|2nd|3rd|Summer/i);
  return match ? match[0] : semester;
};

/** Rating on the form: transmuted for DHT/SHS classes, equivalent otherwise. */
export const ratingForRecord = (record) => {
  if (record.final_grade === null || record.final_grade === undefined) return '';

  const pseudoStudent = [{
    courseCode: record.student?.course_code,
    courseName: record.student?.course_name,
    year: record.student?.year,
  }];

  return usesTransmutation(pseudoStudent, record.subject?.subject_code)
    ? String(transmuteGrade(record.final_grade))
    : String(getEquivalentGrade(record.final_grade) ?? '');
};

export const buildFormData = (record) => ({
  studentName: record.student?.name || '',
  college: 'VIPC',
  courseCode: record.student?.course_code || '',
  semesterOrdinal: ordinal(record.semester),
  schoolYear: record.school_year || '',
  incSemesterOrdinal: ordinal(record.semester),
  incSchoolYear: record.school_year || '',
  subjectCode: record.subject?.subject_code || '',
  descriptiveTitle: record.subject?.descriptive_title || '',
  rating: ratingForRecord(record),
  units: record.subject?.total_units ?? '',
  remarks: 'Passed',
  instructorName: record.instructor_name || '',
  orNumber: record.payment?.or_number || '',
  amount: record.payment?.amount || 0,
  paymentDate: record.payment?.payment_date || '',
});

const APPROVAL_LABELS = {
  cashier: 'Cashier',
  instructor: 'Instructor',
  program_head: 'Program Head',
  registrar: 'Registrar',
};

const IncDocumentModal = ({ isOpen, onClose, studentName, records = [] }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (isOpen) setSelectedIds(records.map(r => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const selected = useMemo(
    () => records.filter(r => selectedIds.includes(r.id)),
    [records, selectedIds]
  );

  const toggle = (id) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const allSelected = selectedIds.length === records.length && records.length > 0;

  const handleExport = async () => {
    const forms = selected.map(buildFormData);
    const safeName = (studentName || 'student').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    await downloadIncForms(forms, `INC_Completion_Form_${safeName}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
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
                <h2 className="text-xl font-bold heading-bold truncate">INC Completion Form</h2>
                <p className="text-white/80 text-sm truncate">{studentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg p-1.5 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subject picker */}
          <div className="px-6 py-4 border-b bg-gray-50/70 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Subjects to issue</span>
              <button
                onClick={() => setSelectedIds(allSelected ? [] : records.map(r => r.id))}
                className="text-sm text-(--dominant-red) hover:underline cursor-pointer"
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
              <span className="ml-auto text-sm text-gray-500">
                {selected.length} of {records.length} selected · one page each
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {records.map(record => {
                const active = selectedIds.includes(record.id);
                return (
                  <button
                    key={record.id}
                    onClick={() => toggle(record.id)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                      active
                        ? 'bg-(--dominant-red) text-white border-(--dominant-red)'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {record.subject?.subject_code}
                    {record.is_fully_approved
                      ? <CheckCircle2 className="inline w-3.5 h-3.5 ml-1.5 -mt-0.5" />
                      : <AlertTriangle className="inline w-3.5 h-3.5 ml-1.5 -mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable previews */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6 space-y-6">
            {selected.length === 0 ? (
              <div className="text-center py-16 text-gray-500">Select at least one subject to preview its form.</div>
            ) : selected.map(record => {
              const form = buildFormData(record);
              const missing = Object.entries(record.approvals || {})
                .filter(([, at]) => !at)
                .map(([step]) => APPROVAL_LABELS[step]);

              return (
                <div key={record.id} className="bg-white shadow-sm rounded-lg border mx-auto w-full max-w-3xl p-8 text-[13px] leading-relaxed">
                  {missing.length > 0 && (
                    <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      Still awaiting: {missing.join(', ')}. The form can be exported, but it is not yet complete.
                    </div>
                  )}

                  {/* Letterhead */}
                  <div className="border-b pb-4 mb-5">
                    <img src={vineyardLogo} alt="Vineyard International Polytechnic College" className="h-12 object-contain mx-auto" />
                    <p className="text-xs text-gray-600 mt-2 text-center">Prince Padi Bldg., A. Luna St., Cagayan de Oro City, Philippines 9000</p>
                    <p className="text-xs text-gray-600 text-center">Tel. Nos. (088) 856-8646; (08822) 72-94-19</p>
                  </div>

                  <p className="mb-2">
                    This is to certify that Mr./Ms. <u className="font-semibold">{form.studentName}</u> is/was
                    officially enrolled as <u className="font-semibold">{form.courseCode}</u>
                  </p>
                  <p className="mb-2">
                    Student in the College of <u className="font-semibold">{form.college}</u> during
                    the <u className="font-semibold">{form.semesterOrdinal}</u> Semester of School
                    Year <u className="font-semibold">{form.schoolYear}</u>.
                  </p>
                  <p className="mb-5">
                    This is to complete his/her INC mark of the subject enrolled during
                    the <u className="font-semibold">{form.incSemesterOrdinal}</u> Semester, School
                    Year <u className="font-semibold">{form.incSchoolYear}</u>.
                  </p>

                  <table className="w-full text-center mb-4">
                    <thead>
                      <tr className="text-xs text-gray-600">
                        <th className="pb-1 font-medium">Course Code</th>
                        <th className="pb-1 font-medium">Descriptive Title</th>
                        <th className="pb-1 font-medium">Rating</th>
                        <th className="pb-1 font-medium">Units</th>
                        <th className="pb-1 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-semibold">
                        <td className="border-b py-1">{form.subjectCode}</td>
                        <td className="border-b py-1 px-2">{form.descriptiveTitle}</td>
                        <td className="border-b py-1">{form.rating || '—'}</td>
                        <td className="border-b py-1">{form.units}</td>
                        <td className="border-b py-1">{form.remarks}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-xs text-gray-600 mb-1">
                    The above subject has been completed with the submission of the following hereto attached.
                  </p>
                  <div className="border-b border-gray-400 h-5 mb-4" />
                  <p className="text-xs text-gray-600 mb-6">This certification issued for submission to the Registrar's Office.</p>

                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <p className="text-xs text-gray-600 mb-6">Attested by:</p>
                      <p className="font-bold border-b border-gray-700 inline-block">{SIGNATORIES.programHead}</p>
                      <p className="text-xs text-gray-600">Program Head</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-6">Grade Given by:</p>
                      <p className="font-semibold border-b border-gray-700 inline-block">{form.instructorName || '—'}</p>
                      <p className="text-xs text-gray-600">Signature over printed name of Instructor</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-6">Approved by:</p>
                      <p className="font-bold border-b border-gray-700 inline-block">{SIGNATORIES.registrar}</p>
                      <p className="text-xs text-gray-600">College Registrar</p>
                    </div>
                  </div>

                  {form.orNumber && (
                    <p className="text-xs text-gray-500 border-t pt-3">
                      O.R. No. <span className="font-mono font-semibold">{form.orNumber}</span> ·
                      Amount: ₱{Number(form.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {form.paymentDate ? ` · Paid: ${form.paymentDate}` : ''} · Received by: {SIGNATORIES.cashier}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t bg-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-gray-500">The PDF prints one completion form per selected subject.</p>
            <div className="flex gap-3 shrink-0">
              <Button variant="outline" onClick={onClose} className="cursor-pointer">Close</Button>
              <Button
                onClick={handleExport}
                disabled={selected.length === 0}
                className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer min-w-[160px]"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export {selected.length > 1 ? `${selected.length} Forms` : 'as PDF'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IncDocumentModal;
