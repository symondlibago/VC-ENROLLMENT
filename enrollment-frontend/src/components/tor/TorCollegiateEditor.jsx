import React, { memo, useCallback, useMemo } from 'react';
import { School, CalendarRange } from 'lucide-react';
import {
  cellInputClass, inputClass, Field, AddButton, RemoveButton, MoveButtons, ROW_CONTROLS_W,
} from './torFields';
import { HOME_SCHOOL } from '@/lib/tor';

/**
 * The collegiate record: one block per school, a programme heading under it,
 * then a block of subjects for every term. A student who started elsewhere
 * simply gets another school added above this one.
 *
 * Every callback here is stable and addressed by id, so typing in one subject
 * row never re-renders the others.
 */

const SCHOOL_LIST_ID = 'tor-school-suggestions';

// Flex weights rather than percentages: the gaps and the trailing controls
// come out of the same budget, so headers sit exactly over their inputs.
const COLUMNS = [
  { key: 'code', label: 'Subject Code', width: 'flex-[12]', placeholder: 'ENGL 1' },
  { key: 'title', label: 'Descriptive Title', width: 'flex-[46]', placeholder: 'Study and Thinking Skills' },
  { key: 'grade', label: 'Final Grade', width: 'flex-[14]', placeholder: '1.5', align: 'text-center' },
  { key: 'reexam', label: 'Re-exam', width: 'flex-[14]', placeholder: '', align: 'text-center' },
  { key: 'credits', label: 'Credits', width: 'flex-[14]', placeholder: '3', align: 'text-center' },
];

const SubjectRow = memo(function SubjectRow({
  sectionId, termId, row, index, total, onChange, onRemove, onMove, canRemove,
}) {
  const set = (key) => (event) => onChange(sectionId, termId, row.id, { [key]: event.target.value });

  return (
    <div className="flex items-center gap-1.5">
      {COLUMNS.map((column) => (
        <input
          key={column.key}
          type="text"
          className={`${cellInputClass} ${column.width} min-w-0 ${column.align || ''}`}
          value={row[column.key] ?? ''}
          placeholder={column.placeholder}
          onChange={set(column.key)}
        />
      ))}
      <div className={`${ROW_CONTROLS_W} shrink-0 flex items-center justify-end`}>
        <MoveButtons
          label="subject"
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          onMove={(step) => onMove(sectionId, termId, row.id, step)}
        />
        <RemoveButton
          onClick={() => onRemove(sectionId, termId, row.id)}
          disabled={!canRemove}
          title="Remove subject"
        />
      </div>
    </div>
  );
});

const Term = memo(function Term({
  sectionId, term, index, total, onTermChange, onTermRemove, onTermMove, canRemoveTerm,
  onRowChange, onRowAdd, onRowRemove, onRowMove,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarRange className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          className={`${inputClass} h-9 font-medium`}
          value={term.label ?? ''}
          placeholder="First Semester, SY 2024-2025"
          onChange={(e) => onTermChange(sectionId, term.id, { label: e.target.value })}
        />
        <div className={`${ROW_CONTROLS_W} shrink-0 flex items-center justify-end`}>
          <MoveButtons
            label="term"
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            onMove={(step) => onTermMove(sectionId, term.id, step)}
          />
          <RemoveButton
            onClick={() => onTermRemove(sectionId, term.id)}
            disabled={!canRemoveTerm}
            title="Remove term"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {COLUMNS.map((column) => (
          <span
            key={column.key}
            className={`${column.width} min-w-0 px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500 ${column.align || ''}`}
          >
            {column.label}
          </span>
        ))}
        <span className={`${ROW_CONTROLS_W} shrink-0`} />
      </div>

      <div className="space-y-1.5">
        {term.rows.map((row, rowIndex) => (
          <SubjectRow
            key={row.id}
            sectionId={sectionId}
            termId={term.id}
            row={row}
            index={rowIndex}
            total={term.rows.length}
            onChange={onRowChange}
            onRemove={onRowRemove}
            onMove={onRowMove}
            canRemove={term.rows.length > 1}
          />
        ))}
      </div>

      <AddButton onClick={() => onRowAdd(sectionId, term.id)} className="h-8 text-xs">
        Add subject
      </AddButton>
    </div>
  );
});

const Section = memo(function Section({
  section, index, total, canRemove, onSectionChange, onSectionRemove, onSectionMove,
  onTermChange, onTermAdd, onTermRemove, onTermMove,
  onRowChange, onRowAdd, onRowRemove, onRowMove,
}) {
  const set = (key) => (event) => onSectionChange(section.id, { [key]: event.target.value });

  return (
    <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-(--dominant-red)/5 border-b border-gray-200">
        <div className="flex items-center gap-2 text-(--dominant-red)">
          <School className="w-4 h-4" />
          <span className="text-sm font-semibold">School {index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <MoveButtons
            label="school"
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            onMove={(step) => onSectionMove(section.id, step)}
          />
          <RemoveButton onClick={() => onSectionRemove(section.id)} disabled={!canRemove} title="Remove school" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field
            label="Name of school"
            className="lg:col-span-2"
            hint="Repeat the same name to continue under it — the heading only prints once."
          >
            <input
              type="text"
              list={SCHOOL_LIST_ID}
              className={inputClass}
              value={section.school ?? ''}
              placeholder={HOME_SCHOOL}
              onChange={set('school')}
            />
          </Field>
          <Field label="Course / programme">
            <input
              type="text"
              className={inputClass}
              value={section.program ?? ''}
              placeholder="Bachelor of Science in Business Administration"
              onChange={set('program')}
            />
          </Field>
          <Field label="Major" hint="Optional — prints on its own line under the programme.">
            <input
              type="text"
              className={inputClass}
              value={section.major ?? ''}
              placeholder="Major in Human Resource Development Management"
              onChange={set('major')}
            />
          </Field>
        </div>

        <div className="space-y-3">
          {section.terms.map((term, termIndex) => (
            <Term
              key={term.id}
              sectionId={section.id}
              term={term}
              index={termIndex}
              total={section.terms.length}
              onTermChange={onTermChange}
              onTermRemove={onTermRemove}
              onTermMove={onTermMove}
              canRemoveTerm={section.terms.length > 1}
              onRowChange={onRowChange}
              onRowAdd={onRowAdd}
              onRowRemove={onRowRemove}
              onRowMove={onRowMove}
            />
          ))}
        </div>

        <AddButton onClick={() => onTermAdd(section.id)}>Add semester / term</AddButton>
      </div>
    </div>
  );
});

const TorCollegiateEditor = ({ sections, dispatch }) => {
  // Every handler is stable and takes its target's ids, so a keystroke in one
  // subject row re-renders that row and nothing else.
  const act = useCallback((type) => (...args) => dispatch({ type, args }), [dispatch]);

  const onSectionChange = useMemo(() => act('section:update'), [act]);
  const onSectionRemove = useMemo(() => act('section:remove'), [act]);
  const onSectionMove = useMemo(() => act('section:move'), [act]);
  const onSectionAdd = useMemo(() => act('section:add'), [act]);
  const onTermChange = useMemo(() => act('term:update'), [act]);
  const onTermAdd = useMemo(() => act('term:add'), [act]);
  const onTermRemove = useMemo(() => act('term:remove'), [act]);
  const onTermMove = useMemo(() => act('term:move'), [act]);
  const onRowChange = useMemo(() => act('row:update'), [act]);
  const onRowAdd = useMemo(() => act('row:add'), [act]);
  const onRowRemove = useMemo(() => act('row:remove'), [act]);
  const onRowMove = useMemo(() => act('row:move'), [act]);

  return (
    <div className="space-y-4">
      <datalist id={SCHOOL_LIST_ID}>
        <option value={HOME_SCHOOL} />
      </datalist>

      {/* Above the list, because that is where a previous school lands. */}
      <AddButton onClick={onSectionAdd} className="w-full h-11">
        Add a previous school
      </AddButton>

      {sections.map((section, index) => (
        <Section
          key={section.id}
          section={section}
          index={index}
          total={sections.length}
          canRemove={sections.length > 1}
          onSectionChange={onSectionChange}
          onSectionRemove={onSectionRemove}
          onSectionMove={onSectionMove}
          onTermChange={onTermChange}
          onTermAdd={onTermAdd}
          onTermRemove={onTermRemove}
          onTermMove={onTermMove}
          onRowChange={onRowChange}
          onRowAdd={onRowAdd}
          onRowRemove={onRowRemove}
          onRowMove={onRowMove}
        />
      ))}
    </div>
  );
};

export default TorCollegiateEditor;
