import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Search, QrCode, List, Check, Clock, Loader2,
  UserCheck, X, RefreshCw, Users, CheckCheck, ScanLine, CalendarRange, MailX,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { enrollmentAPI } from '@/services/api';

import LoadingSpinner from '../layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert';
import MotionDropdown from '../idreleasing/MotionDropdown';
import QrScanner from '../clearance/QrScanner';
import ClearanceDetailSheet from '../clearance/ClearanceDetailSheet';

const PER_PAGE = 20;

/**
 * The shared Checkbox leaves its unchecked border at `border-input`, which on
 * white reads as no box at all — so the colour is stated.
 */
const CHECKBOX_CLASS =
  'border-2 border-gray-400 data-[state=checked]:bg-[var(--dominant-red)] data-[state=checked]:border-[var(--dominant-red)]';

/** The term a Senior High clearance covers, in place of a semester. */
const WHOLE_YEAR = 'Whole Year';

/**
 * The clearance board.
 *
 * Built for a phone first: the people signing these lines are as often
 * walking around the campus as sitting at a desk. One column, large tap
 * targets, a sticky action bar, and a scanner that goes from a student's
 * card to a signature in two taps.
 *
 * Nothing here decides what a person may sign — the server re-checks every
 * approval against their assigned lines. The buttons only reflect what it
 * already told us.
 */
const Clearance = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState('list');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [boardLoading, setBoardLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [term, setTerm] = useState({ school_year: '', semester: '' });
  const [roleFilter, setRoleFilter] = useState('');
  const [mineOnly, setMineOnly] = useState(true);

  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [scanned, setScanned] = useState(null);
  const [scanBusy, setScanBusy] = useState(false);

  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });

  const notify = useCallback((message, type = 'success') => {
    setAlert({ isVisible: true, message, type });
  }, []);

  // ── loading ──────────────────────────────────────────────────────────

  const loadOverview = useCallback(async (next) => {
    const response = await enrollmentAPI.clearance.overview(next ?? {});
    setOverview(response);
    // The server always answers with one concrete term, so the picker
    // always has a matching entry to show as selected
    setTerm({ school_year: response.school_year, semester: response.semester ?? '' });
    return response;
  }, []);

  useEffect(() => {
    loadOverview()
      .catch((error) => notify(error.message || 'Could not open the clearance board.', 'error'))
      .finally(() => setLoading(false));
  }, [loadOverview, notify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadBoard = useCallback(async () => {
    if (!term.school_year) return;

    setBoardLoading(true);
    try {
      const response = await enrollmentAPI.clearance.board({
        school_year: term.school_year,
        semester: term.semester || undefined,
        search: debounced || undefined,
        role_id: roleFilter || undefined,
        mine_only: mineOnly ? 1 : undefined,
        page,
        per_page: PER_PAGE,
      });
      setRows(response.data || []);
      setMeta(response.meta || { current_page: 1, last_page: 1, total: 0 });
    } catch (error) {
      notify(error.message || 'Could not load the student list.', 'error');
    } finally {
      setBoardLoading(false);
    }
  }, [term, debounced, roleFilter, mineOnly, page, notify]);

  useEffect(() => {
    if (mode === 'list') loadBoard();
  }, [mode, loadBoard]);

  const refresh = useCallback(async () => {
    setSelected(new Set());
    await Promise.all([
      loadBoard(),
      loadOverview({ school_year: term.school_year, semester: term.semester || undefined }).catch(() => {}),
    ]);
  }, [loadBoard, loadOverview, term]);

  // ── signing ──────────────────────────────────────────────────────────

  const signOne = async (item) => {
    setBusy(true);
    try {
      const response = await enrollmentAPI.clearance.approve(item.id);
      notify(response.message, 'success');
      await refresh();
    } catch (error) {
      notify(error.message || 'Could not sign that line.', 'error');
    } finally {
      setBusy(false);
    }
  };

  /** The line a bulk sign would apply: the chosen filter, else my only line. */
  const bulkRole = useMemo(() => {
    const roles = overview?.roles ?? [];
    if (roleFilter) return roles.find((role) => String(role.id) === String(roleFilter)) ?? null;

    const mine = roles.filter((role) => role.is_mine);
    return mine.length === 1 ? mine[0] : null;
  }, [overview, roleFilter]);

  const bulkSign = async () => {
    if (!bulkRole) {
      notify('Choose which line you are signing first.', 'error');
      return;
    }

    setBusy(true);
    try {
      const response = await enrollmentAPI.clearance.bulkApprove({
        clearance_ids: [...selected],
        clearance_role_id: bulkRole.id,
      });
      notify(response.message, response.approved === 0 ? 'error' : 'success');
      await refresh();
    } catch (error) {
      notify(error.message || 'Could not sign those lines.', 'error');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Signs every outstanding line on the selected students.
   *
   * `sendEmail` false is for bringing a finished term's records up to date:
   * the students end up cleared, but none of them is told they have just
   * been cleared — because as far as they are concerned, they were cleared
   * weeks ago. The clearance is marked as handled either way, so nothing
   * announces it later either.
   *
   * Named sendEmail rather than notify: `notify` is the toast in this file.
   */
  const bulkSignAll = async (sendEmail = true) => {
    setBusy(true);
    try {
      const response = await enrollmentAPI.clearance.approveAll({
        clearance_ids: [...selected],
        notify: sendEmail,
      });
      notify(response.message, 'success');
      await refresh();
    } catch (error) {
      notify(error.message || 'Could not sign every line.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    setBusy(true);
    try {
      const response = await enrollmentAPI.clearance.generate({
        school_year: term.school_year,
        semester: term.semester || undefined,
      });
      notify(response.message, 'success');
      await refresh();
    } catch (error) {
      notify(error.message || 'Could not generate the clearances.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ── scanning ─────────────────────────────────────────────────────────

  // Held in a ref so a new camera frame never restarts the scanner
  const scannedRef = useRef(null);
  scannedRef.current = scanned;

  const onScanned = useCallback(async (token) => {
    if (scannedRef.current || scanBusy) return;

    setScanBusy(true);
    try {
      const response = await enrollmentAPI.clearance.scan(token, {
        school_year: term.school_year,
        semester: term.semester || undefined,
      });
      setScanned(response.data);
      // A short buzz confirms the read without the user having to look up
      navigator.vibrate?.(60);
    } catch (error) {
      notify(error.message || 'That code could not be matched.', 'error');
    } finally {
      setScanBusy(false);
    }
  }, [term, scanBusy, notify]);

  const signScanned = async (item) => {
    setBusy(true);
    try {
      const response = await enrollmentAPI.clearance.approve(item.id);
      notify(response.message, 'success');
      const fresh = await enrollmentAPI.clearance.show(scanned.id);
      setScanned(fresh.data);
      loadOverview({ school_year: term.school_year, semester: term.semester || undefined }).catch(() => {});
    } catch (error) {
      notify(error.message || 'Could not sign that line.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const addScannedToBatch = () => {
    setSelected((prev) => new Set(prev).add(scanned.id));
    notify(`${scanned.student.name} added to the batch.`, 'success');
    setScanned(null);
  };

  // ── derived ──────────────────────────────────────────────────────────

  const stats = overview?.stats;
  const isAdmin = Boolean(overview?.me?.is_admin);
  const canGenerate = Boolean(overview?.can?.generate);

  /** Years the school has clearances for, newest first. */
  const yearOptions = useMemo(() => {
    const years = [...new Set((overview?.terms ?? []).map((option) => option.school_year))];
    return years.map((year) => ({ value: year, label: `S.Y. ${year}` }));
  }, [overview]);

  /**
   * The terms within the chosen year. Senior High appears here as its own
   * entry rather than a semester, because it clears once for the whole year.
   */
  const semesterOptions = useMemo(
    () => (overview?.terms ?? [])
      .filter((option) => option.school_year === term.school_year)
      .map((option) => ({
        value: option.semester,
        label: option.semester === WHOLE_YEAR
          ? `Senior High — whole year (${option.total})`
          : `${option.semester} (${option.total})`,
      })),
    [overview, term.school_year]
  );

  /** Reloads the board on a new term, clearing a selection that no longer applies. */
  const changeTerm = useCallback((schoolYear, semester) => {
    setTerm({ school_year: schoolYear, semester });
    setPage(1);
    setSelected(new Set());
    loadOverview({ school_year: schoolYear, semester: semester || undefined })
      .catch((error) => notify(error.message || 'Could not switch term.', 'error'));
  }, [loadOverview, notify]);

  const roleOptions = useMemo(() => {
    const roles = overview?.roles ?? [];
    const mine = roles.filter((role) => role.is_mine);
    const list = isAdmin ? roles : (mine.length ? mine : roles);

    return [
      { value: '', label: isAdmin ? 'All signature lines' : 'All my lines' },
      ...list.map((role) => ({
        value: String(role.id),
        label: `${role.name}${role.pending ? ` (${role.pending})` : ''}`,
      })),
    ];
  }, [overview, isAdmin]);

  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) rows.forEach((row) => next.delete(row.id));
      else rows.forEach((row) => next.add(row.id));
      return next;
    });
  };

  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (loading) {
    return <div className="p-6 py-24 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (!overview) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-24">
        <ShieldCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Clearance</h1>
        <p className="text-gray-500 mt-2">
          You are not assigned to any clearance signature line.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      <SuccessAlert
        isVisible={alert.isVisible}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert((state) => ({ ...state, isVisible: false }))}
      />

      {/* Header */}
      <div className="gradient-soft rounded-2xl p-4 sm:p-6 border border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-bold heading-bold text-gray-900 flex items-center">
          <ShieldCheck className="w-7 h-7 text-[var(--dominant-red)] mr-2.5 shrink-0" />
          Clearance
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {overview.me.name} ·{' '}
          {isAdmin
            ? 'Admin — you can sign any line'
            : `${overview.roles.filter((role) => role.is_mine).length} signature line(s)`}
        </p>

      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Waiting on me', value: stats?.mine_pending ?? 0, tint: 'bg-amber-50 text-amber-600', icon: Clock },
          { label: 'Cleared', value: stats?.cleared ?? 0, tint: 'bg-green-50 text-green-600', icon: CheckCheck },
          { label: 'Students', value: stats?.total ?? 0, tint: 'bg-blue-50 text-blue-600', icon: Users },
        ].map(({ label, value, tint, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-3 sm:p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${tint}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl sm:text-2xl font-bold heading-bold text-gray-900 leading-none">{value}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mode */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 w-full sm:w-auto">
        {[
          { key: 'list', label: 'Student List', icon: List },
          { key: 'scan', label: 'Scan Code', icon: QrCode },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => { setMode(item.key); setScanned(null); }}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold rounded-md cursor-pointer transition-colors flex items-center justify-center gap-2 ${
              mode === item.key ? 'bg-white text-[var(--dominant-red)] shadow-sm' : 'text-gray-500'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {mode === 'scan' ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <QrScanner onDetected={onScanned} paused={Boolean(scanned) || scanBusy} />

            {scanBusy && (
              <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Looking that up…
              </p>
            )}

            {!scanned && !scanBusy && (
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500">
                  Point the camera at the student's clearance code.
                </p>
                {/* The term picker lives on the list tab, so say here which
                    term a signature would land on */}
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                  <CalendarRange className="w-3.5 h-3.5" />
                  Signing for{' '}
                  {term.semester === WHOLE_YEAR
                    ? `${term.school_year} — Senior High`
                    : `${term.semester}, ${term.school_year}`}
                </p>
              </div>
            )}

            <AnimatePresence>
              {scanned && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border rounded-xl overflow-hidden"
                >
                  <div className="p-4 bg-gray-50 border-b flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 leading-tight">{scanned.student.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{scanned.student.student_id_number}</p>
                      <p className="text-xs text-gray-500">
                        {scanned.student.course} · {scanned.term_label}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 cursor-pointer"
                      onClick={() => setScanned(null)}
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  <div className="p-4 space-y-2">
                    {scanned.status === 'cleared' ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                        <ShieldCheck size={16} /> Already fully cleared.
                      </div>
                    ) : (
                      scanned.items
                        .filter((item) => item.can_sign && item.status === 'pending')
                        .map((item) => {
                          const blocked = item.is_final && scanned.outstanding.length > 1;

                          return (
                            <Button
                              key={item.id}
                              onClick={() => signScanned(item)}
                              disabled={busy || blocked}
                              className="w-full h-12 gradient-primary text-white justify-between cursor-pointer disabled:opacity-40"
                            >
                              <span className="truncate">Sign {item.role_name}</span>
                              {blocked
                                ? <span className="text-xs">waiting on others</span>
                                : <Check size={16} />}
                            </Button>
                          );
                        })
                    )}

                    {scanned.status !== 'cleared'
                      && scanned.items.filter((i) => i.can_sign && i.status === 'pending').length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        Nothing here for you to sign — your lines are already done.
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 cursor-pointer"
                        onClick={addScannedToBatch}
                      >
                        Add to batch
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-11 cursor-pointer"
                        onClick={() => setDetailId(scanned.id)}
                      >
                        All lines
                      </Button>
                    </div>

                    {isAdmin && scanned.status !== 'cleared' && (
                      <Button
                        className="w-full h-11 gradient-primary text-white cursor-pointer"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            const response = await enrollmentAPI.clearance.approveAll({ clearance_ids: [scanned.id] });
                            notify(response.message, 'success');
                            const fresh = await enrollmentAPI.clearance.show(scanned.id);
                            setScanned(fresh.data);
                          } catch (error) {
                            notify(error.message || 'Could not sign every line.', 'error');
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <UserCheck size={16} className="mr-2" /> Sign every remaining line
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search name or ID number..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-10 h-11 border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MotionDropdown
                  value={term.school_year}
                  onChange={(year) => {
                    // Keep the same term where that year has one, else fall
                    // to its first — a year may have no summer, or no SHS
                    const available = (overview?.terms ?? []).filter((option) => option.school_year === year);
                    const keep = available.find((option) => option.semester === term.semester);
                    changeTerm(year, (keep ?? available[0])?.semester ?? '');
                  }}
                  options={yearOptions}
                  icon={CalendarRange}
                  className="w-full"
                />

                <MotionDropdown
                  value={term.semester}
                  onChange={(semester) => changeTerm(term.school_year, semester)}
                  options={semesterOptions}
                  className="w-full"
                />

                <MotionDropdown
                  value={roleFilter}
                  onChange={(value) => { setRoleFilter(value); setPage(1); }}
                  options={roleOptions}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={mineOnly}
                    onCheckedChange={(checked) => { setMineOnly(Boolean(checked)); setPage(1); }}
                    className={CHECKBOX_CLASS}
                  />
                  <span className="text-sm text-gray-700">Only those waiting on me</span>
                </label>

                {canGenerate && (
                  <Button variant="outline" size="sm" onClick={generate} disabled={busy} className="cursor-pointer">
                    <RefreshCw size={14} className="mr-1.5" /> Generate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selection and the actions it enables sit together, so the
              buttons appear where the eye already is rather than at the
              bottom of the screen */}
          <div className="flex items-center gap-3 flex-wrap px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                className={CHECKBOX_CLASS}
              />
              <span className="text-sm text-gray-600">Select page</span>
            </label>

            {selected.size > 0 ? (
              <>
                <Badge className="bg-gray-900 text-white">{selected.size} selected</Badge>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-gray-500 underline cursor-pointer"
                >
                  Clear
                </button>

                <div className="flex gap-2 ml-auto">
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        className="h-10 cursor-pointer"
                        disabled={busy}
                        onClick={() => bulkSignAll(true)}
                        title="Sign every outstanding line for the selected students, and email each one to say they are cleared"
                      >
                        <UserCheck size={15} className="mr-1.5" /> Sign all lines
                      </Button>
                      {/* The quieter of the two, for catching records up on a
                          term that is already over */}
                      <Button
                        variant="outline"
                        className="h-10 cursor-pointer text-gray-600 border-gray-300"
                        disabled={busy}
                        onClick={() => bulkSignAll(false)}
                        title="Sign every outstanding line without emailing anyone — for bringing a finished term's records up to date"
                      >
                        <MailX size={15} className="mr-1.5" /> Sign all, no email
                      </Button>
                    </>
                  )}
                  <Button
                    className="h-10 gradient-primary text-white cursor-pointer"
                    disabled={busy || !bulkRole}
                    onClick={bulkSign}
                    title={bulkRole ? `Sign ${bulkRole.name}` : 'Choose which line you are signing first'}
                  >
                    {busy
                      ? <Loader2 size={15} className="animate-spin mr-1.5" />
                      : <Check size={15} className="mr-1.5" />}
                    Sign {bulkRole ? bulkRole.name : '…'}
                  </Button>
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-400 ml-auto">{meta.total} student(s)</span>
            )}
          </div>

          {boardLoading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">
                <ShieldCheck className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold">Nothing waiting on you.</p>
                <p className="text-sm">No students match these filters for this term.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <StudentRow
                  key={row.id}
                  row={row}
                  isSelected={selected.has(row.id)}
                  onToggle={toggleOne}
                  onOpen={setDetailId}
                  onSign={signOne}
                  busy={busy}
                />
              ))}
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer">
                Previous
              </Button>
              <span className="text-sm text-gray-500">{meta.current_page} / {meta.last_page}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="cursor-pointer">
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {detailId && (
          <ClearanceDetailSheet
            clearanceId={detailId}
            canApproveAll={isAdmin}
            notify={notify}
            onClose={() => setDetailId(null)}
            onChanged={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/** One student on the list. Memoised so signing one does not redraw the rest. */
const StudentRow = React.memo(({ row, isSelected, onToggle, onOpen, onSign, busy }) => {
  const cleared = row.status === 'cleared';
  const pendingMine = row.my_items.filter((item) => item.status === 'pending');
  const single = pendingMine.length === 1 ? pendingMine[0] : null;

  return (
    <Card className={isSelected ? 'ring-2 ring-[var(--dominant-red)]' : ''}>
      <CardContent className="p-3 flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(row.id)}
          className={`shrink-0 ${CHECKBOX_CLASS}`}
        />

        <button
          onClick={() => onOpen(row.id)}
          className="min-w-0 flex-1 text-left cursor-pointer"
        >
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {row.student.name}
          </p>
          <p className="text-xs text-gray-500 font-mono">{row.student.student_id_number}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">
              {row.student.course} · {row.student.year_level}
            </span>
            {cleared ? (
              <Badge className="bg-green-100 text-green-800 border border-green-200 text-[10px]">
                Cleared
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px]">
                {row.progress.approved}/{row.progress.total}
              </Badge>
            )}
          </div>
        </button>

        {single && !cleared && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onSign(single)}
            className="h-10 px-4 gradient-primary text-white shrink-0 cursor-pointer"
          >
            <Check size={15} />
          </Button>
        )}

        {!single && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpen(row.id)}
            className="h-10 px-3 shrink-0 cursor-pointer"
          >
            <ScanLine size={15} />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

StudentRow.displayName = 'ClearanceStudentRow';

export default Clearance;
