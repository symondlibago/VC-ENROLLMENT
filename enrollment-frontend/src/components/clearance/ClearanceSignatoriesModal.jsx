import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Search, ShieldCheck, Users, Check, Loader2, Plus, EyeOff, Eye, Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

/**
 * Who signs which clearance line.
 *
 * Two ways in, because both questions get asked: "who signs the library
 * line" and "what does this person sign". They edit the same pivot, so the
 * screen reloads both after every change rather than trying to keep two
 * views in step by hand.
 */
const ClearanceSignatoriesModal = ({ onClose, notify }) => {
  const [tab, setTab] = useState('lines');
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [openRole, setOpenRole] = useState(null);
  const [openUser, setOpenUser] = useState(null);
  const [addingPerson, setAddingPerson] = useState(false);

  useBodyScrollLock();

  const load = useCallback(async () => {
    try {
      const [roleList, userList] = await Promise.all([
        enrollmentAPI.clearanceRoles.list(),
        enrollmentAPI.clearanceRoles.assignableUsers(),
      ]);
      setRoles(roleList.data || []);
      setUsers(userList.data || []);
    } catch (error) {
      notify(error.message || 'Could not load the clearance lines.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saveRole = async (role, userIds) => {
    setSaving(true);
    try {
      const response = await enrollmentAPI.clearanceRoles.syncRole(role.id, userIds);
      notify(response.message, 'success');
      await load();
      setOpenRole(null);
    } catch (error) {
      notify(error.message || 'Could not update the signatories.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveUser = async (user, roleIds) => {
    setSaving(true);
    try {
      const response = await enrollmentAPI.clearanceRoles.syncUser(user.id, roleIds);
      notify(response.message, 'success');
      await load();
      setOpenUser(null);
    } catch (error) {
      notify(error.message || 'Could not update that account.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (role) => {
    try {
      const response = await enrollmentAPI.clearanceRoles.update(role.id, { is_active: !role.is_active });
      notify(response.message, 'success');
      load();
    } catch (error) {
      notify(error.message || 'Could not update that line.', 'error');
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) => user.name.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term)
    );
  }, [users, search]);

  const unassigned = roles.filter((role) => role.is_active && role.users.length === 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clearance signatories"
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div className="p-5 border-b flex items-start gap-3 shrink-0">
          <div className="bg-red-100 text-red-600 p-2.5 rounded-full shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold heading-bold text-gray-900">Clearance Signatories</h2>
            <p className="text-sm text-gray-500">
              Who signs which line. Anyone given a line gets the clearance board in their sidebar.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 cursor-pointer" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {unassigned.length > 0 && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 shrink-0">
            <strong>{unassigned.length} line(s) have nobody assigned</strong> — no student can be
            fully cleared until someone can sign them: {unassigned.map((role) => role.name).join(', ')}.
          </div>
        )}

        <div className="px-5 pt-3 shrink-0 flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {[
              { key: 'lines', label: 'By line', icon: ShieldCheck },
              { key: 'people', label: 'By person', icon: Users },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-md cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                  tab === item.key ? 'bg-white text-[var(--dominant-red)] shadow-sm' : 'text-gray-500'
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
          </div>

          {tab === 'lines' && (
            <Button
              variant="outline"
              className="ml-auto cursor-pointer"
              onClick={() => setAddingPerson(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" /> New person
            </Button>
          )}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : tab === 'lines' ? (
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-3 rounded-lg border ${role.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm ${role.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {role.name}
                        {role.is_final && (
                          <Badge className="ml-2 bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                            signs last
                          </Badge>
                        )}
                      </p>
                      {role.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {role.users.length === 0 ? (
                          <span className="text-xs text-amber-600">Nobody assigned</span>
                        ) : (
                          role.users.map((user) => (
                            <Badge key={user.id} className="bg-gray-100 text-gray-700 border border-gray-200 text-[11px]">
                              {user.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleActive(role)}
                        disabled={role.is_final}
                        title={role.is_final ? 'The cashier line cannot be retired' : (role.is_active ? 'Retire this line' : 'Restore this line')}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        {role.is_final ? <Lock size={14} /> : role.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 cursor-pointer"
                        onClick={() => setOpenRole(role)}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search an account by name or email..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-10 border border-gray-300"
                  />
                </div>
                {/* Most people on the form — the nurse, security, the council
                    officers — have no account at all until now */}
                <Button
                  className="gradient-primary text-white shrink-0 cursor-pointer"
                  onClick={() => setAddingPerson(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" /> New person
                </Button>
              </div>

              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-3 rounded-lg border border-gray-200 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email} · {user.role}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {user.clearance_roles.length === 0 ? (
                          <span className="text-xs text-gray-400">Signs nothing</span>
                        ) : (
                          user.clearance_roles.map((role) => (
                            <Badge key={role.id} className="bg-red-50 text-red-700 border border-red-200 text-[11px]">
                              {role.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 cursor-pointer"
                      onClick={() => setOpenUser(user)}
                    >
                      Edit
                    </Button>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <p className="py-10 text-center text-sm text-gray-500">No accounts match that search.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {openRole && (
        <PickerSheet
          title={`Who signs "${openRole.name}"?`}
          subtitle="One line can be signed by several people; any one of them clears it."
          options={users.map((user) => ({ id: user.id, label: user.name, hint: `${user.email} · ${user.role}` }))}
          selected={openRole.users.map((user) => user.id)}
          saving={saving}
          onCancel={() => setOpenRole(null)}
          onSave={(ids) => saveRole(openRole, ids)}
        />
      )}

      {addingPerson && (
        <NewSignatorySheet
          roles={roles.filter((role) => role.is_active)}
          notify={notify}
          onCancel={() => setAddingPerson(false)}
          onCreated={async () => {
            setAddingPerson(false);
            await load();
          }}
        />
      )}

      {openUser && (
        <PickerSheet
          title={`What does ${openUser.name} sign?`}
          subtitle="One person can hold several lines — the registrar is often also the guidance counsellor."
          options={roles
            .filter((role) => role.is_active)
            .map((role) => ({ id: role.id, label: role.name, hint: role.description }))}
          selected={openUser.clearance_roles.map((role) => role.id)}
          saving={saving}
          onCancel={() => setOpenUser(null)}
          onSave={(ids) => saveUser(openUser, ids)}
        />
      )}
    </div>
  );
};

/**
 * Creates an account for someone on the clearance form who has none.
 *
 * They are made as 'Staff', which grants nothing on its own — the clearance
 * board is the only thing the account can reach, and only for the lines
 * ticked here. That is why at least one line is required.
 */
const NewSignatorySheet = ({ roles, notify, onCancel, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [chosen, setChosen] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const toggle = (id) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      notify('A name and an email address are needed.', 'error');
      return;
    }
    if (form.password.length < 8) {
      notify('The password needs at least 8 characters.', 'error');
      return;
    }
    if (chosen.size === 0) {
      notify('Choose at least one line for this person to sign.', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await enrollmentAPI.clearanceRoles.createSignatory({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        clearance_role_ids: [...chosen],
      });
      notify(response.message, 'success');
      onCreated();
    } catch (error) {
      notify(
        error.message || error.errors?.email?.[0] || 'Could not create that account.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-5 border-b shrink-0">
          <h3 className="font-bold text-gray-900">Add a signatory</h3>
          <p className="text-xs text-gray-500 mt-1">
            For the people on the clearance form who have no account yet — the nurse, security,
            the council officers. They get a sign-in and the clearance board, and nothing else.
          </p>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <Input
              autoFocus
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Norman Luntad"
              className="border border-gray-300 h-11"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="name@vipc.edu.ph"
                className="border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <Input
                type="text"
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
                className="border border-gray-300"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Shown in plain text so you can pass it on. They can change it later.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lines this person signs
            </label>
            <div className="border border-gray-200 rounded-lg divide-y max-h-56 overflow-y-auto">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                >
                  <Checkbox
                    checked={chosen.has(role.id)}
                    onCheckedChange={() => toggle(role.id)}
                    className="border-2 border-gray-400 data-[state=checked]:bg-[var(--dominant-red)] data-[state=checked]:border-[var(--dominant-red)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-800 truncate">
                      {role.name}
                    </span>
                    {role.users.length > 0 && (
                      <span className="block text-xs text-gray-400 truncate">
                        also signed by {role.users.map((user) => user.name).join(', ')}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="flex-1 gradient-primary text-white cursor-pointer"
            disabled={saving}
            onClick={submit}
          >
            {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : <Check size={15} className="mr-2" />}
            Create ({chosen.size} line{chosen.size === 1 ? '' : 's'})
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/** A tick list that saves the whole set at once. */
const PickerSheet = ({ title, subtitle, options, selected, saving, onCancel, onSave }) => {
  const [chosen, setChosen] = useState(() => new Set(selected));
  const [filter, setFilter] = useState('');

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, filter]);

  const toggle = (id) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="p-5 border-b shrink-0">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter..."
            className="mt-3 border border-gray-300"
          />
        </div>

        <div className="overflow-y-auto flex-1 divide-y">
          {visible.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-gray-50"
            >
              <Checkbox
                checked={chosen.has(option.id)}
                onCheckedChange={() => toggle(option.id)}
                className="border-2 border-gray-400 data-[state=checked]:bg-[var(--dominant-red)] data-[state=checked]:border-[var(--dominant-red)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-800 truncate">{option.label}</span>
                {option.hint && <span className="block text-xs text-gray-400 truncate">{option.hint}</span>}
              </span>
            </label>
          ))}

          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">Nothing matches that filter.</p>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="flex-1 gradient-primary text-white cursor-pointer"
            disabled={saving}
            onClick={() => onSave([...chosen])}
          >
            {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : <Check size={15} className="mr-2" />}
            Save ({chosen.size})
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ClearanceSignatoriesModal;
