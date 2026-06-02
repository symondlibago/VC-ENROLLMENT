import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, X, Inbox, Award, Megaphone, ClipboardList, Trash2,
} from 'lucide-react';
import { lmsNotificationsAPI } from '../api/lmsApi';

const POLL_MS = 60_000;

const fmtRel = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString();
};

const iconFor = (type) => {
  if (type === 'grade_posted') return Award;
  if (type === 'assignment_created') return ClipboardList;
  if (type === 'announcement_posted') return Megaphone;
  return Inbox;
};

const LmsNotifBell = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const refresh = (silent = true) => {
    if (!silent) setLoading(true);
    lmsNotificationsAPI.list({ limit: 20 })
      .then((res) => {
        setItems(res?.data?.items || []);
        setUnread(res?.data?.unread_count ?? 0);
      })
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false); });
  };

  const refreshCount = () => {
    lmsNotificationsAPI.unreadCount()
      .then((res) => setUnread(res?.data?.unread_count ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    refresh(true);
    const t = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(t);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) refresh(false);
  };

  const handleItemClick = async (n) => {
    if (!n.read_at) {
      try { await lmsNotificationsAPI.markRead(n.id); } catch {}
      setItems((cur) => cur.map((i) => i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i));
      setUnread((c) => Math.max(0, c - 1));
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await lmsNotificationsAPI.markAllRead();
      setItems((cur) => cur.map((i) => ({ ...i, read_at: i.read_at || new Date().toISOString() })));
      setUnread(0);
    } catch {}
  };

  const handleRemove = async (e, n) => {
    e.stopPropagation();
    try {
      await lmsNotificationsAPI.remove(n.id);
      setItems((cur) => cur.filter((i) => i.id !== n.id));
      if (!n.read_at) setUnread((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div className="relative" ref={wrapRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:text-(--dominant-red) hover:bg-(--whitish-pink) transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-(--dominant-red) text-white text-[10px] font-bold flex items-center justify-center shadow"
          >
            {unread > 99 ? '99+' : unread}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                {unread > 0 && (
                  <span className="text-[10px] bg-(--dominant-red) text-white rounded-full px-1.5 py-0.5 font-bold">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="inline-flex items-center text-[11px] text-(--dominant-red) hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="text-xs text-gray-500 py-8 text-center">Loading…</p>
              ) : items.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">You're all caught up.</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Grades, assignments and announcements will land here.
                  </p>
                </div>
              ) : (
                <ul>
                  {items.map((n) => {
                    const Icon = iconFor(n.type);
                    const unreadItem = !n.read_at;
                    return (
                      <li
                        key={n.id}
                        onClick={() => handleItemClick(n)}
                        className={`group px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                          unreadItem ? 'bg-(--whitish-pink)/30 hover:bg-(--whitish-pink)/60' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            unreadItem ? 'bg-(--dominant-red) text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-snug ${unreadItem ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                                {n.title}
                              </p>
                              <button
                                onClick={(e) => handleRemove(e, n)}
                                className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-red-600 p-0.5"
                                title="Dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {n.body && (
                              <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">{fmtRel(n.created_at)}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-[10px] text-gray-400">
                Showing last {items.length} {items.length === 1 ? 'notification' : 'notifications'}.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LmsNotifBell;
