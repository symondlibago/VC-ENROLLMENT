import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, Pin, Pencil, Trash2, Users, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { lmsAnnouncementsAPI } from '../api/lmsApi';
import CreateAnnouncementModal from '../modals/CreateAnnouncementModal';

const noop = () => {};
const noopConfirm = ({ onConfirm }) => onConfirm?.();

const fmtRel = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Embeddable announcements feed for a subject. Used inside LmsSubjectDetail.
 * Parent supplies notification handlers (success / error / confirmDelete) so
 * we can re-use the SMS-style alert + modal patterns.
 */
const SubjectAnnouncementsPanel = ({
  subjectId,
  canManage,
  notifications = {},
}) => {
  const notifySuccess = notifications.success || noop;
  const notifyError = notifications.error || noop;
  const confirmDelete = notifications.confirmDelete || noopConfirm;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const load = () => {
    setLoading(true);
    lmsAnnouncementsAPI.listBySubject(subjectId)
      .then((res) => setItems(res?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [subjectId]);

  const handleDelete = (a) => {
    confirmDelete({
      title: 'Delete announcement',
      itemName: a.title,
      message: 'This announcement will be removed for everyone. This cannot be undone.',
      onConfirm: async () => {
        try {
          await lmsAnnouncementsAPI.remove(a.id);
          notifySuccess('Announcement deleted.');
          load();
        } catch (err) {
          notifyError(err?.message || 'Failed to delete the announcement.');
        }
      },
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Announcements</p>
            <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {items.length}
            </span>
          </div>
          {canManage && (
            <Button
              size="sm"
              className="gradient-primary text-white liquid-button"
              onClick={() => { setEditTarget(null); setShowCreate(true); }}
            >
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 px-4 text-center">
            <Megaphone className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No announcements yet.</p>
            {canManage && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                Click "New" to post a message to your students.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((a) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`relative rounded-xl border p-4 transition-colors ${
                    a.pinned
                      ? 'bg-(--whitish-pink)/40 border-(--dominant-red)/25'
                      : 'bg-white border-gray-200 hover:border-(--dominant-red)/30'
                  }`}
                >
                  {a.pinned && (
                    <span className="absolute -top-2 -left-2 inline-flex items-center gap-1 text-[10px] font-semibold bg-(--dominant-red) text-white rounded-full px-2 py-0.5 shadow">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                      {a.body && (
                        <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
                          {a.body}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fmtRel(a.created_at)}
                        </span>
                        {a.creator?.name && (
                          <span className="inline-flex items-center gap-1">
                            · by {a.creator.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                          <Users className="w-3 h-3" /> {a.section?.name || 'All sections'}
                        </span>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="p-1.5 text-gray-600 hover:text-(--dominant-red) hover:bg-(--whitish-pink) rounded-md transition"
                          onClick={() => { setEditTarget(a); setShowCreate(true); }}
                          title="Edit announcement"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                          onClick={() => handleDelete(a)}
                          title="Delete announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>

      <CreateAnnouncementModal
        isOpen={showCreate}
        subjectId={subjectId}
        editing={editTarget}
        onClose={() => { setShowCreate(false); setEditTarget(null); }}
        onSuccess={({ title }) => {
          setShowCreate(false);
          setEditTarget(null);
          notifySuccess(editTarget ? `"${title}" updated.` : `"${title}" posted.`);
          load();
        }}
        onValidationError={(msg) => notifyError(msg)}
      />
    </Card>
  );
};

export default SubjectAnnouncementsPanel;
