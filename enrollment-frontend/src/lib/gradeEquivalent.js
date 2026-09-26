/**
 * Percentage grade → the 1.0–5.0 equivalent used on official documents.
 * Mirrors the table already used on the grades pages.
 */
export const getEquivalentGrade = (finalGrade) => {
  if (finalGrade === null || finalGrade === undefined || finalGrade === '') return null;

  const grade = Math.round(Number(finalGrade));
  if (!Number.isFinite(grade)) return null;

  if (grade >= 100) return '1.0';
  if (grade === 99) return '1.1';
  if (grade === 98) return '1.2';
  if (grade === 97) return '1.25';
  if (grade === 96) return '1.3';
  if (grade === 95) return '1.4';
  if (grade === 94) return '1.5';
  if (grade === 93) return '1.6';
  if (grade === 92) return '1.7';
  if (grade === 91) return '1.75';
  if (grade === 90) return '1.8';
  if (grade === 89) return '1.9';
  if (grade === 88) return '2.0';
  if (grade === 87) return '2.1';
  if (grade === 86) return '2.2';
  if (grade === 85) return '2.25';
  if (grade === 84) return '2.3';
  if (grade === 83) return '2.4';
  if (grade === 82) return '2.5';
  if (grade === 81) return '2.6';
  if (grade === 80) return '2.7';
  if (grade === 79) return '2.75';
  if (grade === 78) return '2.8';
  if (grade === 77) return '2.9';
  if (grade === 76 || grade === 75) return '3.0';
  if (grade === 74) return '3.1';
  if (grade === 73) return '3.2';
  if (grade === 72) return '3.25';
  if (grade === 71) return '3.3';
  if (grade === 70) return '3.4';

  return '5.0';
};
