import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Search, Check, Clock, Loader2, UserCheck, RefreshCw,
  Users, CalendarRange, GraduationCap, CheckCheck,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert';
import MotionDropdown from '../idreleasing/MotionDropdown';
import ClearanceDetailSheet from '../clearance/ClearanceDetailSheet';

const PER_PAGE = 25;
const CHECKBOX_CLASS =
  'border-gray-400 data-[state=checked]:bg-[var(--dominant-red)] data-[state=checked]:border-[var(--dominant-red)]';

/**
 * The faculty clearance board.
 *
 * Laid out like the student board it sits beside — same header, same counts,
 * same filter card — because they are the same job on a different population
 * and a person moving between them should not have to relearn the page.
 *
 * Signing calls the shared clearance endpoints, so who may sign what is
 * decided server-side in one place for both.
 */
const FacultyClearance = () => {
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [term, setTerm] = useState({ school_year: '', semester: '' });
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [roleId, setRoleId] = useState('');
  const [mineOnly, setMineOnly] = useState(true);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(new Set());
  const [openId, setOpenId] = useState(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });

  const notify = useCallback((message, type = 'success') => {
    setAlert({ isVisible: true, message, type });
  }, []);

  // Held in a ref so a changing callback cannot rebuild the loaders and
  // refire their effects — the loop that cost us an afternoon on the INC page
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBoard = useCallback(async (params) => {
    try {
      const response = await enrollmentAPI.facultyClearance.board(params);
      setRows(response.data || []);
      setMeta(response.meta || { current_page: 1, last_page: 1, total: 0 });
    } catch (error) {
      setRows([]);
      notifyRef.current?.(error.message || 'Could not load that list.', 'error');
    }
  }, []);

  const loadOverview = useCallback(async (params) => {
    try {
      const response = await enrollmentAPI.facultyClearance.overview(params);
      setOverview(response.data);
      return response.data;
    } catch (error) {
      notifyRef.current?.(error.message || 'Could not load the board.', 'error');
      return null;
    }
  }, []);

  /**
   * The board effect fires on every filter change — including the one that
   * lands when the first overview settles the term. This skips that one,
   * because the first page was already fetched alongside the overview.
   */
  const skipNextBoardLoad = useRef(true);

  useEffect(() => {
    (async () => {
      // Both at once. The board defaults to the same term the overview picks,
      // so it does not have to wait to be told which one that is — two
      // sequential round trips was the slowest thing about this page.
      const [data] = await Promise.all([
        loadOverview(),
        fetchBoard({ mine_only: 1, per_page: PER_PAGE }),
      ]);

      if (data?.term) setTerm(data.term);
      setBooting(false);
      setLoading(false);
    })();
  }, [loadOverview, fetchBoard]);

  const loadBoard = useCallback(async () => {
    if (!term.school_year) return;

    if (skipNextBoardLoad.current) {
      skipNextBoardLoad.current = false;
      return;
    }

    setLoading(true);
    await fetchBoard({
      school_year: term.school_year,
      semester: term.semester || undefined,
      search: debounced || undefined,
      role_id: roleId || undefined,
      mine_only: mineOnly ? 1 : undefined,
      page,
      per_page: PER_PAGE,
    });
    setLoading(false);
  }, [term, debounced, roleId, mineOnly, page, fetchBoard]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const refresh = useCallback(async () => {
    setSelected(new Set());
    setLoading(true);
    await Promise.all([
      loadOverview({ school_year: term.school_year, semester: term.semester || undefined }),
      fetchBoard({
        school_year: term.school_year,
        semester: term.semester || undefined,
        search: debounced || undefined,
        role_id: roleId || undefined,
        mine_only: mineOnly ? 1 : undefined,
        page,
        per_page: PER_PAGE,
      }),
    ]);
    setLoading(false);
  }, [loadOverview, fetchBoard, term, debounced, roleId, mineOnly, page]);

  const isAdmin = Boolean(overview?.me?.is_admin);
  const canGenerate = Boolean(overview?.can?.generate);
  // The server's answer, not a guess from the role
  const canApproveAll = Boolean(overview?.can?.approve_all);
  const totals = overview?.totals ?? { total: 0, cleared: 0, pending: 0 };

  const yearOptions = useMemo(() => {
    const years = [...new Set((overview?.terms ?? []).map((option) => option.school_year))];
    return years.map((year) => ({ value: year, label: `S.Y. ${year}` }));
  }, [overview]);

  const semesterOptions = useMemo(
    () => (overview?.terms ?? [])
      .filter((option) => option.school_year === term.school_year)
      .map((option) => ({
        value: option.semester,
        // A term with nothing in it is offered too — that is how you reach
        // Generate for it — so it says so rather than reading "(0)"
        label: option.total
          ? `${option.semester} (${option.total})`
          : `${option.semester} — not yet generated`,
      })),
    [overview, term.school_year]
  );

  /** The lines this person may actually sign, for the bulk action. */
  const signableRoles = useMemo(
    () => (overview?.roles ?? []).filter((role) => role.can_sign),
    [overview]
  );

  const roleOptions = useMemo(
    () => [
      { value: '', label: 'All signature lines' },
      ...(overview?.roles ?? []).map((role) => ({
        value: String(role.id),
        label: `${role.name}${role.outstanding ? ` (${role.outstanding})` : ''}`,
      })),
    ],
    [overview]
  );

  const bulkRole = useMemo(() => {
    if (roleId) return signableRoles.find((role) => String(role.id) === String(roleId)) ?? null;
    // Nothing chosen: the single line they sign, if there is only one
    return signableRoles.length === 1 ? signableRoles[0] : null;
  }, [roleId, signableRoles]);

  const changeTerm = useCallback((schoolYear, semester) => {
    setTerm({ school_year: schoolYear, semester });
    setPage(1);
    setSelected(new Set());
    loadOverview({ school_year: schoolYear, semester: semester || undefined });
  }, [loadOverview]);

  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)));

  const toggleOne = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
   * `notify: false` because the College does not email its own staff about
   * their clearance. The endpoint is shared with the student board, so it is
   * passed explicitly rather than left to its default.
   */
  const bulkSignAll = async () => {
    setBusy(true);
    try {
      const response = await enrollmentAPI.clearance.approveAll({
        clearance_ids: [...selected],
        notify: false,
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
      const response = await enrollmentAPI.facultyClearance.generate({
        school_year: term.school_year || undefined,
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

  if (booting) {
    return <div className="py-24 flex justify-center"><LoadingSpinner size="lg" /></div>;
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
          <GraduationCap className="w-7 h-7 text-[var(--dominant-red)] mr-2.5 shrink-0" />
          Faculty Clearance
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {isAdmin
            ? 'Admin — you can sign any line'
            : canApproveAll
              ? 'You can sign every line at once'
              : `${signableRoles.length} signature line(s)`}
          {' · '}
          One clearance per instructor per semester, cashier last
        </p>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Waiting on me', value: overview?.me?.waiting_on_me ?? 0, tint: 'bg-amber-50 text-amber-600', icon: Clock },
          { label: 'Cleared', value: totals.cleared, tint: 'bg-green-50 text-green-600', icon: CheckCheck },
          { label: 'Still pending', value: totals.pending, tint: 'bg-red-50 text-[var(--dominant-red)]', icon: ShieldCheck },
          { label: 'Instructors', value: totals.total, tint: 'bg-blue-50 text-blue-600', icon: Users },
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

      {/* Filters */}
      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search instructor or department..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10 h-11 border border-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MotionDropdown
              value={term.school_year}
              onChange={(year) => {
                const available = (overview?.terms ?? []).filter((o) => o.school_year === year);
                const keep = available.find((o) => o.semester === term.semester);
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
              value={roleId}
              onChange={(value) => { setRoleId(value); setPage(1); }}
              options={roleOptions}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={mineOnly}
                onCheckedChange={(value) => { setMineOnly(Boolean(value)); setPage(1); }}
                className={CHECKBOX_CLASS}
              />
              <span className="text-sm text-gray-600">Only those waiting on me</span>
            </label>

            {canGenerate && (
              <Button variant="outline" className="h-10 cursor-pointer" disabled={busy} onClick={generate}>
                <RefreshCw size={15} className={`mr-1.5 ${busy ? 'animate-spin' : ''}`} />
                Generate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selection and the actions it enables sit together, so the buttons
          appear where the eye already is rather than at the foot of the page */}
      <div className="flex items-center gap-3 flex-wrap px-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} className={CHECKBOX_CLASS} />
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
              {canApproveAll && (
                <Button
                  variant="outline"
                  className="h-10 cursor-pointer"
                  disabled={busy}
                  onClick={bulkSignAll}
                  title="Sign every outstanding line for the selected instructors"
                >
                  <UserCheck size={15} className="mr-1.5" /> Sign all lines
                </Button>
              )}
              <Button
                className="h-10 gradient-primary text-white cursor-pointer"
                disabled={busy || !bulkRole}
                onClick={bulkSign}
                title={bulkRole ? `Sign ${bulkRole.name}` : 'Choose which line you are signing first'}
              >
                {busy ? <Loader2 size={15} className="animate-spin mr-1.5" /> : <Check size={15} className="mr-1.5" />}
                Sign {bulkRole ? bulkRole.name : '…'}
              </Button>
            </div>
          </>
        ) : (
          <span className="text-sm text-gray-400 ml-auto">{meta.total} instructor(s)</span>
        )}
      </div>

      {/* The board */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center px-6">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {meta.total === 0 && canGenerate
                  ? 'No faculty clearances for this term yet — use Generate to create them.'
                  : 'Nothing matches those filters.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((row) => {
                const cleared = row.status === 'cleared';
                const progress = row.total ? (row.signed / row.total) * 100 : 0;

                return (
                  <div
                    key={row.id}
                    className={`flex items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                      row.waiting_on_me ? 'border-l-[3px] border-l-amber-400' : 'border-l-[3px] border-l-transparent'
                    }`}
                  >
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      className={`${CHECKBOX_CLASS} shrink-0`}
                    />

                    <button
                      onClick={() => setOpenId(row.id)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{row.instructor.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {[row.instructor.title, row.instructor.department].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>

                        {cleared ? (
                          <Badge className="bg-green-100 text-green-800 border border-green-200 text-[11px] shrink-0">
                            <ShieldCheck size={11} className="mr-1" /> Cleared
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[11px] shrink-0">
                            <Clock size={11} className="mr-1" /> {row.total - row.signed} left
                          </Badge>
                        )}
                      </div>

                      {/* Progress reads faster than a fraction at a glance,
                          and the fraction is kept beside it for precision */}
                      <div className="flex items-center gap-2.5 mt-2">
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden max-w-[220px]">
                          <motion.div
                            className={cleared ? 'h-full bg-green-500' : 'h-full bg-amber-500'}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 shrink-0 font-mono">
                          {row.signed}/{row.total}
                        </span>
                      </div>

                      {!cleared && row.outstanding?.length > 0 && (
                        <p className="text-[11px] text-gray-500 mt-1.5 truncate">
                          Waiting on {row.outstanding.slice(0, 3).join(', ')}
                          {row.outstanding.length > 3 && ` +${row.outstanding.length - 3} more`}
                        </p>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="p-3 border-t flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer">
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} total
              </span>
              <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="cursor-pointer">
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {openId && (
          <ClearanceDetailSheet
            clearanceId={openId}
            canApproveAll={canApproveAll}
            notify={notify}
            onClose={() => setOpenId(null)}
            onChanged={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyClearance;
