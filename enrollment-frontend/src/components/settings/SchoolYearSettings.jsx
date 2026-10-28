import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarRange, Plus, Pencil, Trash2, Check, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

const FIELD = 'border border-gray-300 focus-visible:border-[var(--dominant-red)]';

/** Asked before a year is removed, since nothing brings it back. */
const RemoveYearModal = ({ year, onCancel, onConfirm, isSaving }) => (
  <div
    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="bg-red-100 p-3 rounded-full">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900">Remove {year.name}?</h2>
        <p className="text-gray-600">
          It will no longer be offered when enrolling a student. No student records are
          filed under it, so nothing else changes.
        </p>
        <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
          You can add it back later, but this particular entry cannot be undone.
        </p>

        <div className="flex gap-3 w-full pt-2">
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 bg-red-600 hover:bg-red-700 cursor-pointer"
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? 'Removing...' : 'Yes, Remove'}
          </Button>
        </div>
      </div>
    </motion.div>
  </div>
);

/**
 * The school years the enrolment screens offer.
 *
 * A year that students are already filed under cannot be renamed or removed,
 * because every table stores the year as text and the records would be
 * orphaned. Hiding it is offered instead, which is what the tick controls.
 */
const SchoolYearSettings = ({ notify }) => {
  const [years, setYears] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  // Removing a year is not undoable, so it is always confirmed first
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await enrollmentAPI.schoolYears.list({ include_inactive: 1 });
      setYears(response.data || []);
      setCanManage(Boolean(response.can?.manage));
    } catch (error) {
      notify?.(error.message || 'Could not load the school years.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  /** The server owns the rules; this only saves a round trip on an obvious slip. */
  const shapeError = (name) =>
    /^\d{4}-\d{4}$/.test(name.trim()) ? null : 'Write the school year as 2026-2027.';

  const add = async () => {
    const error = shapeError(newName);
    if (error) {
      notify?.(error, 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await enrollmentAPI.schoolYears.create({ name: newName.trim() });
      notify?.(response.message, 'success');
      setNewName('');
      setAdding(false);
      load();
    } catch (err) {
      notify?.(err.message || err.errors?.name?.[0] || 'Could not add that school year.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const rename = async (year) => {
    if (editName.trim() === year.name) {
      setEditingId(null);
      return;
    }

    const error = shapeError(editName);
    if (error) {
      notify?.(error, 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await enrollmentAPI.schoolYears.update(year.id, { name: editName.trim() });
      notify?.(response.message, 'success');
      setEditingId(null);
      load();
    } catch (err) {
      notify?.(err.message || err.errors?.name?.[0] || 'Could not rename that school year.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (year) => {
    try {
      const response = await enrollmentAPI.schoolYears.update(year.id, { is_active: !year.is_active });
      notify?.(response.message, 'success');
      load();
    } catch (err) {
      notify?.(err.message || 'Could not update that school year.', 'error');
    }
  };

  const remove = async () => {
    if (!confirming) return;

    setSaving(true);
    try {
      const response = await enrollmentAPI.schoolYears.remove(confirming.id);
      notify?.(response.message, 'success');
      setConfirming(null);
      load();
    } catch (err) {
      notify?.(err.message || 'Could not remove that school year.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <AnimatePresence>
        {confirming && (
          <RemoveYearModal
            year={confirming}
            isSaving={saving}
            onCancel={() => setConfirming(null)}
            onConfirm={remove}
          />
        )}
      </AnimatePresence>

      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center">
            <CalendarRange className="w-6 h-6 mr-3 text-red-800" />
            School Years
          </CardTitle>
          <CardDescription>
            The years offered when enrolling a student. Hide one with the eye to keep it out of the pickers.
          </CardDescription>
        </div>

        {canManage && !adding && (
          <Button
            className="gradient-primary text-white shrink-0 cursor-pointer"
            onClick={() => setAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Year
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-10 flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {adding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                    <Input
                      autoFocus
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') add();
                        if (event.key === 'Escape') { setAdding(false); setNewName(''); }
                      }}
                      placeholder="2028-2029"
                      className={`${FIELD} max-w-40 font-mono`}
                    />
                    <Button
                      size="sm"
                      onClick={add}
                      disabled={saving}
                      className="gradient-primary text-white cursor-pointer"
                    >
                      <Check size={14} className="mr-1" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="cursor-pointer"
                      onClick={() => { setAdding(false); setNewName(''); }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {years.map((year) => {
              const isEditing = editingId === year.id;
              const locked = year.students > 0;

              return (
                <div
                  key={year.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    year.is_active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Input
                        autoFocus
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') rename(year);
                          if (event.key === 'Escape') setEditingId(null);
                        }}
                        className={`${FIELD} max-w-40 font-mono`}
                      />
                      <Button
                        size="sm"
                        onClick={() => rename(year)}
                        disabled={saving}
                        className="gradient-primary text-white cursor-pointer"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="cursor-pointer"
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                      >
                        <X size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`font-mono font-semibold ${
                          year.is_active ? 'text-gray-900' : 'text-gray-400 line-through'
                        }`}
                      >
                        {year.name}
                      </span>

                      {year.students > 0 && (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                          {year.students} student{year.students === 1 ? '' : 's'}
                        </Badge>
                      )}

                      {!year.is_active && (
                        <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-[11px]">
                          Hidden
                        </Badge>
                      )}

                      {canManage && (
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggle(year)}
                            title={year.is_active ? 'Hide from the pickers' : 'Show in the pickers'}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-700"
                          >
                            {year.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>

                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => { setEditingId(year.id); setEditName(year.name); }}
                            title={
                              locked
                                ? 'Students are filed under this year, so it cannot be renamed'
                                : 'Rename'
                            }
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => setConfirming(year)}
                            title={
                              locked
                                ? 'Students are filed under this year — hide it instead'
                                : 'Remove'
                            }
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {years.length === 0 && !adding && (
              <p className="py-8 text-center text-sm text-gray-500">
                No school years stored yet — the enrolment screens are using their built-in list.
              </p>
            )}

            {!canManage && (
              <p className="text-xs text-gray-400 pt-2">
                Only an admin or registrar can change this list.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SchoolYearSettings;
