// Shared helper (not a route): maps a verified login email to its teacher row.
// The server, never the browser, decides which teacher_id a request acts as.

export interface TeacherRow {
  id: string;
  email: string;
  name: string;
  schoolName: string;
  defaultHourlyRate: number;
  currency: string;
  languagePreference: 'id' | 'en';
}

const DEFAULT_HOURLY_RATE = 150000;

const SELECT_BY_EMAIL = `
  SELECT id, email, name, school_name, default_hourly_rate, currency, language_preference, deleted_at
  FROM teachers WHERE lower(email) = ? LIMIT 1
`;

const toTeacher = (row: any): TeacherRow => ({
  id: row.id,
  email: row.email,
  name: row.name,
  schoolName: row.school_name || '',
  defaultHourlyRate: Number(row.default_hourly_rate) || DEFAULT_HOURLY_RATE,
  currency: row.currency || 'IDR',
  languagePreference: row.language_preference === 'en' ? 'en' : 'id',
});

/**
 * Returns the teacher for a verified email, creating the row on first login.
 * Returns null when that teacher account has been deleted.
 */
export const getOrCreateTeacher = async (
  db: D1Database,
  email: string
): Promise<TeacherRow | null> => {
  const normalised = email.trim().toLowerCase();

  let row = await db.prepare(SELECT_BY_EMAIL).bind(normalised).first<any>();
  if (!row) {
    // INSERT OR IGNORE: if two first requests race, the loser's insert is a no-op
    // and the re-select below returns the winner's row.
    await db
      .prepare(
        `INSERT OR IGNORE INTO teachers (id, email, name, default_hourly_rate, currency, language_preference)
         VALUES (?, ?, ?, ?, 'IDR', 'id')`
      )
      .bind(crypto.randomUUID(), normalised, normalised.split('@')[0] || 'Educator', DEFAULT_HOURLY_RATE)
      .run();
    row = await db.prepare(SELECT_BY_EMAIL).bind(normalised).first<any>();
  }

  if (!row || row.deleted_at) return null;
  return toTeacher(row);
};
