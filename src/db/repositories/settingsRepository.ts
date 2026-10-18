import { getDb } from '../client';

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?;`,
    [key]
  );
  return row ? row.value : defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, value]
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM app_settings;`
  );
  const result: Record<string, string> = {};
  for (const r of rows) {
    result[r.key] = r.value;
  }
  return result;
}
