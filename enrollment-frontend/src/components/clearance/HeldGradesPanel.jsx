import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ShieldAlert, ArrowRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

/**
 * Grades sitting at INC only because the student has not been cleared.
 *
 * Read-only on purpose. These are not a work queue like the INC records
 * proper — there is no payment to take and no completion to approve. Each
 * one returns to its real result by itself once the clearance is signed, so
 * the useful thing to show is who is still holding it up.
 */
const HeldGradesPanel = ({ notify }) => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  /**
   * Whose holds these are, as the server decided it.
   *
   * An instructor is scoped to the classes they teach. Said out loud, because
   * a short list would otherwise read as "the school has almost no holds"
   * rather than "these are yours".
   */
  const [scope, setScope] = useState('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Held in a ref rather than a dependency.
   *
   * A caller that passes an inline arrow hands over a new function on every
   * render; depending on its identity would rebuild `load`, refire the
   * effect, and — on a request that fails — loop forever reporting the same
   * failure. The ref keeps the latest callback without that coupling.
   */
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

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
      const response = await enrollmentAPI.clearance.heldGrades({
        search: debounced || undefined,
        page,
        per_page: 25,
      });
      setRows(response.data || []);
      setMeta(response.meta || { current_page: 1, last_page: 1, total: 0 });
      setScope(response.meta?.scope || 'all');
      setError('');
    } catch (err) {
      // Shown in place as well as announced: a failure that only flashes a
      // toast leaves a spinner turning with nothing to explain it
      const message = err.message || 'Could not load the held grades.';
      setRows([]);
      setError(message);
      notifyRef.current?.(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">
            Held for clearance{scope === 'own_classes' ? ' — your classes' : ''}
          </p>
          <p className="text-amber-800">
            {scope === 'own_classes'
              ? 'These are the grades you submitted that read INC because the student is not yet cleared for the term. Nothing needs processing here — each one returns to its real result the moment the clearance is signed off.'
              : 'These grades were earned but read INC because the student is not yet cleared for the term. Nothing needs processing here — each one returns to its real result the moment the clearance is signed off.'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search student, ID number or subject code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10 border border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-red-700">That list could not be loaded.</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">{error}</p>
              <Button variant="outline" className="mt-4 cursor-pointer" onClick={load}>
                Try again
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              {scope === 'own_classes'
                ? 'None of the grades you submitted are being held for clearance.'
                : 'No grades are being held for clearance.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Term</th>
                    <th className="px-4 py-3">Will become</th>
                    <th className="px-4 py-3">Waiting on</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{row.student.name}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {row.student.student_id_number}
                          {row.student.course ? ` · ${row.student.course}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{row.subject.code}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[14rem]">{row.subject.name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.term}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[11px]">
                            INC
                          </Badge>
                          <ArrowRight size={12} className="text-gray-400" />
                          <Badge
                            className={`border text-[11px] ${
                              row.held_status === 'Passed'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {row.held_status ?? '—'}
                          </Badge>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.outstanding.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <span className="text-xs text-gray-600">
                            {row.outstanding.slice(0, 2).join(', ')}
                            {row.outstanding.length > 2 && (
                              <span className="text-gray-400">
                                {' '}+{row.outstanding.length - 2} more
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="p-3 border-t flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer">
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} held
              </span>
              <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="cursor-pointer">
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HeldGradesPanel;
