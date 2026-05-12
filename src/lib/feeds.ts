import { apiFetch } from './api';

export interface FeedRecord {
  $type: 'social.crate.rss.feed';
  url: string;
  title: string;
  description?: string;
  siteUrl?: string;
  destination?: string;
  active?: boolean;
  lastPolledAt?: string;
  lastEntryGuid?: string;
  createdAt: string;
}

export interface FeedEntry {
  uri: string;
  cid: string;
  value: FeedRecord;
}

export interface FeedInput {
  url: string;
  title: string;
  description?: string;
  siteUrl?: string;
  destination?: string;
  active?: boolean;
}

/** Extract the rkey (last URI segment) from an AT-URI. */
export function rkeyFromUri(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

export async function listFeeds(opts: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiFetch.get<{ feeds: FeedEntry[]; cursor: string | null }>(
    `/api/feeds${qs ? `?${qs}` : ''}`
  );
}

export async function getFeed(rkey: string) {
  return apiFetch.get<FeedEntry>(`/api/feeds/${encodeURIComponent(rkey)}`);
}

export async function createFeed(input: FeedInput) {
  return apiFetch.post<FeedEntry>('/api/feeds', input);
}

export async function updateFeed(rkey: string, input: FeedInput) {
  return apiFetch.put<FeedEntry>(`/api/feeds/${encodeURIComponent(rkey)}`, input);
}

export async function deleteFeed(rkey: string) {
  return apiFetch.del<void>(`/api/feeds/${encodeURIComponent(rkey)}`);
}
