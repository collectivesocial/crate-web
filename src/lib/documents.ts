import { apiFetch } from './api';

export interface BskyPostRef {
  uri: string;
  cid: string;
}

export interface DocumentRecord {
  $type: 'site.standard.document';
  site: string;
  path?: string;
  title: string;
  description?: string;
  textContent?: string;
  tags?: string[];
  bskyPostRef?: BskyPostRef;
  publishedAt: string;
  updatedAt?: string;
}

export interface DocumentEntry {
  uri: string;
  cid: string;
  value: DocumentRecord;
}

export interface DocumentInput {
  site: string;
  path?: string;
  title: string;
  description?: string;
  textContent?: string;
  tags?: string[];
  bskyPostRef?: BskyPostRef;
  publishedAt?: string;
}

/** Extract the rkey (last URI segment) from an AT-URI. */
export function rkeyFromUri(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

export async function listDocuments(opts: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiFetch.get<{ documents: DocumentEntry[]; cursor: string | null }>(
    `/api/documents${qs ? `?${qs}` : ''}`
  );
}

export async function getDocument(rkey: string) {
  return apiFetch.get<DocumentEntry>(`/api/documents/${encodeURIComponent(rkey)}`);
}

export async function createDocument(input: DocumentInput) {
  return apiFetch.post<DocumentEntry>('/api/documents', input);
}

export async function updateDocument(rkey: string, input: DocumentInput) {
  return apiFetch.put<DocumentEntry>(`/api/documents/${encodeURIComponent(rkey)}`, input);
}

export async function deleteDocument(rkey: string) {
  return apiFetch.del<void>(`/api/documents/${encodeURIComponent(rkey)}`);
}

export interface BskyPostSummary {
  uri: string;
  cid: string;
  text: string;
  createdAt: string;
}

export async function listMyBskyPosts(opts: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiFetch.get<{ posts: BskyPostSummary[]; cursor: string | null }>(
    `/api/bsky/my-posts${qs ? `?${qs}` : ''}`
  );
}

/**
 * Resolve a Bluesky post URL / AT-URI / rkey to a strongRef. The server
 * fetches the record to confirm the CID, so this is authoritative.
 */
export async function resolveBskyPost(input: string) {
  return apiFetch.post<{ ref: BskyPostRef }>('/api/bsky/resolve-post', { input });
}
