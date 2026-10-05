import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileSignature, Search, Loader2, CheckCircle2, Clock, Wallet, FileText, Plus,
  ChevronRight, Undo2, PackageCheck, Mail, MailCheck, Pencil, Ban, AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { credentialAPI, authAPI } from '@/services/api';
import SuccessAlert from '../modals/SuccessAlert';
import CredentialRequestFormModal from '../modals/CredentialRequestFormModal';
import CredentialReleaseModal from '../modals/CredentialReleaseModal';
import CredentialDocumentModal from '../modals/CredentialDocumentModal';
import {
  CredentialPaymentModal, CredentialApprovalConfirmModal,
} from '../modals/CredentialApprovalModals';
import {
  STEPS, STATUS_STYLES, ROLE_STEP, peso, longDate,
} from '@/lib/credentialOptions';

/**
 * Credential requests: every document a student has asked the registrar for,
 * and the desks it has to pass — library, laboratory and program head for
 * clearance, the cashier for payment, then the registrar, who releases it and
 * emails the claim stub.
 */

const CredentialRequests = () => {
  const [requests, setRequests] = useState([]);
  const [can, setCan] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState([]);
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [documentFor, setDocumentFor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { request, step, mode }

  const user = authAPI.getUserData();
  const role = user?.role;
  const isAdmin = role === 'Admin';
  const myStep = ROLE_STEP[role] || null;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await credentialAPI.getAll();
      setRequests(res.success ? res.data : []);
      setCan(res.can ?? {});
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || 'Failed to load credential requests.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const replaceRequest = (updated) =>
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const toggleExpanded = (id) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /** Wraps a call so every action reports the same way. */
  const run = async (action, { onSuccess, fallback } = {}) => {
    setIsSaving(true);
    try {
      const res = await action();
      if (res.data) replaceRequest(res.data);
      onSuccess?.(res);
      setAlert({ isVisible: true, message: res.message || 'Done.', type: 'success' });
      return res;
    } catch (e) {
      setAlert({ isVisible: true, message: e.message || fallback || 'Something went wrong.', type: 'error' });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRequest = async (payload) => {
    const res = await run(
      () => (editing ? credentialAPI.update(editing.id, payload) : credentialAPI.create(payload)),
      {
        onSuccess: (result) => {
          if (!editing && result.data) setRequests((prev) => [result.data, ...prev]);
          setFormOpen(false);
          setEditing(null);
        },
        fallback: 'Failed to save the request.',
      }
    );
    return res;
  };

  const handlePayment = (payload) =>
    run(() => credentialAPI.processPayment(paying.id, payload), {
      onSuccess: () => setPaying(null),
      fallback: 'Failed to process the payment.',
    });

  const handleRelease = (payload) =>
    run(() => credentialAPI.release(releasing.id, payload), {
      onSuccess: () => setReleasing(null),
      fallback: 'Failed to release the request.',
    });

  const handleConfirmedAction = (remarks) => {
    const { request, step, mode } = confirmAction;
    return run(
      () => (mode === 'revoke'
        ? credentialAPI.revoke(request.id, step)
        : credentialAPI.approve(request.id, isAdmin ? step : undefined, remarks)),
      { onSuccess: () => setConfirmAction(null), fallback: 'Failed to update the clearance.' }
    );
  };

  const handleResend = (request) =>
    run(() => credentialAPI.resendEmail(request.id), { fallback: 'Failed to send the claim stub.' });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (request.student?.name || '').toLowerCase().includes(q) ||
        (request.student?.student_id_number || '').toLowerCase().includes(q) ||
        (request.request_number || '').toLowerCase().includes(q) ||
        (request.credentials ?? []).some((line) => (line.label || '').toLowerCase().includes(q))
      );
    });
  }, [requests, search, statusFilter]);

  const counts = useMemo(() => ({
    clearance: requests.filter((r) => r.status === 'pending').length,
    payment: requests.filter((r) => r.status === 'awaiting_payment').length,
    release: requests.filter((r) => r.status === 'ready_to_release').length,
    released: requests.filter((r) => r.status === 'released').length,
  }), [requests]);

  /** Can this user sign this clearance right now? */
  const canSignStep = (request, step) => {
    if (request.status === 'cancelled' || request.approvals?.[step]) return false;
    if (!isAdmin && myStep !== step) return false;

    if (step === 'cashier') {
      return (can.process_payment ?? false) && (isAdmin || request.clearance_complete);
    }
    if (step === 'registrar') {
      return (can.release ?? false) && (isAdmin || request.payment?.is_paid);
    }
    return true; // library, laboratory and program head sign in any order
  };

  /** Why a desk cannot act yet, in the card. */
  const waitingLabel = (request, step) => {
    if (request.status === 'cancelled') return 'Cancelled';
    if (step === 'cashier') return request.clearance_complete ? 'Awaiting payment' : 'Waiting for clearance';
    if (step === 'registrar') return request.payment?.is_paid ? 'Ready to release' : 'Waiting for payment';
    return 'Pending clearance';
  };

  const openStepAction = (request, step) => {
    if (step === 'cashier') return setPaying(request);
    if (step === 'registrar') return setReleasing(request);
    return setConfirmAction({ request, step, mode: 'approve' });
  };

  const stepActionLabel = (step) =>
    step === 'cashier' ? 'Process payment' : step === 'registrar' ? 'Release' : 'Sign';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <SuccessAlert
        isVisible={alert.isVisible}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isVisible: false })}
      />

      {/* Header */}
      <div className="gradient-soft rounded-2xl p-8 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
            <FileSignature className="w-8 h-8 text-(--dominant-red) mr-3" />
            Credential Requests
          </h1>
          <p className="text-gray-600 text-lg">
            Documents requested from the registrar — clearance, payment, release and claim stub.
          </p>
        </div>

        {can.create && (
          <Button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer shrink-0 h-11 px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'For Clearance', value: counts.clearance, icon: Clock, tint: 'bg-amber-100 text-amber-600' },
          { label: 'Awaiting Payment', value: counts.payment, icon: Wallet, tint: 'bg-orange-100 text-orange-600' },
          { label: 'Ready to Release', value: counts.release, icon: PackageCheck, tint: 'bg-blue-100 text-blue-600' },
          { label: 'Released', value: counts.released, icon: CheckCircle2, tint: 'bg-green-100 text-green-600' },
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
              placeholder="Search student, request number or document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-56 justify-between bg-white cursor-pointer">
                {statusFilter === 'all' ? 'All Statuses' : STATUS_STYLES[statusFilter]?.label}
                <span className="text-gray-400">▾</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setStatusFilter('all')}>All Statuses</DropdownMenuItem>
              {Object.entries(STATUS_STYLES).map(([key, style]) => (
                <DropdownMenuItem key={key} onSelect={() => setStatusFilter(key)}>{style.label}</DropdownMenuItem>
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
            Loading credential requests…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileSignature className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium text-gray-500">No credential requests to show.</p>
            <p className="text-sm">
              {can.create ? 'File one with the New Request button above.' : 'Requests appear here once the registrar files them.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Credentials</th>
                  <th className="px-4 py-3 text-left">Progress</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((request) => {
                  const open = expanded.includes(request.id);
                  const style = STATUS_STYLES[request.status] || STATUS_STYLES.pending;
                  const signedCount = STEPS.filter((s) => request.approvals?.[s.key]).length;
                  const myTurn = STEPS.find((s) => canSignStep(request, s.key));

                  return (
                    <React.Fragment key={request.id}>
                      <tr
                        className="border-t hover:bg-gray-50/70 align-top cursor-pointer"
                        onClick={() => toggleExpanded(request.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <ChevronRight
                              className={`w-4 h-4 mt-0.5 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
                            />
                            <div>
                              <div className="font-semibold text-gray-900 uppercase">{request.student?.name}</div>
                              <div className="text-xs text-gray-400 font-mono">{request.request_number}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {[request.student?.course, request.student?.year_level].filter(Boolean).join(' · ')}
                                {!request.student?.is_linked && (
                                  <span className="ml-1.5 text-[11px] text-blue-600">· manual entry</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                            {(request.credentials ?? []).map((line, index) => (
                              <span
                                key={index}
                                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                title={line.remarks || line.label}
                              >
                                {line.label}{line.pages ? ` (${line.pages}p)` : ''}
                              </span>
                            ))}
                          </div>
                          {request.purpose_labels?.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1.5 max-w-[260px] truncate">
                              {request.purpose_labels.join(', ')}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {STEPS.map((step) => (
                              <span
                                key={step.key}
                                title={`${step.label}${request.approvals?.[step.key] ? ' — signed' : ' — pending'}`}
                                className={`h-1.5 w-7 rounded-full ${
                                  request.approvals?.[step.key] ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1.5">{signedCount} of {STEPS.length} signed</div>
                        </td>

                        <td className="px-4 py-4">
                          <Badge className={`${style.className} font-medium`}>{style.label}</Badge>
                          {request.claim?.date && (
                            <div className="text-xs text-gray-500 mt-1.5">Claim {longDate(request.claim.date)}</div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {myTurn && (
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); openStepAction(request, myTurn.key); }}
                                className="bg-(--dominant-red) hover:bg-red-800 text-white cursor-pointer"
                              >
                                {stepActionLabel(myTurn.key)}
                              </Button>
                            )}
                            {can.generate_document && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); setDocumentFor(request); }}
                                className="cursor-pointer bg-white hover:bg-red-50 hover:text-red-800 hover:border-red-800"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                Document
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {open && (
                        <tr className="bg-gray-50/60 border-t border-gray-100">
                          <td colSpan={5} className="px-6 py-5">
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                              {/* Request details */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Request</h4>
                                <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
                                  <div className="grid grid-cols-[88px_1fr] gap-y-1.5 text-xs">
                                    <span className="text-gray-400">Student ID</span>
                                    <span className="font-mono text-gray-700">{request.student?.student_id_number || '—'}</span>
                                    <span className="text-gray-400">Term</span>
                                    <span className="text-gray-700">
                                      {[request.student?.semester, request.student?.school_year].filter(Boolean).join(' · ') || '—'}
                                    </span>
                                    <span className="text-gray-400">Email</span>
                                    <span className="text-gray-700 break-all">{request.student?.email || '—'}</span>
                                    <span className="text-gray-400">Contact</span>
                                    <span className="text-gray-700">{request.student?.contact_number || '—'}</span>
                                    <span className="text-gray-400">Filed</span>
                                    <span className="text-gray-700">
                                      {longDate(request.requested_on)}
                                      {request.created_by ? ` · ${request.created_by}` : ''}
                                    </span>
                                  </div>

                                  {request.remarks && (
                                    <p className="text-xs text-gray-600 border-t pt-2 mt-2">“{request.remarks}”</p>
                                  )}
                                </div>

                                {/* Payment, for the desks that handle money */}
                                {request.payment?.is_paid ? (
                                  request.payment.visible ? (
                                    <div className="rounded-lg border bg-white p-4">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment</h4>
                                      <p className="text-lg font-bold text-gray-900">{peso(request.payment.amount)}</p>
                                      <p className="text-xs text-gray-500">O.R. {request.payment.or_number}</p>
                                      <p className="text-xs text-gray-400">{request.payment.payment_date}</p>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg border bg-white p-4 flex items-center gap-2 text-sm text-green-700">
                                      <CheckCircle2 className="w-4 h-4" /> Payment settled
                                    </div>
                                  )
                                ) : (
                                  <div className="rounded-lg border bg-white p-4 flex items-center gap-2 text-sm text-amber-700">
                                    <AlertCircle className="w-4 h-4" /> Not yet paid
                                  </div>
                                )}
                              </div>

                              {/* Clearance trail */}
                              <div className="xl:col-span-2 space-y-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Clearance</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {STEPS.map((step) => {
                                    const approved = request.approvals?.[step.key];
                                    const actionable = canSignStep(request, step.key);

                                    return (
                                      <div
                                        key={step.key}
                                        className={`rounded-lg border px-3 py-2.5 ${
                                          approved
                                            ? 'border-green-200 bg-green-50'
                                            : actionable
                                              ? 'border-(--dominant-red) bg-red-50/40'
                                              : 'border-gray-200 bg-white'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          {approved
                                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                            : <Clock className={`w-3.5 h-3.5 shrink-0 ${actionable ? 'text-(--dominant-red)' : 'text-gray-400'}`} />}
                                          <span className={`text-xs font-semibold ${
                                            approved ? 'text-green-800' : actionable ? 'text-(--dominant-red)' : 'text-gray-500'
                                          }`}>
                                            {step.label}
                                          </span>
                                          {approved && can.revoke && (
                                            <button
                                              onClick={() => setConfirmAction({ request, step: step.key, mode: 'revoke' })}
                                              className="ml-auto text-green-700/50 hover:text-amber-700 cursor-pointer"
                                              title="Withdraw this clearance"
                                            >
                                              <Undo2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>

                                        {approved ? (
                                          <>
                                            <p className="text-[11px] text-green-700/80 mt-1">
                                              {request.approval_names?.[step.key] || 'Signed'} · {approved.split(' ')[0]}
                                            </p>
                                            {request.approval_remarks?.[step.key] && (
                                              <p
                                                className="text-[11px] text-gray-600 mt-1 line-clamp-2"
                                                title={request.approval_remarks[step.key]}
                                              >
                                                “{request.approval_remarks[step.key]}”
                                              </p>
                                            )}
                                          </>
                                        ) : actionable ? (
                                          <button
                                            onClick={() => openStepAction(request, step.key)}
                                            className="mt-1.5 w-full rounded-md bg-(--dominant-red) hover:bg-red-800 text-white text-xs font-semibold py-1.5 cursor-pointer transition-colors"
                                          >
                                            {stepActionLabel(step.key)}
                                          </button>
                                        ) : (
                                          <p className="text-[11px] text-gray-400 mt-1">{waitingLabel(request, step.key)}</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Claim stub */}
                                {request.claim?.released_at && (
                                  <div className="rounded-lg border border-green-200 bg-green-50/60 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <h4 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">
                                          Claim stub
                                        </h4>
                                        <p className="text-sm text-gray-900">
                                          Claim on <b>{longDate(request.claim.date)}</b>
                                          {request.claim.time ? `, ${request.claim.time}` : ''}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
                                          {request.claim.email_sent_at ? (
                                            <>
                                              <MailCheck className="w-3.5 h-3.5 text-green-600" />
                                              Emailed to {request.student?.email} on {request.claim.email_sent_at.split(' ')[0]}
                                            </>
                                          ) : (
                                            <>
                                              <Mail className="w-3.5 h-3.5 text-amber-600" />
                                              The claim stub has not been emailed yet.
                                            </>
                                          )}
                                        </p>
                                        {request.claim.notes && (
                                          <p className="text-xs text-gray-600 mt-1">“{request.claim.notes}”</p>
                                        )}
                                      </div>

                                      {can.release && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={isSaving}
                                          onClick={() => handleResend(request)}
                                          className="cursor-pointer bg-white hover:bg-green-50 hover:text-green-800 hover:border-green-700 shrink-0"
                                        >
                                          <Mail className="w-3.5 h-3.5 mr-1.5" />
                                          {request.claim.email_sent_at ? 'Send again' : 'Send stub'}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Registrar's housekeeping */}
                                {can.edit && request.status !== 'cancelled' && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {!request.claim?.released_at && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => { setEditing(request); setFormOpen(true); }}
                                        className="cursor-pointer bg-white hover:bg-red-50 hover:text-red-800 hover:border-red-800"
                                      >
                                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                        Edit details
                                      </Button>
                                    )}
                                    {!request.claim?.released_at && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setConfirmAction({ request, step: 'cancel', mode: 'cancel' })}
                                        className="cursor-pointer bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                      >
                                        <Ban className="w-3.5 h-3.5 mr-1.5" />
                                        Cancel request
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CredentialRequestFormModal
        isOpen={formOpen}
        editing={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSaveRequest}
        isSaving={isSaving}
      />

      <CredentialPaymentModal
        isOpen={!!paying}
        request={paying}
        onClose={() => setPaying(null)}
        onSubmit={handlePayment}
        isSaving={isSaving}
      />

      <CredentialReleaseModal
        isOpen={!!releasing}
        request={releasing}
        onClose={() => setReleasing(null)}
        onSubmit={handleRelease}
        isSaving={isSaving}
      />

      <CredentialApprovalConfirmModal
        isOpen={!!confirmAction && confirmAction.mode !== 'cancel'}
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmedAction}
        isSaving={isSaving}
      />

      <CancelRequestModal
        isOpen={!!confirmAction && confirmAction.mode === 'cancel'}
        request={confirmAction?.request}
        onClose={() => setConfirmAction(null)}
        isSaving={isSaving}
        onConfirm={(remarks) =>
          run(() => credentialAPI.cancel(confirmAction.request.id, remarks), {
            onSuccess: () => setConfirmAction(null),
            fallback: 'Failed to cancel the request.',
          })
        }
      />

      <CredentialDocumentModal
        isOpen={!!documentFor}
        request={documentFor}
        onClose={() => setDocumentFor(null)}
      />
    </div>
  );
};

/** Stops a request that should not travel any further. */
const CancelRequestModal = ({ isOpen, request, onClose, onConfirm, isSaving }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setReason(''); setError(''); }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center gap-2">
          <Ban className="w-5 h-5" />
          <h2 className="text-lg font-bold heading-bold">Cancel {request.request_number}</h2>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            The request stops here and no further clearance can be signed. It stays on the board as a record.
          </p>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Reason <span className="text-(--dominant-red)">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              rows={3}
              placeholder="e.g. student withdrew the request"
              className="mt-1 w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm focus:border-red-800 focus:ring-2 focus:ring-red-800/20 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Keep it open</Button>
          <Button
            onClick={() => (reason.trim() ? onConfirm(reason.trim()) : setError('A reason is required.'))}
            disabled={isSaving}
            className="bg-gray-800 hover:bg-gray-900 text-white cursor-pointer min-w-[140px]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel request'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CredentialRequests;
