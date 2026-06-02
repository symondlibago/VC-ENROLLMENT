import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2,
  AlertTriangle, FileText, BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { lmsCalendarAPI, lmsAuthAPI } from '../api/lmsApi';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Local YYYY-MM-DD key (avoids timezone shifts from toISOString()).
const dayKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const fmtLongDate = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

// Pill / dot colors. Students get status-based colors; instructors & admins
// (status === null) get a neutral "deadline" red.
const eventStyle = (status) => {
  switch (status) {
    case 'graded':    return { dot: 'bg-green-500', pill: 'bg-green-100 text-green-800 border-green-200' };
    case 'submitted': return { dot: 'bg-blue-500',  pill: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'missing':   return { dot: 'bg-red-500',   pill: 'bg-red-100 text-red-800 border-red-200' };
    case 'pending':   return { dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-800 border-amber-200' };
    default:          return { dot: 'bg-(--dominant-red)', pill: 'bg-red-50 text-red-800 border-red-200' };
  }
};

const statusLabel = (status) => {
  switch (status) {
    case 'graded':    return 'Graded';
    case 'submitted': return 'Submitted';
    case 'missing':   return 'Missing';
    case 'pending':   return 'Not submitted';
    default:          return 'Deadline';
  }
};

const LmsCalendar = () => {
  const navigate = useNavigate();
  const user = lmsAuthAPI.getUser();
  const role = (user?.lms_role || user?.role || '').toLowerCase();
  const isStudent = role === 'student';

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 6-week grid (42 cells) starting on the Sunday on/before the 1st.
  const gridDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  // Fetch events for the visible grid range whenever the month changes.
  useEffect(() => {
    const from = dayKey(gridDays[0]);
    const to = dayKey(gridDays[gridDays.length - 1]);
    setLoading(true);
    setError('');
    lmsCalendarAPI.events({ from, to })
      .then((res) => setEvents(res?.data?.events || []))
      .catch((e) => setError(e?.message || 'Failed to load the calendar.'))
      .finally(() => setLoading(false));
  }, [gridDays]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const ev of events) {
      if (!ev.due_at) continue;
      const key = dayKey(new Date(ev.due_at));
      (map[key] ||= []).push(ev);
    }
    Object.values(map).forEach((list) =>
      list.sort((a, b) => new Date(a.due_at) - new Date(b.due_at)),
    );
    return map;
  }, [events]);

  const selectedEvents = eventsByDay[dayKey(selected)] || [];

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => {
    const t = new Date();
    setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelected(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
  };

  const legend = isStudent
    ? [
        { dot: 'bg-amber-500', label: 'Not submitted' },
        { dot: 'bg-blue-500', label: 'Submitted' },
        { dot: 'bg-green-500', label: 'Graded' },
        { dot: 'bg-red-500', label: 'Missing (past due)' },
      ]
    : [{ dot: 'bg-(--dominant-red)', label: 'Assignment deadline' }];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-(--dominant-red) text-white flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h1>
            <p className="text-xs text-gray-500">Assignment deadlines</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={goPrev} title="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} title="Next month">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-gray-600">
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${l.dot}`} /> {l.label}
          </span>
        ))}
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Calendar grid */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {w}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {gridDays.map((d, idx) => {
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = isSameDay(d, today);
                const isSelected = isSameDay(d, selected);
                const dayEvents = eventsByDay[dayKey(d)] || [];

                return (
                  <button
                    key={idx}
                    onClick={() => setSelected(new Date(d))}
                    className={`min-h-[60px] sm:min-h-[84px] border-b border-r border-gray-100 p-1 sm:p-1.5 text-left align-top transition relative
                      ${inMonth ? 'bg-white' : 'bg-gray-50/60'}
                      ${isSelected ? 'ring-2 ring-(--dominant-red) ring-inset z-10' : 'hover:bg-(--whitish-pink)/40'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs
                          ${isToday ? 'bg-(--dominant-red) text-white font-bold' : inMonth ? 'text-gray-700' : 'text-gray-400'}`}
                      >
                        {d.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-semibold text-gray-400">{dayEvents.length}</span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const st = eventStyle(ev.status);
                        return (
                          <div
                            key={ev.id}
                            className={`truncate text-[10px] leading-tight border rounded px-1 py-0.5 ${st.pill}`}
                            title={`${ev.subject_code || ''} · ${ev.title}`}
                          >
                            {ev.subject_code ? `${ev.subject_code} · ` : ''}{ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected-day panel */}
        <Card className="h-fit">
          <CardContent className="p-4">
            <p className="text-sm font-bold text-gray-900">{fmtLongDate(selected)}</p>
            <p className="text-xs text-gray-500 mb-3">
              {loading ? 'Loading…' : `${selectedEvents.length} deadline${selectedEvents.length !== 1 ? 's' : ''}`}
            </p>

            {selectedEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-8 px-3 text-center">
                <CalendarDays className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs text-gray-500">No deadlines on this day.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {selectedEvents.map((ev) => {
                    const st = eventStyle(ev.status);
                    return (
                      <motion.li
                        key={ev.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => ev.subject_id && navigate(`/lms/subjects/${ev.subject_id}`)}
                        className="border border-gray-200 rounded-xl p-3 hover:border-(--dominant-red)/40 hover:shadow-sm cursor-pointer transition"
                      >
                        <div className="flex items-start gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${st.dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
                            {ev.subject_code && (
                              <p className="text-[11px] text-gray-500 inline-flex items-center gap-1 mt-0.5">
                                <BookOpen className="w-3 h-3" /> {ev.subject_code}
                                {ev.module_title ? ` · ${ev.module_title}` : ''}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-[11px] text-gray-600 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Due {fmtTime(ev.due_at)}
                              </span>
                              <span className={`text-[10px] font-semibold border rounded-full px-1.5 py-0.5 ${st.pill}`}>
                                {statusLabel(ev.status)}
                              </span>
                              {ev.allow_late && (
                                <span className="text-[10px] text-amber-700 border border-amber-200 bg-amber-50 rounded-full px-1.5 py-0.5">
                                  Late allowed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LmsCalendar;
