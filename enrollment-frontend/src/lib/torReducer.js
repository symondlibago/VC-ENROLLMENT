import {
  emptyRow, emptyTerm, emptySection, emptyPreliminary,
  emptyTranscript, withIds, creditsAfterGradeChange,
} from './tor';

/**
 * Every edit the transcript builder can make, addressed by id.
 *
 * Keeping this out of the component means the form's handlers never change
 * identity, so a keystroke in one subject row re-renders that row alone.
 */

/** Rebuilds only the list entry that matched, leaving the rest untouched. */
const mapById = (list, id, fn) => list.map((item) => (item.id === id ? fn(item) : item));

/** Swaps an entry with its neighbour; a move off either end does nothing. */
const moveById = (list, id, step) => {
  const from = list.findIndex((item) => item.id === id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};

const mapTerm = (state, sectionId, termId, fn) => ({
  ...state,
  sections: mapById(state.sections, sectionId, (section) => ({
    ...section,
    terms: mapById(section.terms, termId, fn),
  })),
});

export const torReducer = (state, { type, args = [] }) => {
  switch (type) {
    // ── whole form ──
    case 'load':
      return withIds(args[0]);
    case 'reset':
      return emptyTranscript();

    // ── student ──
    case 'student:update':
      return { ...state, student: { ...state.student, ...args[0] } };

    // ── notes ──
    case 'notes:update':
      return { ...state, ...args[0] };

    // ── preliminary education ──
    case 'prelim:add':
      return { ...state, preliminary: [...state.preliminary, emptyPreliminary()] };
    case 'prelim:update':
      return {
        ...state,
        preliminary: mapById(state.preliminary, args[0], (row) => ({ ...row, ...args[1] })),
      };
    case 'prelim:remove':
      return state.preliminary.length > 1
        ? { ...state, preliminary: state.preliminary.filter((row) => row.id !== args[0]) }
        : state;
    case 'prelim:move':
      return { ...state, preliminary: moveById(state.preliminary, args[0], args[1]) };

    // ── schools ──
    case 'section:add':
      // A student who attended another school started there, so it goes above
      // the record already on screen rather than after it.
      return { ...state, sections: [emptySection(), ...state.sections] };
    case 'section:update':
      return { ...state, sections: mapById(state.sections, args[0], (s) => ({ ...s, ...args[1] })) };
    case 'section:remove':
      return state.sections.length > 1
        ? { ...state, sections: state.sections.filter((s) => s.id !== args[0]) }
        : state;
    case 'section:move':
      return { ...state, sections: moveById(state.sections, args[0], args[1]) };

    // ── terms ──
    case 'term:add':
      return {
        ...state,
        sections: mapById(state.sections, args[0], (s) => ({ ...s, terms: [...s.terms, emptyTerm()] })),
      };
    case 'term:update':
      return mapTerm(state, args[0], args[1], (term) => ({ ...term, ...args[2] }));
    case 'term:remove':
      return {
        ...state,
        sections: mapById(state.sections, args[0], (s) =>
          (s.terms.length > 1 ? { ...s, terms: s.terms.filter((t) => t.id !== args[1]) } : s)),
      };
    case 'term:move':
      return {
        ...state,
        sections: mapById(state.sections, args[0], (s) => ({ ...s, terms: moveById(s.terms, args[1], args[2]) })),
      };

    // ── subject rows ──
    case 'row:add':
      return mapTerm(state, args[0], args[1], (term) => ({ ...term, rows: [...term.rows, emptyRow()] }));
    case 'row:update':
      return mapTerm(state, args[0], args[1], (term) => ({
        ...term,
        rows: mapById(term.rows, args[2], (row) => {
          const next = { ...row, ...args[3] };
          // A failed subject earns no credit, so the column follows the grade.
          const touchedGrade = 'grade' in args[3] || 'reexam' in args[3];
          return touchedGrade ? { ...next, credits: creditsAfterGradeChange(next) } : next;
        }),
      }));
    case 'row:remove':
      return mapTerm(state, args[0], args[1], (term) =>
        (term.rows.length > 1 ? { ...term, rows: term.rows.filter((r) => r.id !== args[2]) } : term));
    case 'row:move':
      return mapTerm(state, args[0], args[1], (term) => ({ ...term, rows: moveById(term.rows, args[2], args[3]) }));

    default:
      return state;
  }
};

export { emptyTranscript };
