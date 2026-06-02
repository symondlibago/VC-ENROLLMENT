import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, Pin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MotionDropdown from '../ui/MotionDropdown';
import { lmsAnnouncementsAPI, lmsSubjectsAPI } from '../api/lmsApi';

const INPUT_BORDER = 'bg-white border border-gray-300 focus:border-(--dominant-red) focus:ring-1 focus:ring-(--dominant-red)/30';

const CreateAnnouncementModal = ({
  isOpen,
  subjectId,
  editing = null, // existing announcement to edit, or null for create
  onClose,
  onSuccess,
  onValidationError,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [sectionId, setSectionId] = useState('');
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);

  // Hydrate from "editing" when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setTitle(editing.title || '');
      setBody(editing.body || '');
      setPinned(!!editing.pinned);
      setSectionId(editing.section_id ? String(editing.section_id) : '');
    } else {
      setTitle('');
      setBody('');
      setPinned(false);
      setSectionId('');
    }
  }, [isOpen, editing]);

  // Load sections relevant to this user for this subject
  useEffect(() => {
    if (!isOpen || !subjectId) return;
    lmsSubjectsAPI.sections(subjectId)
      .then((res) => setSections(res?.data || []))
      .catch(() => setSections([]));
  }, [isOpen, subjectId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      onValidationError?.('Title is required.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await lmsAnnouncementsAPI.update(editing.id, {
          title: title.trim(),
          body: body.trim() || null,
          pinned,
        });
      } else {
        await lmsAnnouncementsAPI.create({
          subject_id: Number(subjectId),
          section_id: sectionId ? Number(sectionId) : null,
          title: title.trim(),
          body: body.trim() || null,
          pinned,
        });
      }
      onSuccess?.({ title: title.trim() });
    } catch (err) {
      onValidationError?.(err?.message || 'Failed to save the announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !saving && onClose?.()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div className="gradient-primary px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate">
                    {editing ? 'Edit announcement' : 'New announcement'}
                  </h3>
                  <p className="text-xs text-white/85 truncate">
                    {editing ? 'Update the message visible to your students.' : 'Post a message to your students for this subject.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !saving && onClose?.()}
                className="w-9 h-9 rounded-lg hover:bg-white/20 transition flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ann-title" className="text-xs font-semibold text-gray-700">
                  Title <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="ann-title"
                  placeholder="e.g. Module 3 reading uploaded"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={saving}
                  className={INPUT_BORDER}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ann-body" className="text-xs font-semibold text-gray-700">
                  Message
                </Label>
                <Textarea
                  id="ann-body"
                  placeholder="What do you want your students to know?"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={saving}
                  rows={6}
                  className={INPUT_BORDER}
                />
              </div>

              {!editing && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Audience</Label>
                  <MotionDropdown
                    value={sectionId}
                    onChange={setSectionId}
                    icon={Users}
                    options={[
                      { value: '', label: 'All sections', hint: 'Every student enrolled in this subject' },
                      ...sections.map((s) => ({ value: String(s.id), label: s.name, hint: 'Section-specific' })),
                    ]}
                  />
                  <p className="text-[11px] text-gray-500">
                    Pick a specific section to limit who sees this announcement.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  disabled={saving}
                  className="rounded border-gray-300 text-(--dominant-red) focus:ring-(--dominant-red)/30"
                />
                <Pin className="w-4 h-4 text-(--dominant-red)" />
                Pin this announcement to the top of the feed
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => !saving && onClose?.()} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-primary text-white liquid-button min-w-36" disabled={saving}>
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : (editing ? 'Save changes' : <>Post announcement</>)}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateAnnouncementModal;
