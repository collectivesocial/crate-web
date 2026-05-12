import { apiFetch } from './api';

export interface NowSection {
  title: string;
  body: string;
}

export interface NowRecord {
  $type: 'social.crate.now';
  body?: string;
  sections?: NowSection[];
  location?: string;
  summary?: string;
  createdAt: string;
}

export interface NowEntry {
  uri: string;
  cid: string;
  value: NowRecord;
}

export interface NowInput {
  body?: string;
  sections?: NowSection[];
  location?: string;
  summary?: string;
}

export type LiveFeedFilter =
  | 'social.crate.now.config#topLevelPosts'
  | 'social.crate.now.config#noReplies'
  | 'social.crate.now.config#noReposts';

export interface LiveFeed {
  title: string;
  did?: string;
  collection: string;
  limit?: number;
  filter?: LiveFeedFilter;
}

export interface NowConfigRecord {
  $type: 'social.crate.now.config';
  liveFeeds?: LiveFeed[];
  createdAt: string;
  updatedAt?: string;
}

export interface NowConfigInput {
  liveFeeds?: LiveFeed[];
}

export interface LiveFeedRecord {
  uri: string;
  cid: string;
  value: Record<string, unknown>;
}

export async function getCurrentNow() {
  return apiFetch.get<{ entry: NowEntry | null }>('/api/now');
}

export async function listNowHistory(opts: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiFetch.get<{ entries: NowEntry[]; cursor: string | null }>(
    `/api/now/history${qs ? `?${qs}` : ''}`
  );
}

export async function createNow(input: NowInput) {
  return apiFetch.post<NowEntry>('/api/now', input);
}

export async function getNowConfig() {
  return apiFetch.get<{
    config: { uri: string; cid: string; value: NowConfigRecord } | null;
  }>('/api/now/config');
}

export async function saveNowConfig(input: NowConfigInput) {
  return apiFetch.put<{ uri: string; cid: string; value: NowConfigRecord }>(
    '/api/now/config',
    input
  );
}

export async function fetchLiveFeed(opts: {
  did: string;
  collection: string;
  limit?: number;
  filter?: LiveFeedFilter;
}) {
  const params = new URLSearchParams({
    did: opts.did,
    collection: opts.collection,
  });
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.filter) params.set('filter', opts.filter);
  return apiFetch.get<{ records: LiveFeedRecord[] }>(
    `/api/now/live-feed?${params.toString()}`
  );
}
