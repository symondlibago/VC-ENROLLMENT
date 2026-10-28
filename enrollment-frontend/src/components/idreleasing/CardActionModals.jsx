import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

import ModalShell, { Field, FIELD_CLASS } from './ModalShell';
import { REPLACEMENT_REASONS, peso } from './constants';

/**
 * Hand IDs over.
 *
 * The slings and holders that go out with the cards are counted here, because
 * the moment of release is the only point at which anyone actually knows how
 * many went out. Quantities are per student, so releasing thirty cards with a
 * sling each takes thirty slings off the stock.
 */
export const ReleaseModal = ({ students, supplies, onClose, onConfirm, isSaving }) => {
  const count = students.length;
  const single = count === 1 ? students[0] : null;

  const [receivedBy, setReceivedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  // One of everything goes out with a card unless the desk says otherwise
  const [lines, setLines] = useState(() =>
    Object.fromEntries(supplies.map((item) => [item.id, 1]))
  );

  const setLine = (id, value) =>
    setLines((prev) => ({ ...prev, [id]: Math.max(0, Number(value) || 0) }));

  const shortfalls = useMemo(
    () =>
      supplies
        .map((item) => ({ item, needed: (lines[item.id] ?? 0) * count }))
        .filter(({ item, needed }) => needed > 0 && needed > item.on_hand),
    [supplies, lines, count]
  );

  return (
    <ModalShell
      title={single ? `Release ${single.name}'s ID` : `Release ${count} IDs`}
      subtitle={single ? single.student_id_number : 'The same supplies are issued to each student.'}
      icon={Check}
      tone="bg-green-100 text-green-600"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            className="flex-1 gradient-primary text-white"
            disabled={isSaving}
            onClick={() =>
              onConfirm({
                received_by: receivedBy.trim() || null,
                remarks: remarks.trim() || null,
                supplies: Object.entries(lines)
                  .filter(([, quantity]) => quantity > 0)
                  .map(([id, quantity]) => ({
                    id_supply_item_id: Number(id),
                    quantity: quantity * count,
                  })),
              })
            }
          >
            {isSaving ? 'Releasing…' : count === 1 ? 'Release ID' : `Release ${count} IDs`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Received by" hint="Leave blank if the student collected it themselves.">
          <Input
            value={receivedBy}
            onChange={(event) => setReceivedBy(event.target.value)}
            placeholder="Parent, guardian or representative"
            className={FIELD_CLASS}
          />
        </Field>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Issued with the ID</p>
          <div className="space-y-2">
            {supplies.length === 0 && (
              <p className="text-sm text-gray-400">No supplies are being tracked yet.</p>
            )}
            {supplies.map((item) => {
              const perStudent = lines[item.id] ?? 0;
              const needed = perStudent * count;
              const short = needed > 0 && needed > item.on_hand;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                    short ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.on_hand} on hand
                      {count > 1 && perStudent > 0 ? ` · ${needed} needed` : ''}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={perStudent}
                    onChange={(event) => setLine(item.id, event.target.value)}
                    className={`w-20 text-center ${FIELD_CLASS}`}
                    aria-label={`${item.name} per student`}
                  />
                  {count > 1 && <span className="text-xs text-gray-400 w-16">each</span>}
                </div>
              );
            })}
          </div>
        </div>

        {shortfalls.length > 0 && (
          <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">More than the books show</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {shortfalls.map(({ item, needed }) => (
                  <li key={item.id}>
                    {item.name}: {needed} needed, {item.on_hand} on hand
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-1.5">
                The release is still recorded — add the delivery afterwards so the count catches up.
              </p>
            </div>
          </div>
        )}

        <Field label="Remarks">
          <Textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Anything worth noting about this release"
            rows={2}
            className={FIELD_CLASS}
          />
        </Field>
      </div>
    </ModalShell>
  );
};

/**
 * The student lost their ID.
 *
 * The card they lost is closed off rather than edited, and a replacement is
 * started in the same step unless the desk says otherwise — which is what
 * keeps "how many were lost this year" answerable later on.
 */
export const LostIdModal = ({ student, onClose, onConfirm, isSaving, defaultFee = 150 }) => {
  const [remarks, setRemarks] = useState('');
  const [issueReplacement, setIssueReplacement] = useState(true);
  const [fee, setFee] = useState(String(defaultFee));
  const [orNumber, setOrNumber] = useState('');

  return (
    <ModalShell
      title="Report ID as lost"
      subtitle={`${student.name} · ${student.student_id_number}`}
      icon={AlertTriangle}
      tone="bg-red-100 text-red-600"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={isSaving}
            onClick={() =>
              onConfirm({
                remarks: remarks.trim() || null,
                issue_replacement: issueReplacement,
                fee: issueReplacement && fee !== '' ? Number(fee) : null,
                or_number: issueReplacement ? orNumber.trim() || null : null,
              })
            }
          >
            {isSaving ? 'Saving…' : 'Report Lost'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-gray-50 border text-sm text-gray-600">
          The card on record is marked lost and stays on the student's history.
          {student.card?.copy_label ? ` This is their ${student.card.copy_label.toLowerCase()}.` : ''}
        </div>

        <Field label="What happened">
          <Textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Where and when it was lost, if known"
            rows={2}
            className={FIELD_CLASS}
          />
        </Field>

        <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
          <Checkbox
            checked={issueReplacement}
            onCheckedChange={(checked) => setIssueReplacement(Boolean(checked))}
            className="mt-0.5 data-[state=checked]:bg-[var(--dominant-red)] data-[state=checked]:border-[var(--dominant-red)]"
          />
          <span className="text-sm">
            <span className="font-medium text-gray-800">Issue a replacement now</span>
            <span className="block text-xs text-gray-500">
              Adds a new card for this student, waiting to be printed.
            </span>
          </span>
        </label>

        {issueReplacement && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Replacement fee" hint={fee !== '' ? peso(Number(fee)) : ' '}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={fee}
                onChange={(event) => setFee(event.target.value)}
                className={FIELD_CLASS}
              />
            </Field>
            <Field label="O.R. number">
              <Input
                value={orNumber}
                onChange={(event) => setOrNumber(event.target.value)}
                placeholder="Optional"
                className={FIELD_CLASS}
              />
            </Field>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

/** A fresh card for a student who already has one — damaged, renewed, reprinted. */
export const ReplacementModal = ({ student, onClose, onConfirm, isSaving }) => {
  const [reason, setReason] = useState('damaged');
  const [fee, setFee] = useState('150');
  const [orNumber, setOrNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  // A correction is the school's own doing, so it is not charged by default
  useEffect(() => {
    setFee(reason === 'correction' ? '0' : '150');
  }, [reason]);

  return (
    <ModalShell
      title="Issue a replacement ID"
      subtitle={`${student.name} · ${student.student_id_number}`}
      icon={RefreshCw}
      tone="bg-purple-100 text-purple-600"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            className="flex-1 gradient-primary text-white"
            disabled={isSaving}
            onClick={() =>
              onConfirm({
                reason,
                fee: fee !== '' ? Number(fee) : null,
                or_number: orNumber.trim() || null,
                remarks: remarks.trim() || null,
              })
            }
          >
            {isSaving ? 'Saving…' : 'Record Replacement'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Reason">
          <div className="grid grid-cols-2 gap-2">
            {REPLACEMENT_REASONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReason(option.value)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                  reason === option.value
                    ? 'border-[var(--dominant-red)] bg-red-50 text-[var(--dominant-red)]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fee" hint={fee !== '' ? peso(Number(fee)) : ' '}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(event) => setFee(event.target.value)}
              className={FIELD_CLASS}
            />
          </Field>
          <Field label="O.R. number">
            <Input
              value={orNumber}
              onChange={(event) => setOrNumber(event.target.value)}
              placeholder="Optional"
              className={FIELD_CLASS}
            />
          </Field>
        </div>

        <Field label="Remarks">
          <Textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={2}
            className={FIELD_CLASS}
          />
        </Field>

        <p className="text-xs text-gray-500">
          The student's current card is closed off and this becomes their newest one, waiting to be printed.
        </p>
      </div>
    </ModalShell>
  );
};
