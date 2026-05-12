import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Spinner,
  Stack,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  createRsvp,
  deleteRsvp,
  type EventEntry,
  type EventRecord,
  listEvents,
  listRsvps,
  rkeyFromUri,
  type RsvpEntry,
  type RsvpStatus,
  shortEnumLabel,
} from '../../lib/events';
import { useSession } from '../../lib/session';

const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: 'community.lexicon.calendar.rsvp#going', label: 'Going' },
  { value: 'community.lexicon.calendar.rsvp#interested', label: 'Interested' },
  { value: 'community.lexicon.calendar.rsvp#notgoing', label: 'Not going' },
];

export function EventsPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventEntry[] | null>(null);
  const [rsvps, setRsvps] = useState<RsvpEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rsvpBusy, setRsvpBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ev, rs] = await Promise.all([listEvents(), listRsvps()]);
      setEvents(ev.events);
      setRsvps(rs.rsvps);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;
    void load();
  }, [status, navigate, load]);

  /** Map subject URI → existing RSVP for quick lookup on cards. */
  const rsvpBySubjectUri = useMemo(() => {
    const m = new Map<string, RsvpEntry>();
    for (const r of rsvps ?? []) m.set(r.value.subject.uri, r);
    return m;
  }, [rsvps]);

  const setRsvpStatus = async (
    eventEntry: EventEntry,
    newStatus: RsvpStatus | null
  ) => {
    const key = eventEntry.uri;
    setRsvpBusy(key);
    setError(null);
    try {
      const existing = rsvpBySubjectUri.get(key);
      if (existing) {
        await deleteRsvp(rkeyFromUri(existing.uri));
      }
      if (newStatus) {
        await createRsvp({
          subject: { uri: eventEntry.uri, cid: eventEntry.cid },
          status: newStatus,
        });
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRsvpBusy(null);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={3}>
        <Heading as="h1" size="xl">
          Events
        </Heading>
        <Button colorPalette="teal" asChild>
          <RouterLink to="/events/new">+ New event</RouterLink>
        </Button>
      </Flex>

      {status === 'loading' && (
        <HStack>
          <Spinner size="sm" />
          <Text color="fg.muted">Loading session…</Text>
        </HStack>
      )}

      {error && (
        <Box
          bg="accent.muted"
          borderWidth="1px"
          borderColor="border.subtle"
          p={4}
          borderRadius="md"
          mb={4}
        >
          <Text color="fg.error">{error}</Text>
        </Box>
      )}

      {status === 'authenticated' && (events === null || rsvps === null) && !error && (
        <HStack>
          <Spinner size="sm" />
          <Text color="fg.muted">Loading events…</Text>
        </HStack>
      )}

      {status === 'authenticated' && events !== null && rsvps !== null && (
        <Tabs.Root defaultValue="hosting" variant="line">
          <Tabs.List mb={4}>
            <Tabs.Trigger value="hosting">
              Hosting{events.length > 0 ? ` (${events.length})` : ''}
            </Tabs.Trigger>
            <Tabs.Trigger value="attending">
              Attending{rsvps.length > 0 ? ` (${rsvps.length})` : ''}
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="hosting">
            {events.length === 0 ? (
              <Box bg="bg.subtle" p={8} borderRadius="md" textAlign="center">
                <Text color="fg.muted" mb={4}>
                  No events yet.
                </Text>
                <Button colorPalette="teal" asChild>
                  <RouterLink to="/events/new">Create your first event</RouterLink>
                </Button>
                <Text fontSize="sm" color="fg.muted" mt={3}>
                  Events are stored as `community.lexicon.calendar.event` records on
                  your PDS — Smoke Signal and other ATProto event apps can read them.
                </Text>
              </Box>
            ) : (
              <Stack gap={3}>
                {events
                  .slice()
                  .sort((a, b) => sortEventsByStart(a.value, b.value))
                  .map((e) => (
                    <EventCard
                      key={e.uri}
                      entry={e}
                      myRsvp={rsvpBySubjectUri.get(e.uri) ?? null}
                      busy={rsvpBusy === e.uri}
                      onRsvp={(s) => setRsvpStatus(e, s)}
                    />
                  ))}
              </Stack>
            )}
          </Tabs.Content>

          <Tabs.Content value="attending">
            {rsvps.length === 0 ? (
              <Box bg="bg.subtle" p={8} borderRadius="md" textAlign="center">
                <Text color="fg.muted">
                  No RSVPs yet. RSVP to an event below or paste an AT-URI into the
                  RSVP form on an event you'd like to attend.
                </Text>
              </Box>
            ) : (
              <Stack gap={3}>
                {rsvps
                  .slice()
                  .sort((a, b) =>
                    sortEventsByStart(
                      a.event?.value ?? null,
                      b.event?.value ?? null
                    )
                  )
                  .map((r) => (
                    <RsvpCard
                      key={r.uri}
                      rsvp={r}
                      busy={rsvpBusy === r.value.subject.uri}
                      onChangeStatus={(s) => {
                        if (!r.event) return;
                        return setRsvpStatus(r.event, s);
                      }}
                    />
                  ))}
              </Stack>
            )}
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Box>
  );
}

function sortEventsByStart(a: EventRecord | null, b: EventRecord | null) {
  const aT = a?.startsAt ? new Date(a.startsAt).getTime() : Infinity;
  const bT = b?.startsAt ? new Date(b.startsAt).getTime() : Infinity;
  return aT - bT;
}

interface EventCardProps {
  entry: EventEntry;
  myRsvp: RsvpEntry | null;
  busy: boolean;
  onRsvp: (status: RsvpStatus | null) => void;
}

function EventCard({ entry, myRsvp, busy, onRsvp }: EventCardProps) {
  const rkey = rkeyFromUri(entry.uri);
  const v = entry.value;
  const currentStatus = myRsvp?.value.status ?? null;

  return (
    <Card.Root variant="outline">
      <Card.Body>
        <Flex justify="space-between" align="start" gap={4} wrap="wrap">
          <Box flex="1" minW="240px">
            <Heading as="h3" size="md" mb={1}>
              <RouterLink to={`/events/${encodeURIComponent(rkey)}`}>
                {v.name}
              </RouterLink>
            </Heading>
            <EventMeta value={v} />
            {v.description && (
              <Text fontSize="sm" color="fg.muted" mt={2} lineClamp={3}>
                {v.description}
              </Text>
            )}
          </Box>
          <Stack gap={1} minW="160px">
            <Text fontSize="xs" color="fg.muted">
              Your RSVP
            </Text>
            <HStack gap={1} wrap="wrap">
              {RSVP_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="xs"
                  variant={currentStatus === opt.value ? 'solid' : 'outline'}
                  colorPalette={currentStatus === opt.value ? 'teal' : undefined}
                  onClick={() => onRsvp(opt.value)}
                  disabled={busy}
                >
                  {opt.label}
                </Button>
              ))}
              {currentStatus && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onRsvp(null)}
                  disabled={busy}
                >
                  Clear
                </Button>
              )}
            </HStack>
          </Stack>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

interface RsvpCardProps {
  rsvp: RsvpEntry;
  busy: boolean;
  onChangeStatus: (status: RsvpStatus | null) => void;
}

function RsvpCard({ rsvp, busy, onChangeStatus }: RsvpCardProps) {
  const event = rsvp.event;
  const currentStatus = rsvp.value.status;

  return (
    <Card.Root variant="outline">
      <Card.Body>
        <Flex justify="space-between" align="start" gap={4} wrap="wrap">
          <Box flex="1" minW="240px">
            <HStack gap={2} align="baseline" wrap="wrap" mb={1}>
              <Heading as="h3" size="md">
                {event?.value.name ?? <Text as="span" color="fg.muted">(event not found)</Text>}
              </Heading>
              <Text
                fontSize="xs"
                bg="accent.muted"
                color="accent.default"
                px={2}
                py={0.5}
                borderRadius="sm"
                textTransform="uppercase"
                letterSpacing="0.05em"
                fontWeight={600}
              >
                {shortEnumLabel(currentStatus)}
              </Text>
            </HStack>
            {event && <EventMeta value={event.value} />}
            <Text fontSize="xs" color="fg.muted" mt={2} wordBreak="break-all">
              {rsvp.value.subject.uri}
            </Text>
          </Box>
          {event && (
            <Stack gap={1} minW="160px">
              <Text fontSize="xs" color="fg.muted">
                Change RSVP
              </Text>
              <HStack gap={1} wrap="wrap">
                {RSVP_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    size="xs"
                    variant={currentStatus === opt.value ? 'solid' : 'outline'}
                    colorPalette={currentStatus === opt.value ? 'teal' : undefined}
                    onClick={() => onChangeStatus(opt.value)}
                    disabled={busy}
                  >
                    {opt.label}
                  </Button>
                ))}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onChangeStatus(null)}
                  disabled={busy}
                >
                  Withdraw
                </Button>
              </HStack>
            </Stack>
          )}
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

function EventMeta({ value }: { value: EventRecord }) {
  const mode = shortEnumLabel(value.mode);
  const status = shortEnumLabel(value.status);
  return (
    <Stack gap={0.5}>
      {(value.startsAt || value.endsAt) && (
        <Text fontSize="sm" color="fg.muted">
          {value.startsAt && new Date(value.startsAt).toLocaleString()}
          {value.startsAt && value.endsAt && ' → '}
          {value.endsAt && new Date(value.endsAt).toLocaleString()}
        </Text>
      )}
      {(mode || status) && (
        <HStack gap={2}>
          {mode && (
            <Text
              fontSize="2xs"
              bg="bg.muted"
              color="fg.muted"
              px={1.5}
              borderRadius="sm"
              textTransform="uppercase"
              letterSpacing="0.05em"
              fontWeight={600}
            >
              {mode}
            </Text>
          )}
          {status && status !== 'scheduled' && (
            <Text
              fontSize="2xs"
              bg="bg.muted"
              color="fg.error"
              px={1.5}
              borderRadius="sm"
              textTransform="uppercase"
              letterSpacing="0.05em"
              fontWeight={600}
            >
              {status}
            </Text>
          )}
        </HStack>
      )}
      {value.locations && value.locations.length > 0 && (
        <Text fontSize="sm" color="fg.muted">
          {value.locations
            .map((l) =>
              [l.name, l.locality, l.region, l.country].filter(Boolean).join(', ')
            )
            .filter((s) => s.length > 0)
            .join(' · ')}
        </Text>
      )}
    </Stack>
  );
}
