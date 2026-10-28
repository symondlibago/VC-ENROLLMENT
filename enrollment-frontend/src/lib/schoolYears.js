import { useCallback, useEffect, useState } from 'react';
import { enrollmentAPI } from '@/services/api';

/**
 * The years that were written into the enrolment screens by hand before the
 * list became editable.
 *
 * They are kept as a floor, not as history: if the request fails or the table
 * is empty, the pickers still offer these rather than nothing at all. The
 * migration also seeded them into the table, so ticking one off there is what
 * hides it — the fallback only applies when there is no list to read.
 */
export const BUILT_IN_SCHOOL_YEARS = ['2027-2028', '2026-2027', '2025-2026'];

/** Newest first, which for "2026-2027" is plain reverse string order. */
export const sortSchoolYears = (years) =>
  [...new Set(years.filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a)));

/**
 * The years to offer: what the registrar has stored, or the built-in list
 * when there is nothing stored to read.
 */
export const resolveSchoolYears = (stored) =>
  stored?.length ? sortSchoolYears(stored) : [...BUILT_IN_SCHOOL_YEARS];

/**
 * The school year list for a picker.
 *
 * Starts on the built-in years so a dropdown is never briefly empty, then
 * settles on whatever the registrar has stored.
 */
export const useSchoolYears = () => {
  const [schoolYears, setSchoolYears] = useState(BUILT_IN_SCHOOL_YEARS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const response = await enrollmentAPI.schoolYears.list();
      setSchoolYears(resolveSchoolYears((response.data || []).map((year) => year.name)));
    } catch {
      // An unreachable list is not a reason to block an enrolment
      setSchoolYears([...BUILT_IN_SCHOOL_YEARS]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { schoolYears, loading, reload };
};
