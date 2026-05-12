import { API_BASE, apiFetch } from './api';

export type ContentKind =
  | 'illustration'
  | 'article'
  | 'video'
  | 'talk'
  | 'newsletter'
  | 'podcast'
  | 'other';

export const CONTENT_KINDS: ContentKind[] = [
  'article',
  'illustration',
  'video',
  'talk',
  'newsletter',
  'podcast',
  'other',
];

/** JSON shape of an AT-Protocol BlobRef as it lives in a record. */
export interface BlobRef {
  $type: 'blob';
  ref: { $link: string };
  mimeType: string;
  size: number;
}

export interface ContentRecord {
  $type: 'social.crate.content';
  kind: ContentKind;
  title: string;
  description?: string;
  body?: string;
  publishedAt: string;
  canonicalUrl?: string;
  image?: BlobRef;
  imageAlt?: string;
  tags?: string[];
  bskyPostRef?: { uri: string; cid: string };
  createdAt: string;
}

export interface ContentEntry {
  uri: string;
  cid: string;
  value: ContentRecord;
}

export interface ContentInput {
  kind: ContentKind;
  title: string;
  description?: string;
  body?: string;
  publishedAt?: string;
  canonicalUrl?: string;
  image?: BlobRef;
  imageAlt?: string;
  tags?: string[];
  bskyPostRef?: { uri: string; cid: string };
}

/** Extract the rkey (last URI segment) from an AT-URI. */
export function rkeyFromUri(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

export async function listContent(opts: {
  limit?: number;
  cursor?: string;
  kind?: ContentKind;
} = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.kind) params.set('kind', opts.kind);
  const qs = params.toString();
  return apiFetch.get<{ content: ContentEntry[]; cursor: string | null }>(
    `/api/content${qs ? `?${qs}` : ''}`
  );
}

export async function getContent(rkey: string) {
  return apiFetch.get<ContentEntry>(`/api/content/${encodeURIComponent(rkey)}`);
}

export async function createContent(input: ContentInput) {
  return apiFetch.post<ContentEntry>('/api/content', input);
}

export async function updateContent(rkey: string, input: ContentInput) {
  return apiFetch.put<ContentEntry>(`/api/content/${encodeURIComponent(rkey)}`, input);
}

export async function deleteContent(rkey: string) {
  return apiFetch.del<void>(`/api/content/${encodeURIComponent(rkey)}`);
}

/**
 * Upload an image blob to the user's PDS via the API. Sends the raw bytes
 * with the file's mime type — the server forwards to `com.atproto.repo.uploadBlob`
 * and returns the BlobRef to embed in a content record.
 */
export async function uploadContentImage(file: File): Promise<BlobRef> {
  const res = await fetch(`${API_BASE}/api/content/upload-image`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { blob: BlobRef };
  return data.blob;
}
