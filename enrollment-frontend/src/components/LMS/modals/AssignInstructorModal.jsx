import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lmsSubjectsAPI } from '../api/lmsApi';

const AssignInstructorModal = ({ subject, onClose, onAssigned, onError }) => {
  const [instructors, setInstructors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    lmsSubjectsAPI.availableInstructors()
      .then((res) => setInstructors(res?.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = instructors.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (i.name || '').toLowerCase().includes(q) ||
           (i.email || '').toLowerCase().includes(q);
  });

  const submit = async () => {
    if (!selected) {
      onError?.('Please pick an instructor before assigning.');
      return;
    }
    setSaving(true);
    try {
      await lmsSubjectsAPI.assignInstructor(subject.id, selected.id);
      onAssigned?.(selected.name);
    } catch (e) {
      onError?.(e?.message || 'Failed to assign instructor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="gradient-primary px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-tight">Assign Instructor</h3>
              <p className="text-xs text-white/85 truncate flex items-center gap-1 mt-0.5">
                <BookOpen className="w-3 h-3" /> {subject.subject_code} · {subject.descriptive_title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-white/20 transition flex items-center justify-center shrink-0"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3 overflow-hidden">
          <div className="space-y-1.5">
            <Label htmlFor="instr-search" className="text-xs font-semibold text-gray-700">
              Search instructors
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="instr-search"
                placeholder="Name or email…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading || saving}
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-72 -mx-1 px-1">
            {loading ? (
              <p className="text-sm text-gray-500 py-6 text-center">Loading instructors…</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-8 px-4 text-center">
                <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {search ? 'No instructors match your search.' : 'No instructors available.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {filtered.map((i) => {
                  const active = selected?.id === i.id;
                  return (
                    <li key={i.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(i)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          active
                            ? 'bg-(--whitish-pink) border-(--dominant-red)/40 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-(--dominant-red)/20 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                          active ? 'bg-(--dominant-red) text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {(i.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${active ? 'text-(--dominant-red)' : 'text-gray-900'}`}>
                            {i.name}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{i.email}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            className="gradient-primary text-white liquid-button min-w-32"
            disabled={!selected || saving}
            onClick={submit}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><UserPlus className="w-4 h-4 mr-1.5" /> Assign</>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AssignInstructorModal;
