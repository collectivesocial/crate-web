import { apiFetch } from './api';

export interface NoteRecord {
  $type: 'social.crate.note';
  title: string;
  slug: string;
  body: string;
  tags?: string[];
  publishedAt: string;
  updatedAt?: string;
  createdAt: string;
}

export interface NoteEntry {
  uri: string;
  cid: string;
  value: NoteRecord;
}

export interface NoteInput {
  title: string;
  slug: string;
  body: string;
  tags?: string[];
  publishedAt?: string;
}

/** Extract the rkey (last URI segment) from an AT-URI. */
export function rkeyFromUri(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

export async function listNotes(opts: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiFetch.get<{ notes: NoteEntry[]; cursor: string | null }>(
    `/api/notes${qs ? `?${qs}` : ''}`
  );
}

export async function getNote(rkey: string) {
  return apiFetch.get<NoteEntry>(`/api/notes/${encodeURIComponent(rkey)}`);
}

export async function createNote(input: NoteInput) {
  return apiFetch.post<NoteEntry>('/api/notes', input);
}

export async function updateNote(rkey: string, input: NoteInput) {
  return apiFetch.put<NoteEntry>(`/api/notes/${encodeURIComponent(rkey)}`, input);
}

export async function deleteNote(rkey: string) {
  return apiFetch.del<void>(`/api/notes/${encodeURIComponent(rkey)}`);
}
