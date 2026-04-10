import { db } from '../db';

const PAT_KEY = 'github-pat';

export async function getPat(): Promise<string | null> {
  const entry = await db.config.get(PAT_KEY);
  return entry?.value ?? null;
}

export async function setPat(pat: string): Promise<void> {
  await db.config.put({ key: PAT_KEY, value: pat });
}

export async function clearPat(): Promise<void> {
  await db.config.delete(PAT_KEY);
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const pat = await getPat();
  if (pat) {
    return { Authorization: `Bearer ${pat}` };
  }
  return {};
}
