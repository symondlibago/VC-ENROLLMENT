import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Layers, Inbox, ArrowRight, BarChart3, Clock, ClipboardList,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { lmsSubjectsAPI, lmsAuthAPI, lmsDashboardAPI } from '../api/lmsApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const daysUntil = (d) => {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const LmsDashboard = () => {
  const navigate = useNavigate();
  const user = lmsAuthAPI.getUser();
  const role = (user?.lms_role || user?.role || '').toLowerCase();

  const [subjects, setSubjects] = useState([]);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      lmsSubjectsAPI.list().then((r) => r?.data || []).catch(() => []),
      lmsDashboardAPI.me().then((r) => r?.data || null).catch(() => null),
    ])
      .then(([subs, d]) => {
        setSubjects(subs);
        setDash(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = dash?.stats || {};

  return (
    <motion.div
      className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl gradient-primary text-white shadow-lg">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold !text-white !bg-none">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-white/85 text-sm mt-1 max-w-md">
                {role === 'admin' && 'Oversee LMS subjects, instructors, content and student work.'}
                {role === 'instructor' && 'Stay on top of modules, deadlines and submissions for your subjects.'}
                {role === 'student' && 'Track upcoming deadlines, submit work and review your grades.'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 min-w-[280px]">
              {role === 'student' && (
                <>
                  <HeroStat label="Subjects" value={stats.subjects ?? 0} />
                  <HeroStat label="Pending" value={stats.pending ?? 0} accent={stats.pending > 0} />
                  <HeroStat label="Graded" value={stats.graded ?? 0} />
                </>
              )}
              {role === 'instructor' && (
                <>
                  <HeroStat label="Subjects" value={stats.subjects ?? 0} />
                  <HeroStat label="Modules" value={stats.modules ?? 0} />
                  <HeroStat label="Ungraded" value={stats.ungraded ?? 0} accent={stats.ungraded > 0} />
                </>
              )}
              {role === 'admin' && (
                <>
                  <HeroStat label="Subjects" value={stats.subjects ?? 0} />
                  <HeroStat label="Modules" value={stats.modules ?? 0} />
                  <HeroStat label="Ungraded" value={stats.ungraded ?? 0} accent={stats.ungraded > 0} />
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI cards row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={BookOpen}
          label="Subjects"
          value={loading ? '…' : (stats.subjects ?? subjects.length)}
          hint={role === 'student' ? 'Your enrolled subjects' : role === 'instructor' ? 'Subjects you teach' : 'All LMS subjects'}
          onClick={() => navigate('/lms/subjects')}
        />
        {role === 'student' && (
          <>
            <KpiCard icon={ClipboardList} label="Assignments" value={loading ? '…' : (stats.assignments ?? 0)} hint="Visible to you" />
            <KpiCard icon={CheckCircle2} label="Submitted" value={loading ? '…' : (stats.submitted ?? 0)} hint="Including ungraded" />
            <KpiCard icon={BarChart3} label="Gradebook" value="Open" hint="See scores & feedback" onClick={() => navigate('/lms/gradebook')} />
          </>
        )}
        {(role === 'instructor' || role === 'admin') && (
          <>
            <KpiCard icon={Layers} label="Modules" value={loading ? '…' : (stats.modules ?? 0)} hint="Published modules" />
            <KpiCard icon={Inbox} label="Submissions" value={loading ? '…' : (stats.submissions ?? '—')} hint="To review" onClick={() => navigate('/lms/submissions')} />
            <KpiCard
              icon={AlertTriangle}
              label="Ungraded"
              value={loading ? '…' : (stats.ungraded ?? 0)}
              hint="Awaiting your feedback"
              accent={(stats.ungraded ?? 0) > 0}
              onClick={() => navigate('/lms/submissions')}
            />
          </>
        )}
      </motion.div>

      {/* Two-column body */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: upcoming/recent feed */}
        <div className="lg:col-span-2">
          {role === 'student' ? (
            <UpcomingDeadlines items={dash?.upcoming || []} loading={loading} navigate={navigate} />
          ) : (
            <RecentSubmissionsList items={dash?.recent_submissions || []} loading={loading} navigate={navigate} />
          )}
        </div>

        {/* Right: subjects list */}
        <div>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Your Subjects</h3>
                </div>
                <button
                  onClick={() => navigate('/lms/subjects')}
                  className="text-xs text-(--dominant-red) hover:underline flex items-center"
                >
                  View all <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
              {loading ? (
                <p className="text-sm text-gray-500 py-2">Loading…</p>
              ) : subjects.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No subjects available yet.</p>
              ) : (
                <ul className="divide-y">
                  {subjects.slice(0, 8).map((s) => (
                    <li
                      key={s.id}
                      className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                      onClick={() => navigate(`/lms/subjects/${s.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{s.subject_code}</p>
                        <p className="text-[11px] text-gray-500 truncate">{s.descriptive_title}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
};

const HeroStat = ({ label, value, accent }) => (
  <div className={`rounded-xl px-2 py-2 text-center ${accent ? 'bg-white/25' : 'bg-white/10'} backdrop-blur`}>
    <p className="text-[10px] uppercase tracking-wider text-white/85 font-semibold">{label}</p>
    <p className="text-xl font-bold leading-tight">{value}</p>
  </div>
);

const KpiCard = ({ icon: Icon, label, value, hint, onClick, accent }) => (
  <Card className={`card-hover transition-colors ${onClick ? 'cursor-pointer' : ''} ${accent ? 'border-(--dominant-red)/30' : ''}`} onClick={onClick}>
    <CardContent className="p-5 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${accent ? 'text-(--dominant-red)' : 'text-gray-900'}`}>{value}</p>
        {hint && <p className="text-[11px] text-gray-500 mt-1 truncate">{hint}</p>}
      </div>
      <div className="w-11 h-11 rounded-xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
    </CardContent>
  </Card>
);

const UpcomingDeadlines = ({ items, loading, navigate }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Upcoming Deadlines</h3>
        </div>
        <button
          onClick={() => navigate('/lms/gradebook')}
          className="text-xs text-(--dominant-red) hover:underline flex items-center"
        >
          Gradebook <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <CheckCircle2 className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
          <p className="text-sm text-gray-500">Nothing due in the near future.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => {
            const d = daysUntil(a.due_at);
            const urgent = d !== null && d <= 2;
            return (
              <li
                key={a.id}
                className={`rounded-xl border p-3 hover:shadow-sm transition-all cursor-pointer ${
                  urgent ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300' : 'border-gray-200 bg-white hover:border-(--dominant-red)/30'
                }`}
                onClick={() => navigate(`/lms/subjects/${a.subject_id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {a.subject_code} · {a.module_title}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[11px] font-semibold ${urgent ? 'text-amber-800' : 'text-gray-700'}`}>
                      {fmtDateTime(a.due_at)}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${a.submitted ? 'text-green-700' : urgent ? 'text-amber-700' : 'text-gray-500'}`}>
                      {a.submitted
                        ? 'Submitted'
                        : d === 0 ? 'Due today' : d > 0 ? `in ${d} day${d === 1 ? '' : 's'}` : 'Overdue'}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CardContent>
  </Card>
);

const RecentSubmissionsList = ({ items, loading, navigate }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
            <Inbox className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Awaiting Your Review</h3>
        </div>
        <button
          onClick={() => navigate('/lms/submissions')}
          className="text-xs text-(--dominant-red) hover:underline flex items-center"
        >
          Open submissions <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <CheckCircle2 className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
          <p className="text-sm text-gray-500">No ungraded submissions right now. Nice!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-gray-200 bg-white p-3 hover:border-(--dominant-red)/30 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => navigate('/lms/submissions')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.student?.name || 'Student'}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {s.subject_code} · {s.assignment_title}
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 shrink-0">{fmtDateTime(s.submitted_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

export default LmsDashboard;
