import { apiFetch } from './api';

// ─── Events ──────────────────────────────────────────────────────────────

export const EVENT_MODES = [
  'community.lexicon.calendar.event#virtual',
  'community.lexicon.calendar.event#inperson',
  'community.lexicon.calendar.event#hybrid',
] as const;
export type EventMode = (typeof EVENT_MODES)[number];

export const EVENT_STATUSES = [
  'community.lexicon.calendar.event#scheduled',
  'community.lexicon.calendar.event#cancelled',
  'community.lexicon.calendar.event#postponed',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventLocation {
  name?: string;
  locality?: string;
  region?: string;
  country?: string;
}

export interface EventUri {
  uri: string;
  name?: string;
}

export interface EventRecord {
  $type: 'community.lexicon.calendar.event';
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  mode?: EventMode;
  status?: EventStatus;
  locations?: EventLocation[];
  uris?: EventUri[];
  createdAt: string;
}

export interface EventEntry {
  uri: string;
  cid: string;
  value: EventRecord;
}

export interface EventInput {
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  mode?: EventMode;
  status?: EventStatus;
  locations?: EventLocation[];
  uris?: EventUri[];
}

/** Extract the rkey (last URI segment) from an AT-URI. */
export function rkeyFromUri(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

/** Short human label for a known mode/status enum value. */
export function shortEnumLabel(value: string | undefined): string {
  if (!value) return '';
  const hash = value.lastIndexOf('#');
  return hash >= 0 ? value.slice(hash + 1) : value;
}

export async function listEvents(opts: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiFetch.get<{ events: EventEntry[]; cursor: string | null }>(
    `/api/events${qs ? `?${qs}` : ''}`
  );
}

export async function getEvent(rkey: string) {
  return apiFetch.get<EventEntry>(`/api/events/${encodeURIComponent(rkey)}`);
}

export async function createEvent(input: EventInput) {
  return apiFetch.post<EventEntry>('/api/events', input);
}

export async function updateEvent(rkey: string, input: EventInput) {
  return apiFetch.put<EventEntry>(`/api/events/${encodeURIComponent(rkey)}`, input);
}

export async function deleteEvent(rkey: string) {
  return apiFetch.del<void>(`/api/events/${encodeURIComponent(rkey)}`);
}

// ─── RSVPs ───────────────────────────────────────────────────────────────

export const RSVP_STATUSES = [
  'community.lexicon.calendar.rsvp#going',
  'community.lexicon.calendar.rsvp#interested',
  'community.lexicon.calendar.rsvp#notgoing',
] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export interface RsvpRecord {
  $type: 'community.lexicon.calendar.rsvp';
  subject: { uri: string; cid: string };
  status: RsvpStatus;
  createdAt: string;
}

export interface RsvpEntry {
  uri: string;
  cid: string;
  value: RsvpRecord;
  /** Hydrated event record (when present and reachable). */
  event: EventEntry | null;
}

export interface RsvpInput {
  subject: { uri: string; cid: string };
  status: RsvpStatus;
}

export async function listRsvps(opts: {
  limit?: number;
  cursor?: string;
  hydrate?: boolean;
} = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.hydrate === false) params.set('hydrate', 'false');
  const qs = params.toString();
  return apiFetch.get<{ rsvps: RsvpEntry[]; cursor: string | null }>(
    `/api/rsvps${qs ? `?${qs}` : ''}`
  );
}

export async function createRsvp(input: RsvpInput) {
  return apiFetch.post<{ uri: string; cid: string; value: RsvpRecord }>(
    '/api/rsvps',
    input
  );
}

export async function deleteRsvp(rkey: string) {
  return apiFetch.del<void>(`/api/rsvps/${encodeURIComponent(rkey)}`);
}
