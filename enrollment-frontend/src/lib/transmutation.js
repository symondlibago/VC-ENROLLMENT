/**
 * Adjusted Transmutation Table.
 *
 * Only Diploma in Hospitality Technology (DHT) and Senior High School (SHS)
 * classes transmute their grades; every other course uses the rounded grade
 * as-is. Bands are listed ascending so Excel's LOOKUP() can use the same table.
 */
export const TRANSMUTATION_TABLE = [
  { min: 0.00,  max: 4.67,   grade: 60 },
  { min: 4.68,  max: 9.34,   grade: 61 },
  { min: 9.35,  max: 14.00,  grade: 62 },
  { min: 14.01, max: 18.67,  grade: 63 },
  { min: 18.68, max: 23.34,  grade: 64 },
  { min: 23.35, max: 28.00,  grade: 65 },
  { min: 28.01, max: 32.67,  grade: 66 },
  { min: 32.68, max: 37.33,  grade: 67 },
  { min: 37.34, max: 42.00,  grade: 68 },
  { min: 42.01, max: 46.66,  grade: 69 },
  { min: 46.67, max: 51.33,  grade: 70 },
  { min: 51.34, max: 56.00,  grade: 71 },
  { min: 56.01, max: 60.66,  grade: 72 },
  { min: 60.67, max: 65.33,  grade: 73 },
  { min: 65.34, max: 69.99,  grade: 74 },
  { min: 70.00, max: 71.17,  grade: 75 },
  { min: 71.18, max: 72.35,  grade: 76 },
  { min: 72.36, max: 73.53,  grade: 77 },
  { min: 73.54, max: 74.71,  grade: 78 },
  { min: 74.72, max: 75.89,  grade: 79 },
  { min: 75.90, max: 77.07,  grade: 80 },
  { min: 77.08, max: 78.25,  grade: 81 },
  { min: 78.26, max: 79.43,  grade: 82 },
  { min: 79.44, max: 80.61,  grade: 83 },
  { min: 80.62, max: 81.79,  grade: 84 },
  { min: 81.80, max: 82.97,  grade: 85 },
  { min: 82.98, max: 84.15,  grade: 86 },
  { min: 84.16, max: 85.33,  grade: 87 },
  { min: 85.34, max: 86.51,  grade: 88 },
  { min: 86.52, max: 87.69,  grade: 89 },
  { min: 87.70, max: 88.87,  grade: 90 },
  { min: 88.88, max: 90.05,  grade: 91 },
  { min: 90.06, max: 91.23,  grade: 92 },
  { min: 91.24, max: 92.41,  grade: 93 },
  { min: 92.42, max: 93.59,  grade: 94 },
  { min: 93.60, max: 94.77,  grade: 95 },
  { min: 94.78, max: 95.95,  grade: 96 },
  { min: 95.96, max: 97.13,  grade: 97 },
  { min: 97.14, max: 98.31,  grade: 98 },
  { min: 98.32, max: 99.49,  grade: 99 },
  { min: 99.50, max: 100.00, grade: 100 },
];

/**
 * Converts an initial (raw, unrounded) grade into its transmuted grade.
 * Returns null for a missing value.
 */
export const transmuteGrade = (initialGrade) => {
  const value = Number(initialGrade);
  if (!Number.isFinite(value)) return null;

  if (value >= 100) return 100;
  if (value <= 0) return 60;

  // Highest band whose lower bound the grade reaches — this also covers the
  // small gaps between bands (e.g. 75.895).
  for (let i = TRANSMUTATION_TABLE.length - 1; i >= 0; i--) {
    if (value >= TRANSMUTATION_TABLE[i].min) return TRANSMUTATION_TABLE[i].grade;
  }
  return 60;
};

/**
 * True when a class transmutes its grades: DHT students, or SHS students
 * (Grade 11 / Grade 12). Mirrors the rule already used when computing final
 * grades on the Student Grades page.
 */
export const usesTransmutation = (students = [], subjectCode = '') => {
  const isDHT =
    String(subjectCode).toUpperCase().includes('DHT') ||
    students.some(s =>
      String(s.courseCode || '').toUpperCase() === 'DHT' ||
      String(s.courseName || '').includes('Diploma in Hospitality Technology')
    );

  const isSHS = students.some(s => {
    const year = String(s.year || '');
    return year.includes('Grade 11') || year.includes('Grade 12');
  });

  return isDHT || isSHS;
};
