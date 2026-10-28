import React, { memo } from 'react';
import {
  Check, MoreVertical, Printer, AlertTriangle, History, RefreshCw,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { CARD_REASON, CARD_STATUS, formatDate, statusOf } from './constants';

/**
 * One student on the releasing board.
 *
 * Memoised and driven entirely by props: the parent keeps every callback
 * steady, so marking one student printed does not re-render the rest.
 */
const StudentRow = memo(({ student, isSelected, onSelect, onAction }) => {
  const card = student.card;
  const status = statusOf(card);
  const look = CARD_STATUS[status] ?? CARD_STATUS.awaiting;

  const released = status === 'released';
  const printed = status === 'printed';

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-red-50/40' : ''}`}>
      <td className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(student.id)}
          className="border-2 border-red-800 data-[state=checked]:bg-[var(--dominant-red)] data-[state=checked]:border-[var(--dominant-red)]"
          aria-label={`Select ${student.name}`}
        />
      </td>

      <td className="px-4 py-3 font-mono text-sm text-gray-700 whitespace-nowrap">
        {student.student_id_number}
      </td>

      <td className="px-4 py-3">
        <span className="font-medium text-gray-900">{student.name}</span>
        {student.cards_issued > 1 && (
          <Badge className="ml-2 bg-purple-100 text-purple-800 border border-purple-200 text-[11px]">
            {card?.copy_label ?? `${student.cards_issued} cards`}
          </Badge>
        )}
        {student.has_lost && status !== 'lost' && (
          <Badge className="ml-1.5 bg-red-50 text-red-700 border border-red-200 text-[11px]">
            Lost before
          </Badge>
        )}
        {card?.reason && card.reason !== 'initial' && (
          <span className="block text-xs text-gray-400">{CARD_REASON[card.reason] ?? card.reason}</span>
        )}
      </td>

      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {student.course ?? student.courseName}
        {student.year_level && <span className="text-gray-400"> · {student.year_level}</span>}
      </td>

      <td className="px-4 py-3">
        <Badge className={`${look.tone} border font-medium whitespace-nowrap`}>{look.label}</Badge>
      </td>

      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        <span className="block">Printed: {formatDate(card?.printed_at)}</span>
        <span className="block">Released: {formatDate(card?.released_at)}</span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs whitespace-nowrap"
            disabled={printed || released}
            onClick={() => onAction('print', student)}
          >
            <Printer size={13} className="mr-1" /> Printed
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs gradient-primary text-white whitespace-nowrap"
            disabled={released}
            onClick={() => onAction('release', student)}
          >
            <Check size={13} className="mr-1" /> Released
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => onAction('lost', student)}
                disabled={!card || card.status === 'lost'}
                className="text-red-600 focus:text-red-700"
              >
                <AlertTriangle size={14} className="mr-2" /> Report Lost
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('replace', student)}>
                <RefreshCw size={14} className="mr-2" /> Issue Replacement
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction('history', student)}>
                <History size={14} className="mr-2" /> View ID History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
});

StudentRow.displayName = 'StudentRow';

const StudentIdTable = ({ students, selected, onSelect, onSelectAll, allSelected, onAction }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b">
        <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
          <th className="px-4 py-3 w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              className="border-2 border-red-800 data-[state=checked]:bg-[var(--dominant-red)] data-[state=checked]:border-[var(--dominant-red)]"
              aria-label="Select this page"
            />
          </th>
          <th className="px-4 py-3">ID Number</th>
          <th className="px-4 py-3">Full Name</th>
          <th className="px-4 py-3">Course &amp; Year</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Dates</th>
          <th className="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {students.map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            isSelected={selected.has(student.id)}
            onSelect={onSelect}
            onAction={onAction}
          />
        ))}
      </tbody>
    </table>
  </div>
);

export default StudentIdTable;
