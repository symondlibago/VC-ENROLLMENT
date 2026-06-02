import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, BookOpen, CheckCircle2, ChevronDown, Clock, AlertTriangle,
  Award, Layers, ClipboardList, FileText, Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { lmsGradebookAPI, lmsAuthAPI } from '../api/lmsApi';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const statusBadge = (status) => {
  switch (status) {
    case 'graded':
      return { label: 'Graded', cls: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2 };
    case 'submitted':
      return { label: 'Submitted · awaiting grade', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: Clock };
    case 'missing':
      return { label: 'Missing', cls: 'bg-red-50 text-red-700 border-red-200', Icon: AlertTriangle };
    case 'pending':
    default:
      return { label: 'Not submitted', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock };
  }
};

const LmsGradebook = () => {
  const navigate = useNavigate();
  const user = lmsAuthAPI.getUser();
  const role = (user?.lms_role || user?.role || '').toLowerCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (role !== 'student') return;
    setLoading(true);
    lmsGradebookAPI.mine()
      .then((res) => setData(res?.data || null))
      .catch((e) => setError(e?.message || 'Failed to load gradebook.'))
      .finally(() => setLoading(false));
  }, [role]);

  if (role !== 'student') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">The Gradebook view is only available for students.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" color="red" /></div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-red-700">{error}</div>;
  }

  const subjects = (data?.subjects || []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.subject_code || '').toLowerCase().includes(q) ||
           (s.descriptive_title || '').toLowerCase().includes(q);
  });

  const totals = data?.totals || {};

  return (
    <motion.div
      className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero summary */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl gradient-primary text-white shadow-lg">
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-white/5" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/75 font-semibold">My Gradebook</p>
                <h2 className="text-2xl font-bold leading-tight">
                  {totals.average_percent !== null && totals.average_percent !== undefined
                    ? `${totals.average_percent}% overall`
                    : 'No grades yet'}
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Weighted average across {totals.graded || 0} graded {totals.graded === 1 ? 'assignment' : 'assignments'}.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 min-w-[300px]">
              {[
                { label: 'Total', value: totals.assignments ?? 0 },
                { label: 'Submitted', value: totals.submitted ?? 0 },
                { label: 'Graded', value: totals.graded ?? 0 },
                { label: 'Missing', value: totals.missing ?? 0 },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl px-2 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">{s.label}</p>
                  <p className="text-lg font-bold leading-tight">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search subjects…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-gray-500">{subjects.length} subjects</span>
          </CardContent>
        </Card>
      </motion.div>

      {subjects.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-gray-700">No assignments yet</p>
              <p className="text-xs text-gray-500 mt-1">Your gradebook will populate once your instructors post assignments.</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {subjects.map((s) => {
            const isOpen = !!expanded[s.id];
            const st = s.stats || {};
            return (
              <Card key={s.id} className={`overflow-hidden transition-colors ${isOpen ? 'border-(--dominant-red)/30 shadow-sm' : 'hover:border-(--dominant-red)/30'}`}>
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                    className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors ${isOpen ? 'bg-(--whitish-pink)/40' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{s.subject_code}</p>
                      <p className="text-xs text-gray-500 truncate">{s.descriptive_title}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[11px] mr-3">
                      <span className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                        {st.graded || 0}/{st.assignments || 0} graded
                      </span>
                      <span className="font-semibold text-(--dominant-red)">
                        {st.average_percent !== null && st.average_percent !== undefined ? `${st.average_percent}%` : '—'}
                      </span>
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400">
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden border-t border-gray-100 bg-gray-50/60"
                      >
                        <div className="p-5 space-y-3">
                          {/* Stat strip */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <StatTile icon={ClipboardList} label="Assignments" value={st.assignments || 0} />
                            <StatTile icon={Clock} label="Submitted" value={st.submitted || 0} />
                            <StatTile icon={CheckCircle2} label="Graded" value={st.graded || 0} />
                            <StatTile icon={Award} label="Average" value={st.average_percent !== null && st.average_percent !== undefined ? `${st.average_percent}%` : '—'} />
                          </div>

                          {/* Assignment list */}
                          {(!s.assignments || s.assignments.length === 0) ? (
                            <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center bg-white">
                              <Layers className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">No assignments published yet.</p>
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {s.assignments.map((a) => {
                                const badge = statusBadge(a.status);
                                const Icon = badge.Icon;
                                const pct = a.submission && a.submission.score !== null && a.submission.score !== undefined
                                  ? Math.round((Number(a.submission.score) / (a.max_score || 100)) * 100)
                                  : null;
                                return (
                                  <li
                                    key={a.id}
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-(--dominant-red)/40 hover:shadow-sm transition-all cursor-pointer"
                                    onClick={() => navigate(`/lms/subjects/${s.id}`)}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                                        <p className="text-[11px] text-gray-500 truncate">{a.module_title}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badge.cls}`}>
                                            <Icon className="w-3 h-3" /> {badge.label}
                                          </span>
                                          {a.due_at && (
                                            <span className="inline-flex items-center text-[10px] text-gray-500 gap-1">
                                              <Clock className="w-3 h-3" /> Due {fmtDate(a.due_at)}
                                            </span>
                                          )}
                                          {a.submission?.feedback && (
                                            <span className="inline-flex items-center text-[10px] text-gray-500 gap-1">
                                              <FileText className="w-3 h-3" /> Feedback
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        {a.status === 'graded' ? (
                                          <>
                                            <p className="text-lg font-bold text-gray-900 leading-tight">
                                              {a.submission.score}
                                              <span className="text-xs font-normal text-gray-500"> / {a.max_score}</span>
                                            </p>
                                            {pct !== null && (
                                              <p className={`text-[10px] font-semibold ${pct >= 75 ? 'text-green-700' : pct >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                                                {pct}%
                                              </p>
                                            )}
                                          </>
                                        ) : (
                                          <p className="text-xs text-gray-400">— / {a.max_score}</p>
                                        )}
                                      </div>
                                    </div>
                                    {a.submission?.feedback && (
                                      <p className="mt-2 text-[11px] italic text-gray-600 bg-gray-50 border border-gray-100 rounded px-2 py-1.5">
                                        "{a.submission.feedback}"
                                      </p>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

export default LmsGradebook;
