import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, FileDown, Trash2, CalendarRange } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';
import { downloadCsv } from '@/lib/csv';

import MotionDropdown from './MotionDropdown';
import { CARD_REASON, CARD_STATUS, formatDate, peso } from './constants';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'For printing' },
  { value: 'printed', label: 'Printed' },
  { value: 'released', label: 'Released' },
  { value: 'lost', label: 'Lost' },
  { value: 'voided', label: 'Voided' },
];

/**
 * The year's card log — every print, release and replacement, in one list.
 *
 * This is the view that answers "what happened to this student's ID", which
 * the old board could not, because it only ever held the latest state.
 */
const RecordsTab = ({ schoolYear, schoolYears = [], notify, canDelete, onChanged }) => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [replacementsOnly, setReplacementsOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // The log has its own year, so you can look back without moving the board
  // and the headline counts off the year you are working in.
  const [year, setYear] = useState(schoolYear);

  useEffect(() => {
    setYear(schoolYear);
    setPage(1);
  }, [schoolYear]);

  const yearOptions = useMemo(
    () => schoolYears.map((value) => ({ value, label: `S.Y. ${value}` })),
    [schoolYears]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await enrollmentAPI.idReleasing.records({
        school_year: year,
        search: debounced || undefined,
        status: status || undefined,
        replacements_only: replacementsOnly ? 1 : undefined,
        page,
        per_page: 25,
      });
      setRows(response.data || []);
      setMeta(response.meta || { current_page: 1, last_page: 1, total: 0 });
    } catch (error) {
      notify(error.message || 'Could not load the records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [year, debounced, status, replacementsOnly, page, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const removeCard = async (row) => {
    try {
      const response = await enrollmentAPI.idReleasing.deleteCard(row.id);
      notify(response.message, 'success');
      load();
      onChanged?.();
    } catch (error) {
      notify(error.message || 'Could not remove that record.', 'error');
    }
  };

  /** Exports what is on screen, not the whole year, so the filters mean something. */
  const exportCsv = async () => {
    try {
      const response = await enrollmentAPI.idReleasing.records({
        school_year: year,
        search: debounced || undefined,
        status: status || undefined,
        replacements_only: replacementsOnly ? 1 : undefined,
        per_page: 100,
        page: 1,
      });

      const all = response.data || [];
      if (all.length === 0) {
        notify('Nothing to export with these filters.', 'error');
        return;
      }

      downloadCsv(
        `id-records-${year}.csv`,
        [
          { key: 'school_year', label: 'School Year' },
          { key: 'student_id_number', label: 'Student ID' },
          { key: 'name', label: 'Name' },
          { key: 'course', label: 'Course' },
          { key: 'year_level', label: 'Year Level' },
          { key: 'copy', label: 'Copy' },
          { key: 'reason', label: 'Reason' },
          { key: 'status', label: 'Status' },
          { key: 'printed_at', label: 'Printed' },
          { key: 'released_at', label: 'Released' },
          { key: 'reported_lost_at', label: 'Reported Lost' },
          { key: 'fee', label: 'Fee' },
          { key: 'or_number', label: 'O.R.' },
          { key: 'received_by', label: 'Received By' },
          { key: 'remarks', label: 'Remarks' },
        ],
        all.map((row) => ({
          school_year: row.school_year,
          student_id_number: row.student.student_id_number ?? '',
          name: row.student.name ?? '',
          course: row.student.course ?? '',
          year_level: row.student.year_level ?? '',
          copy: row.copy_label,
          reason: CARD_REASON[row.reason] ?? row.reason,
          status: CARD_STATUS[row.status]?.label ?? row.status,
          printed_at: row.printed_at ?? '',
          released_at: row.released_at ?? '',
          reported_lost_at: row.reported_lost_at ?? '',
          fee: row.fee ?? '',
          or_number: row.or_number ?? '',
          received_by: row.received_by ?? '',
          remarks: row.remarks ?? '',
        }))
      );

      notify(`${all.length} record(s) exported.`, 'success');
    } catch (error) {
      notify(error.message || 'Could not export the records.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3">
          <MotionDropdown
            value={year}
            onChange={(picked) => { setYear(picked); setPage(1); }}
            options={yearOptions}
            icon={CalendarRange}
            className="w-full lg:w-48 shrink-0"
          />

          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search a student by name or ID number..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10 border border-gray-300"
            />
          </div>

          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                  status === tab.value ? 'bg-white text-[var(--dominant-red)] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant={replacementsOnly ? 'default' : 'outline'}
            onClick={() => { setReplacementsOnly((value) => !value); setPage(1); }}
            className={replacementsOnly ? 'gradient-primary text-white' : ''}
          >
            Replacements only
          </Button>

          <Button variant="outline" onClick={exportCsv}>
            <FileDown className="w-4 h-4 mr-2" /> Export
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              No ID records match these filters for S.Y. {year}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Copy</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Printed</th>
                    <th className="px-4 py-3">Released</th>
                    <th className="px-4 py-3">Fee</th>
                    {canDelete && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => {
                    const look = CARD_STATUS[row.status] ?? CARD_STATUS.pending;

                    return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{row.student.name}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {row.student.student_id_number}
                            {row.student.course ? ` · ${row.student.course}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={row.is_replacement ? 'font-semibold text-purple-700' : 'text-gray-600'}>
                            {row.copy_label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {CARD_REASON[row.reason] ?? row.reason}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${look.tone} border text-[11px]`}>{look.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(row.printed_at)}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatDate(row.released_at)}
                          {row.released_by_name && (
                            <span className="block text-gray-400">by {row.released_by_name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {row.fee ? peso(row.fee) : '—'}
                          {row.or_number && <span className="block text-gray-400 font-mono">{row.or_number}</span>}
                        </td>
                        {canDelete && (
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600"
                              onClick={() => removeCard(row)}
                              title="Remove this card record"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="p-3 border-t flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} record(s)
              </span>
              <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordsTab;
