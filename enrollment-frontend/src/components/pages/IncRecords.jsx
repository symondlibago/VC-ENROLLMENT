import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileWarning, Search, Loader2, CheckCircle2, Clock, Wallet,
  FileText, X, AlertCircle, Undo2, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { incAPI, authAPI } from '@/services/api';
import SuccessAlert from '../modals/SuccessAlert';
import IncDocumentModal from '../modals/IncDocumentModal';

/**
 * INC records: every incomplete mark a student has to settle, and the desks it
 * has to pass — cashier (payment), instructor, program head, then registrar,
 * who issues the completion form.
 */

const peso = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLES = {
  awaiting_payment: { label: 'Awaiting Payment', className: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Withdrawn', className: 'bg-gray-100 text-gray-600' },
};

const STEPS = [
  { key: 'cashier', label: 'Cashier' },
  { key: 'instructor', label: 'Instructor' },
  { key: 'program_head', label: 'Program Head' },
  { key: 'registrar', label: 'Registrar' },
];

// Which approval a role is responsible for; Admin may act for any desk
const ROLE_STEP = {
  Cashier: 'cashier',
  instructor: 'instructor',
  'Program Head': 'program_head',
  Registrar: 'registrar',
};

/**
 * Cashier's payment form. A student may have several INC subjects on one
 * receipt, and may choose to settle only some of them — so the subjects are
 * picked here, each with its own amount, sharing one O.R. number and date.
 */
const PaymentModal = ({ isOpen, onClose, student, records = [], onSubmit, isSaving }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [amount, setAmount] = useState('');
  const [orNumber, setOrNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  // Only subjects that have not been paid yet can be processed
  const payable = useMemo(
    () => records.filter(r => r.status !== 'cancelled' && !r.approvals?.cashier),
    [records]
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(payable.map(r => r.id));
      setAmount('');
      setOrNumber('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const toggle = (id) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const chosen = payable.filter(r => selectedIds.includes(r.id));
  const total = parseFloat(amount) || 0;

  /**
   * The receipt carries one total, but each subject keeps its own share so
   * reports never count the same money twice. The total is split evenly, with
   * any odd centavo going to the first subject.
   */
  const splitAmounts = () => {
    const count = chosen.length;
    const cents = Math.round(total * 100);
    const base = Math.floor(cents / count);
    const remainder = cents - base * count;

    return chosen.map((record, i) => ({
      id: record.id,
      amount: (base + (i === 0 ? remainder : 0)) / 100,
    }));
  };

  const perSubject = chosen.length > 0 && total > 0 ? total / chosen.length : 0;

  const submit = () => {
    if (chosen.length === 0) return setError('Select at least one subject to pay for.');
    if (!total || total <= 0) return setError('Enter the amount paid.');
    if (!orNumber.trim()) return setError('Enter the O.R. number.');

    onSubmit({
      or_number: orNumber.trim(),
      payment_date: date,
      items: splitAmounts(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="bg-(--dominant-red) text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <h2 className="text-lg font-bold heading-bold">Process INC Payment</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/15 rounded-lg p-1 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="rounded-lg bg-gray-50 border p-3 text-sm">
            <p className="font-semibold text-gray-900 uppercase">{student?.name}</p>
            <p className="text-xs text-gray-500 font-mono">{student?.student_id_number}</p>
          </div>

          {payable.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Every INC subject for this student has already been paid.
            </p>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Subjects being paid ({chosen.length} of {payable.length})
              </label>
              <div className="mt-2 space-y-2">
                {payable.map(record => {
                  const isOn = selectedIds.includes(record.id);
                  return (
                    <label
                      key={record.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        isOn ? 'border-(--dominant-red) bg-red-50/40' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => toggle(record.id)}
                        className="mt-1 w-4 h-4 accent-red-800 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{record.subject?.subject_code}</p>
                        <p className="text-xs text-gray-500 truncate">{record.subject?.descriptive_title}</p>
                        <p className="text-xs text-gray-400">{record.school_year} · {record.semester}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Amount Paid</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
              <Input
                type="number" min="0" step="0.01" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7 h-11 text-base font-semibold border-2 border-gray-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
              />
            </div>
            {chosen.length > 1 && total > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Total for {chosen.length} subjects — recorded as {peso(perSubject)} each.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">O.R. Number</label>
            <Input
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              placeholder="e.g. 9613"
              className="mt-1 h-11 text-base font-semibold border-2 border-gray-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
            />
            <p className="text-xs text-gray-400 mt-1">Shared by every subject on this receipt.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Payment Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 h-11 text-base border-2 border-gray-300 focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Recording the payment also files the cashier's approval for the selected subjects.
          </p>
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
          <Button
            onClick={submit}
            disabled={isSaving || payable.length === 0}
            className="bg-green-600 hover:bg-green-700 cursor-pointer min-w-[140px]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Process ${chosen.length || ''}`.trim()}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Confirmation before an approval is filed (or withdrawn) — an approval is a
 * signature on an official form, so it shouldn't happen on a stray click.
 */
const ApprovalConfirmModal = ({ isOpen, action, onClose, onConfirm, isSaving }) => {
  if (!isOpen || !action) return null;

  const { record, step, mode } = action;
  const stepLabel = STEPS.find(s => s.key === step)?.label ?? step;
  const isRevoke = mode === 'revoke';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className={`px-6 py-4 flex items-center gap-2 text-white ${isRevoke ? 'bg-amber-600' : 'bg-green-600'}`}>
          {isRevoke ? <Undo2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          <h2 className="text-lg font-bold heading-bold">
            {isRevoke ? `Withdraw ${stepLabel} approval` : `Approve as ${stepLabel}`}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            {isRevoke ? (
              <>
                You are about to withdraw the <b>{stepLabel}</b> approval. Any approvals that
                came after it will be withdrawn too, so the form has to be signed off again.
              </>
            ) : (
              <>
                You are signing off this INC completion as <b>{stepLabel}</b>. Your name and the
                date are recorded on the form.
              </>
            )}
          </p>

          <div className="rounded-lg border bg-gray-50 p-4 text-sm space-y-1">
            <p className="font-semibold text-gray-900 uppercase">{record.student?.name}</p>
            <p className="text-xs text-gray-500 font-mono">{record.student?.student_id_number}</p>
            <div className="pt-2 border-t mt-2">
              <p className="font-medium text-gray-900">
                {record.subject?.subject_code} — {record.subject?.descriptive_title}
              </p>
              <p className="text-xs text-gray-500">
                {record.school_year} · {record.semester}
                {record.section ? ` · ${record.section}` : ''}
              </p>
              {record.instructor_name && (
                <p className="text-xs text-gray-500">Instructor: {record.instructor_name}</p>
              )}
            </div>
          </div>

          {!isRevoke && step === 'registrar' && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              This is the final approval — the record is marked completed and the completion form
              can be issued.
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={isSaving}
            className={`cursor-pointer min-w-[140px] text-white ${
              isRevoke ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isRevoke ? 'Withdraw approval' : `Approve as ${stepLabel}`}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const IncRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });
  const [paymentGroup, setPaymentGroup] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [documentStudent, setDocumentStudent] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // { record, step, mode }

  const toggleExpanded = (key) =>
    setExpanded(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const user = authAPI.getUserData();
  const role = user?.role;
  const isAdmin = role === 'Admin';
  const myStep = ROLE_STEP[role] || null;
  const canProcessPayment = isAdmin || role === 'Cashier';
  const canGenerate = isAdmin || role === 'Registrar';
  // Amounts and O.R. numbers are only the cashier's and registrar's business
  const canSeePayment = isAdmin || role === 'Cashier' || role === 'Registrar';

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await incAPI.getAll();
      setRecords(res.success ? res.data : []);
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || 'Failed to load INC records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const replaceRecord = (updated) =>
    setRecords(prev => prev.map(r => (r.id === updated.id ? updated : r)));

  const handlePayment = async (payload) => {
    setIsSaving(true);
    try {
      const res = await incAPI.processPaymentBulk(payload);
      (res.data || []).forEach(replaceRecord);
      setPaymentGroup(null);
      setAlert({ isVisible: true, message: res.message || 'Payment recorded.', type: 'success' });
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || 'Failed to process the payment.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  /** Runs the approval (or withdrawal) the confirmation dialog asked about. */
  const handleConfirmedAction = async () => {
    if (!confirmAction) return;
    const { record, step, mode } = confirmAction;

    setIsSaving(true);
    try {
      const res = mode === 'revoke'
        ? await incAPI.revoke(record.id, step)
        : await incAPI.approve(record.id, isAdmin ? step : undefined);

      replaceRecord(res.data);
      setConfirmAction(null);
      setAlert({
        isVisible: true,
        message: res.message || (mode === 'revoke' ? 'Approval withdrawn.' : 'Approval recorded.'),
        type: 'success',
      });
    } catch (e) {
      setAlert({
        isVisible: true,
        message: e.message || 'Failed to update the approval.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (r.student?.name || '').toLowerCase().includes(q) ||
        (r.student?.student_id_number || '').toLowerCase().includes(q) ||
        (r.subject?.subject_code || '').toLowerCase().includes(q) ||
        (r.subject?.descriptive_title || '').toLowerCase().includes(q)
      );
    });
  }, [records, search, statusFilter]);

  const counts = useMemo(() => ({
    awaiting: records.filter(r => r.status === 'awaiting_payment').length,
    processing: records.filter(r => r.status === 'processing').length,
    completed: records.filter(r => r.status === 'completed').length,
  }), [records]);

  // One row per student — a student with three INC subjects is one line, opened
  // up to act on each subject.
  const groups = useMemo(() => {
    const byStudent = new Map();

    visible.forEach(record => {
      const key = record.student?.id ?? record.student?.student_id_number ?? 'unknown';
      if (!byStudent.has(key)) {
        byStudent.set(key, { key, student: record.student, records: [] });
      }
      byStudent.get(key).records.push(record);
    });

    return [...byStudent.values()]
      .map(group => ({
        ...group,
        unpaid: group.records.filter(r => !r.approvals?.cashier && r.status !== 'cancelled').length,
        completed: group.records.filter(r => r.status === 'completed').length,
        totalPaid: group.records.reduce((sum, r) => sum + Number(r.payment?.amount || 0), 0),
      }))
      .sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''));
  }, [visible]);

  // Every INC this student still has, for the registrar's document modal
  const documentRecords = useMemo(() => {
    if (!documentStudent) return [];
    return records.filter(r => r.student?.id === documentStudent.id && r.status !== 'cancelled');
  }, [records, documentStudent]);

  /** Can this user approve this step right now? */
  const canApproveStep = (record, step) => {
    if (record.status === 'cancelled') return false;
    if (record.approvals?.[step]) return false;
    if (!isAdmin && myStep !== step) return false;
    if (step !== 'cashier' && !record.approvals?.cashier) return false;
    if (step === 'registrar' && !(record.approvals?.instructor && record.approvals?.program_head)) return false;
    return true;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <SuccessAlert
        isVisible={alert.isVisible}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isVisible: false })}
      />

      {/* Header */}
      <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
        <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
          <FileWarning className="w-8 h-8 text-(--dominant-red) mr-3" />
          INC Records
        </h1>
        <p className="text-gray-600 text-lg">
          Incomplete marks and their completion forms — payment, approvals and issuance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Awaiting Payment', value: counts.awaiting, icon: Clock, tint: 'bg-amber-100 text-amber-600' },
          { label: 'Processing', value: counts.processing, icon: Loader2, tint: 'bg-blue-100 text-blue-600' },
          { label: 'Completed', value: counts.completed, icon: CheckCircle2, tint: 'bg-green-100 text-green-600' },
        ].map(({ label, value, icon: Icon, tint }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-3xl font-bold heading-bold text-gray-900">{value}</p>
              </div>
              <div className={`p-4 rounded-full ${tint}`}><Icon className="w-7 h-7" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search student, ID or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-52 justify-between bg-white cursor-pointer">
                {statusFilter === 'all' ? 'All Statuses' : STATUS_STYLES[statusFilter]?.label}
                <span className="text-gray-400">▾</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setStatusFilter('all')}>All Statuses</DropdownMenuItem>
              {Object.entries(STATUS_STYLES).map(([key, s]) => (
                <DropdownMenuItem key={key} onSelect={() => setStatusFilter(key)}>{s.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading INC records…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileWarning className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium text-gray-500">No INC records to show.</p>
            <p className="text-sm">A record appears here as soon as a grade is marked INC.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">INC Subjects</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => {
                  const open = expanded.includes(group.key);
                  return (
                    <React.Fragment key={group.key}>
                      <tr
                        className="border-t hover:bg-gray-50/70 align-top cursor-pointer"
                        onClick={() => toggleExpanded(group.key)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <ChevronRight
                              className={`w-4 h-4 mt-0.5 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
                            />
                            <div>
                              <div className="font-semibold text-gray-900 uppercase">{group.student?.name}</div>
                              <div className="text-xs text-gray-400 font-mono">{group.student?.student_id_number}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{group.student?.course_code}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {group.records.map(record => {
                              const style = STATUS_STYLES[record.status] || STATUS_STYLES.awaiting_payment;
                              return (
                                <span
                                  key={record.id}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${style.className}`}
                                  title={`${record.subject?.descriptive_title} — ${style.label}`}
                                >
                                  {record.subject?.subject_code}
                                </span>
                              );
                            })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1.5">
                            {group.records.length} subject{group.records.length === 1 ? '' : 's'}
                            {group.completed > 0 && ` · ${group.completed} completed`}
                            {group.unpaid > 0 && ` · ${group.unpaid} unpaid`}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {canSeePayment && group.totalPaid > 0 && (
                            <div className="font-semibold text-gray-700">{peso(group.totalPaid)}</div>
                          )}
                          {group.unpaid > 0 ? (
                            canProcessPayment ? (
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setPaymentGroup(group); }}
                                className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer mt-1"
                              >
                                <Wallet className="w-3.5 h-3.5 mr-1.5" />
                                Process ({group.unpaid})
                              </Button>
                            ) : (
                              <span className="text-xs text-amber-700">{group.unpaid} not yet paid</span>
                            )
                          ) : (
                            <span className="text-xs text-green-700">All paid</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {canGenerate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); setDocumentStudent(group.student); }}
                              className="cursor-pointer bg-white hover:bg-red-50 hover:text-red-800 hover:border-red-800"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              Generate Document
                            </Button>
                          )}
                        </td>
                      </tr>

                      {/* Per-subject detail: approvals are given subject by subject */}
                      {open && group.records.map(record => {
                        const style = STATUS_STYLES[record.status] || STATUS_STYLES.awaiting_payment;
                        return (
                          <tr key={record.id} className="bg-gray-50/60 border-t border-gray-100 align-top">
                            <td className="px-6 py-3 pl-12">
                              <div className="font-medium text-gray-900">{record.subject?.subject_code}</div>
                              <div className="text-xs text-gray-500 max-w-[220px]">{record.subject?.descriptive_title}</div>
                              {record.section && <div className="text-xs text-blue-700 mt-0.5">{record.section}</div>}
                              <Badge className={`${style.className} mt-1.5 font-medium`}>{style.label}</Badge>
                            </td>

                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-500 mb-1.5">
                                {record.school_year} · {record.semester}
                                {record.instructor_name && ` · ${record.instructor_name}`}
                              </div>
                              {/* Approval trail: who has signed, who is next */}
                              <div className="rounded-lg border bg-white p-3">
                                <div className="flex flex-wrap items-stretch gap-2">
                                  {STEPS.map(step => {
                                    const approved = record.approvals?.[step.key];
                                    const canApprove = canApproveStep(record, step.key);

                                    return (
                                      <div
                                        key={step.key}
                                        className={`flex-1 min-w-[132px] rounded-lg border px-3 py-2 ${
                                          approved
                                            ? 'border-green-200 bg-green-50'
                                            : canApprove
                                              ? 'border-(--dominant-red) bg-red-50/40'
                                              : 'border-gray-200 bg-gray-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          {approved
                                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                            : <Clock className={`w-3.5 h-3.5 shrink-0 ${canApprove ? 'text-(--dominant-red)' : 'text-gray-400'}`} />}
                                          <span className={`text-xs font-semibold ${
                                            approved ? 'text-green-800' : canApprove ? 'text-(--dominant-red)' : 'text-gray-500'
                                          }`}>
                                            {step.label}
                                          </span>
                                          {approved && isAdmin && (
                                            <button
                                              onClick={() => setConfirmAction({ record, step: step.key, mode: 'revoke' })}
                                              className="ml-auto text-green-700/50 hover:text-amber-700 cursor-pointer"
                                              title="Withdraw this approval"
                                            >
                                              <Undo2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>

                                        {approved ? (
                                          <p className="text-[11px] text-green-700/80 mt-1">
                                            Approved {approved.split(' ')[0]}
                                          </p>
                                        ) : canApprove ? (
                                          <button
                                            onClick={() => setConfirmAction({ record, step: step.key, mode: 'approve' })}
                                            className="mt-1.5 w-full rounded-md bg-(--dominant-red) hover:bg-red-800 text-white text-xs font-semibold py-1.5 cursor-pointer transition-colors"
                                          >
                                            Approve
                                          </button>
                                        ) : (
                                          <p className="text-[11px] text-gray-400 mt-1">
                                            {step.key === 'cashier'
                                              ? 'Awaiting payment'
                                              : !record.approvals?.cashier
                                                ? 'Waiting for payment'
                                                : step.key === 'registrar'
                                                  ? 'Waiting for others'
                                                  : 'Pending'}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3" colSpan={2}>
                              {record.payment?.is_paid ? (
                                canSeePayment ? (
                                  <div className="text-gray-700 text-xs">
                                    <div className="font-semibold text-sm">{peso(record.payment.amount)}</div>
                                    <div className="text-gray-500">O.R. {record.payment.or_number}</div>
                                    <div className="text-gray-400">{record.payment.payment_date}</div>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-amber-700">Not yet paid</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PaymentModal
        isOpen={!!paymentGroup}
        student={paymentGroup?.student}
        records={paymentGroup?.records || []}
        onClose={() => setPaymentGroup(null)}
        onSubmit={handlePayment}
        isSaving={isSaving}
      />

      <ApprovalConfirmModal
        isOpen={!!confirmAction}
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmedAction}
        isSaving={isSaving}
      />

      <IncDocumentModal
        isOpen={!!documentStudent}
        onClose={() => setDocumentStudent(null)}
        studentName={documentStudent?.name}
        records={documentRecords}
      />
    </div>
  );
};

export default IncRecords;
