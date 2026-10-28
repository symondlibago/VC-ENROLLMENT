import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Search, Check, Users, Printer, CheckCircle,
  AlertTriangle, RefreshCw, Boxes, CalendarRange, Receipt, LayoutGrid,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI } from '@/services/api';

import LoadingSpinner from '../layout/LoadingSpinner';
import SuccessAlert from '../modals/SuccessAlert';
import ValidationErrorModal from '../modals/ValidationErrorModal';

import StudentIdTable from '../idreleasing/StudentIdTable';
import MotionDropdown from '../idreleasing/MotionDropdown';
import SuppliesTab from '../idreleasing/SuppliesTab';
import RecordsTab from '../idreleasing/RecordsTab';
import IdHistoryModal from '../idreleasing/IdHistoryModal';
import { LostIdModal, ReleaseModal, ReplacementModal } from '../idreleasing/CardActionModals';
import { BOARD_FILTERS, peso } from '../idreleasing/constants';

const PER_PAGE = 24;

const StatCard = ({ label, value, sub, icon: Icon, tint }) => (
  <Card className="card-hover">
    <CardContent className="p-5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold heading-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl shrink-0 ${tint}`}><Icon className="w-5 h-5" /></div>
    </CardContent>
  </Card>
);

/**
 * ID releasing, read a school year at a time.
 *
 * Each card a student is given is its own record, so the year's counts are a
 * question the data answers rather than a tally that has to be reset. The
 * board itself is paginated and filtered at the database: the page renders
 * two dozen students whatever the size of the school.
 */
const IDReleasing = () => {
  const [tab, setTab] = useState('board');

  const [overview, setOverview] = useState(null);
  const [schoolYear, setSchoolYear] = useState('');

  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('');
  const [yearLevelFilter, setYearLevelFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState(() => new Set());
  const [dialog, setDialog] = useState(null);

  const [alertState, setAlertState] = useState({ isVisible: false, message: '', type: 'success' });
  const [validationError, setValidationError] = useState({ isOpen: false, message: '' });

  const notify = useCallback((message, type = 'success') => {
    setAlertState({ isVisible: true, message, type });
  }, []);

  // â”€â”€ loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadOverview = useCallback(async (year) => {
    const response = await enrollmentAPI.idReleasing.overview(year ? { school_year: year } : {});
    setOverview(response);
    setSchoolYear(response.school_year);
    return response;
  }, []);

  useEffect(() => {
    loadOverview()
      .catch((error) => notify(error.message || 'Could not load the ID board.', 'error'))
      .finally(() => setLoading(false));
  }, [loadOverview, notify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadBoard = useCallback(async () => {
    if (!schoolYear) return;

    setBoardLoading(true);
    try {
      const response = await enrollmentAPI.idReleasing.board({
        school_year: schoolYear,
        search: debouncedSearch || undefined,
        status: statusFilter,
        course_id: courseFilter || undefined,
        year_level: yearLevelFilter || undefined,
        page,
        per_page: PER_PAGE,
      });
      setStudents(response.data || []);
      setMeta(response.meta || { current_page: 1, last_page: 1, total: 0 });
    } catch (error) {
      notify(error.message || 'Could not load the student list.', 'error');
    } finally {
      setBoardLoading(false);
    }
  }, [schoolYear, debouncedSearch, statusFilter, courseFilter, yearLevelFilter, page, notify]);

  useEffect(() => {
    if (tab === 'board') loadBoard();
  }, [tab, loadBoard]);

  /** After an action: the board, the counts, and the selection all move on. */
  const refreshAll = useCallback(async () => {
    setSelected(new Set());
    setDialog(null);
    await Promise.all([
      loadBoard(),
      loadOverview(schoolYear).catch(() => {}),
    ]);
  }, [loadBoard, loadOverview, schoolYear]);

  // â”€â”€ actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const runPrint = useCallback(async (targets) => {
    setSaving(true);
    try {
      const response = await enrollmentAPI.idReleasing.markPrinted({
        student_ids: targets.map((student) => student.id),
        school_year: schoolYear,
      });
      notify(response.message, 'success');
      await refreshAll();
    } catch (error) {
      notify(error.message || 'Could not mark those as printed.', 'error');
    } finally {
      setSaving(false);
    }
  }, [schoolYear, notify, refreshAll]);

  const runRelease = useCallback(async (targets, payload) => {
    setSaving(true);
    try {
      const response = await enrollmentAPI.idReleasing.markReleased({
        student_ids: targets.map((student) => student.id),
        school_year: schoolYear,
        ...payload,
      });
      (response.warnings || []).forEach((warning) => notify(warning, 'error'));
      notify(response.message, 'success');
      await refreshAll();
    } catch (error) {
      notify(error.message || 'Could not release those IDs.', 'error');
    } finally {
      setSaving(false);
    }
  }, [schoolYear, notify, refreshAll]);

  const runReportLost = useCallback(async (student, payload) => {
    setSaving(true);
    try {
      const response = await enrollmentAPI.idReleasing.reportLost(student.card.id, payload);
      notify(response.message, 'success');
      await refreshAll();
    } catch (error) {
      notify(error.message || 'Could not report that ID as lost.', 'error');
    } finally {
      setSaving(false);
    }
  }, [notify, refreshAll]);

  const runReplacement = useCallback(async (student, payload) => {
    setSaving(true);
    try {
      const response = await enrollmentAPI.idReleasing.issueReplacement({
        pre_enrolled_student_id: student.id,
        school_year: schoolYear,
        ...payload,
      });
      notify(response.message, 'success');
      await refreshAll();
    } catch (error) {
      notify(error.message || 'Could not record the replacement.', 'error');
    } finally {
      setSaving(false);
    }
  }, [schoolYear, notify, refreshAll]);

  /** One entry point for every per-card action, so the card stays memoised. */
  const handleAction = useCallback((action, student) => {
    switch (action) {
      case 'print':
        runPrint([student]);
        break;
      case 'release':
        setDialog({ type: 'release', students: [student] });
        break;
      case 'lost':
        if (!student.card) {
          setValidationError({ isOpen: true, message: 'This student has no ID on record to report as lost.' });
          return;
        }
        setDialog({ type: 'lost', student });
        break;
      case 'replace':
        setDialog({ type: 'replace', student });
        break;
      case 'history':
        setDialog({ type: 'history', student });
        break;
      default:
        break;
    }
  }, [runPrint]);

  const handleSelect = useCallback((studentId) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }, []);

  const selectedStudents = useMemo(
    () => students.filter((student) => selected.has(student.id)),
    [students, selected]
  );

  const allOnPageSelected = students.length > 0 && students.every((student) => selected.has(student.id));

  const toggleSelectAll = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allOnPageSelected) students.forEach((student) => next.delete(student.id));
      else students.forEach((student) => next.add(student.id));
      return next;
    });
  };

  const bulkPrint = () => {
    if (selectedStudents.length === 0) {
      setValidationError({ isOpen: true, message: 'Select at least one student first.' });
      return;
    }
    runPrint(selectedStudents);
  };

  const bulkRelease = () => {
    if (selectedStudents.length === 0) {
      setValidationError({ isOpen: true, message: 'Select at least one student first.' });
      return;
    }
    setDialog({ type: 'release', students: selectedStudents });
  };

  // â”€â”€ derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const stats = overview?.stats;
  const supplies = overview?.supplies ?? [];
  const lowStock = supplies.filter((item) => item.is_low);

  const yearOptions = useMemo(
    () => (overview?.school_years ?? []).map((year) => ({ value: year, label: `S.Y. ${year}` })),
    [overview]
  );

  const courseOptions = useMemo(
    () => [
      { value: '', label: 'All courses' },
      ...(overview?.courses ?? []).map((course) => ({
        value: String(course.id),
        label: `${course.code} (${course.students})`,
      })),
    ],
    [overview]
  );

  const yearLevelOptions = useMemo(
    () => [
      { value: '', label: 'All year levels' },
      ...(overview?.year_levels ?? []).map((level) => ({ value: level, label: level })),
    ],
    [overview]
  );

  const changeYear = (year) => {
    setSchoolYear(year);
    setPage(1);
    setSelected(new Set());
    setCourseFilter('');
    setYearLevelFilter('');
    loadOverview(year).catch((error) => notify(error.message || 'Could not switch year.', 'error'));
  };

  if (loading) {
    return (
      <div className="p-6 py-24 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <SuccessAlert
        isVisible={alertState.isVisible}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState((state) => ({ ...state, isVisible: false }))}
      />
      <ValidationErrorModal
        isOpen={validationError.isOpen}
        message={validationError.message}
        onClose={() => setValidationError({ isOpen: false, message: '' })}
      />

      {/* Header */}
      <div className="gradient-soft rounded-2xl p-6 md:p-8 border border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold heading-bold text-gray-900 flex items-center">
            <CreditCard className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
            ID Releasing Management
          </h1>
          <p className="text-gray-600 mt-2">
            Printing, releasing, replacements and supplies — counted per school year.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <MotionDropdown
            value={schoolYear}
            onChange={changeYear}
            options={yearOptions}
            icon={CalendarRange}
            className="min-w-[180px] flex-1 lg:flex-none"
          />
        </div>
      </div>

      {/* Low stock is the one thing worth interrupting the page for */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Supplies running low</p>
            <p className="text-sm text-amber-800">
              {lowStock.map((item) => `${item.name} (${item.on_hand} left)`).join(' Â· ')}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setTab('supplies')}>
            Manage Stock
          </Button>
        </div>
      )}

      {/* Counts for the year */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Enrolled" value={stats?.enrolled ?? 0} icon={Users} tint="bg-red-50 text-red-600" />
        <StatCard
          label="Awaiting Print"
          value={stats?.awaiting_print ?? 0}
          icon={Printer}
          tint="bg-amber-50 text-amber-600"
        />
        <StatCard label="Printed" value={stats?.printed ?? 0} icon={LayoutGrid} tint="bg-blue-50 text-blue-600" />
        <StatCard
          label="Released"
          value={stats?.released ?? 0}
          sub={`${stats?.release_rate ?? 0}% of enrolled`}
          icon={CheckCircle}
          tint="bg-green-50 text-green-600"
        />
        <StatCard label="Reported Lost" value={stats?.lost ?? 0} icon={AlertTriangle} tint="bg-red-50 text-red-600" />
        <StatCard
          label="Replacements"
          value={stats?.replacements ?? 0}
          sub={stats?.fees_collected ? `${peso(stats.fees_collected)} in fees` : undefined}
          icon={RefreshCw}
          tint="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        {[
          { key: 'board', label: 'Releasing Board', icon: CreditCard },
          { key: 'supplies', label: 'Slings & Holders', icon: Boxes },
          { key: 'records', label: 'Records', icon: Receipt },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-md cursor-pointer transition-colors flex items-center gap-2 ${
              tab === item.key ? 'bg-white text-[var(--dominant-red)] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'board' && (
        <>
          <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="relative xl:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search name or ID number..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-10 border border-gray-300"
                />
              </div>
              <MotionDropdown
                value={statusFilter}
                onChange={(value) => { setStatusFilter(value); setPage(1); }}
                options={BOARD_FILTERS}
              />
              <MotionDropdown
                value={courseFilter}
                onChange={(value) => { setCourseFilter(value); setPage(1); }}
                options={courseOptions}
              />
              <MotionDropdown
                value={yearLevelFilter}
                onChange={(value) => { setYearLevelFilter(value); setPage(1); }}
                options={yearLevelOptions}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-gray-500">
              {meta.total} student{meta.total === 1 ? '' : 's'} in S.Y. {schoolYear}
            </span>

            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="flex items-center gap-2"
                >
                  <Badge className="bg-gray-900 text-white">{selected.size} selected</Badge>
                  <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                  <Button size="sm" variant="outline" onClick={bulkPrint} disabled={saving}>
                    <Printer size={14} className="mr-1.5" /> Mark Printed
                  </Button>
                  <Button size="sm" className="gradient-primary text-white" onClick={bulkRelease} disabled={saving}>
                    <Check size={14} className="mr-1.5" /> Release
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Card>
            <CardContent className="p-0">
              {boardLoading ? (
                <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
              ) : students.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <p className="font-semibold">No students found.</p>
                  <p className="text-sm">Nothing matches these filters for S.Y. {schoolYear}.</p>
                </div>
              ) : (
                <StudentIdTable
                  students={students}
                  selected={selected}
                  onSelect={handleSelect}
                  onSelectAll={toggleSelectAll}
                  allSelected={allOnPageSelected}
                  onAction={handleAction}
                />
              )}

              {meta.last_page > 1 && (
                <div className="p-3 border-t flex items-center justify-between">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'supplies' && (
        <SuppliesTab
          schoolYear={schoolYear}
          notify={notify}
          canDelete={Boolean(overview?.can?.delete)}
          onChanged={() => loadOverview(schoolYear).catch(() => {})}
        />
      )}

      {tab === 'records' && (
        <RecordsTab
          schoolYear={schoolYear}
          schoolYears={overview?.school_years ?? []}
          notify={notify}
          canDelete={Boolean(overview?.can?.delete)}
          onChanged={() => loadOverview(schoolYear).catch(() => {})}
        />
      )}

      <AnimatePresence>
        {dialog?.type === 'release' && (
          <ReleaseModal
            students={dialog.students}
            supplies={supplies}
            isSaving={saving}
            onClose={() => setDialog(null)}
            onConfirm={(payload) => runRelease(dialog.students, payload)}
          />
        )}
        {dialog?.type === 'lost' && (
          <LostIdModal
            student={dialog.student}
            isSaving={saving}
            onClose={() => setDialog(null)}
            onConfirm={(payload) => runReportLost(dialog.student, payload)}
          />
        )}
        {dialog?.type === 'replace' && (
          <ReplacementModal
            student={dialog.student}
            isSaving={saving}
            onClose={() => setDialog(null)}
            onConfirm={(payload) => runReplacement(dialog.student, payload)}
          />
        )}
        {dialog?.type === 'history' && (
          <IdHistoryModal student={dialog.student} onClose={() => setDialog(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IDReleasing;
