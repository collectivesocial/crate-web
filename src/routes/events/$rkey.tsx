import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createEvent,
  deleteEvent,
  EVENT_MODES,
  EVENT_STATUSES,
  type EventInput,
  type EventLocation,
  type EventMode,
  type EventStatus,
  type EventUri,
  getEvent,
  rkeyFromUri,
  shortEnumLabel,
  updateEvent,
} from '../../lib/events';
import { useSession } from '../../lib/session';

const NEW = 'new';

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  marginBottom: '0.25rem',
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid var(--chakra-colors-border)',
  background: 'var(--chakra-colors-bg)',
  color: 'var(--chakra-colors-fg)',
  fontSize: '0.95rem',
};

function toLocalInput(isoOrEmpty: string | undefined): string {
  if (!isoOrEmpty) return '';
  const d = new Date(isoOrEmpty);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function EventEditorPage() {
  const params = useParams<{ rkey: string }>();
  const rkey = params.rkey ?? NEW;
  const isNew = rkey === NEW;

  const { status } = useSession();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [mode, setMode] = useState<EventMode | ''>('');
  const [eventStatus, setEventStatus] = useState<EventStatus>(
    'community.lexicon.calendar.event#scheduled'
  );
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [uris, setUris] = useState<EventUri[]>([]);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (isNew || status !== 'authenticated') return;

    let cancelled = false;
    setLoading(true);
    getEvent(rkey)
      .then((entry) => {
        if (cancelled) return;
        const v = entry.value;
        setName(v.name);
        setDescription(v.description ?? '');
        setStartsAt(toLocalInput(v.startsAt));
        setEndsAt(toLocalInput(v.endsAt));
        setMode((v.mode as EventMode) ?? '');
        setEventStatus(
          (v.status as EventStatus) ??
            'community.lexicon.calendar.event#scheduled'
        );
        setLocations(v.locations ?? []);
        setUris(v.uris ?? []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rkey, isNew, status, navigate]);

  const onSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const input: EventInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
      mode: mode || undefined,
      status: eventStatus,
      locations: locations.length > 0 ? locations : undefined,
      uris: uris.filter((u) => u.uri.trim()).length > 0 ? uris : undefined,
    };

    setSaving(true);
    try {
      if (isNew) {
        const entry = await createEvent(input);
        const newRkey = rkeyFromUri(entry.uri);
        navigate(`/events/${encodeURIComponent(newRkey)}`, { replace: true });
      } else {
        await updateEvent(rkey, input);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isNew) return;
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEvent(rkey);
      navigate('/events', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <HStack>
        <Spinner size="sm" />
        <Text color="fg.muted">Loading…</Text>
      </HStack>
    );
  }

  return (
    <Box maxW="container.content">
      <Flex align="center" justify="space-between" mb={6}>
        <Heading as="h1" size="xl">
          {isNew ? 'New event' : 'Edit event'}
        </Heading>
        <HStack gap={2}>
          {!isNew && (
            <Button
              variant="outline"
              colorPalette="red"
              onClick={onDelete}
              disabled={saving || deleting}
              loading={deleting}
            >
              Delete
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => navigate('/events')}
            disabled={saving || deleting}
          >
            Cancel
          </Button>
          <Button
            colorPalette="teal"
            onClick={onSave}
            disabled={saving || deleting}
            loading={saving}
          >
            Save
          </Button>
        </HStack>
      </Flex>

      {error && (
        <Box
          bg="accent.muted"
          borderWidth="1px"
          borderColor="border.subtle"
          p={3}
          borderRadius="md"
          mb={4}
        >
          <Text color="fg.error">{error}</Text>
        </Box>
      )}

      <Stack gap={4}>
        <Box>
          <label htmlFor="event-name" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Name</Text>
          </label>
          <Input
            id="event-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Speaking at QCon"
            size="lg"
          />
        </Box>

        <Box>
          <label htmlFor="event-description" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Description (optional)
            </Text>
          </label>
          <Textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda, notes, what to expect…"
            rows={4}
          />
        </Box>

        <Flex gap={4} wrap="wrap">
          <Box flex="1" minW="240px">
            <label htmlFor="event-starts-at" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">Starts at</Text>
            </label>
            <Input
              id="event-starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </Box>
          <Box flex="1" minW="240px">
            <label htmlFor="event-ends-at" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">Ends at</Text>
            </label>
            <Input
              id="event-ends-at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </Box>
        </Flex>

        <Flex gap={4} wrap="wrap">
          <Box flex="1" minW="200px">
            <label htmlFor="event-mode" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">Mode</Text>
            </label>
            <select
              id="event-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as EventMode | '')}
              style={selectStyle}
            >
              <option value="">— Unspecified —</option>
              {EVENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {shortEnumLabel(m)}
                </option>
              ))}
            </select>
          </Box>
          <Box flex="1" minW="200px">
            <label htmlFor="event-status" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">Status</Text>
            </label>
            <select
              id="event-status"
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value as EventStatus)}
              style={selectStyle}
            >
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {shortEnumLabel(s)}
                </option>
              ))}
            </select>
          </Box>
        </Flex>

        <Box>
          <Flex align="center" justify="space-between" mb={2}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Locations
            </Text>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                setLocations((prev) => [...prev, { name: '', locality: '' }])
              }
            >
              <LuPlus /> Add location
            </Button>
          </Flex>
          <Stack gap={2}>
            {locations.length === 0 && (
              <Text fontSize="xs" color="fg.muted">
                No locations yet. Add one for in-person or hybrid events.
              </Text>
            )}
            {locations.map((loc, idx) => (
              <Flex
                key={idx}
                gap={2}
                wrap="wrap"
                borderWidth="1px"
                borderColor="border.subtle"
                borderRadius="md"
                p={2}
              >
                <Input
                  flex="2"
                  minW="180px"
                  size="sm"
                  placeholder="Venue name"
                  value={loc.name ?? ''}
                  onChange={(e) =>
                    setLocations((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, name: e.target.value } : l))
                    )
                  }
                />
                <Input
                  flex="1"
                  minW="120px"
                  size="sm"
                  placeholder="City"
                  value={loc.locality ?? ''}
                  onChange={(e) =>
                    setLocations((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, locality: e.target.value } : l
                      )
                    )
                  }
                />
                <Input
                  flex="1"
                  minW="100px"
                  size="sm"
                  placeholder="Region"
                  value={loc.region ?? ''}
                  onChange={(e) =>
                    setLocations((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, region: e.target.value } : l
                      )
                    )
                  }
                />
                <Input
                  flex="1"
                  minW="100px"
                  size="sm"
                  placeholder="Country"
                  value={loc.country ?? ''}
                  onChange={(e) =>
                    setLocations((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, country: e.target.value } : l
                      )
                    )
                  }
                />
                <IconButton
                  aria-label="Remove location"
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() =>
                    setLocations((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <LuTrash2 />
                </IconButton>
              </Flex>
            ))}
          </Stack>
        </Box>

        <Box>
          <Flex align="center" justify="space-between" mb={2}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Links
            </Text>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setUris((prev) => [...prev, { uri: '', name: '' }])}
            >
              <LuPlus /> Add link
            </Button>
          </Flex>
          <Stack gap={2}>
            {uris.length === 0 && (
              <Text fontSize="xs" color="fg.muted">
                Add ticket pages, Zoom links, conference websites, etc.
              </Text>
            )}
            {uris.map((u, idx) => (
              <Flex
                key={idx}
                gap={2}
                wrap="wrap"
                borderWidth="1px"
                borderColor="border.subtle"
                borderRadius="md"
                p={2}
              >
                <Input
                  flex="1"
                  minW="140px"
                  size="sm"
                  placeholder="Label (e.g. 'Tickets')"
                  value={u.name ?? ''}
                  onChange={(e) =>
                    setUris((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, name: e.target.value } : x
                      )
                    )
                  }
                />
                <Input
                  flex="3"
                  minW="220px"
                  size="sm"
                  type="url"
                  placeholder="https://…"
                  value={u.uri}
                  onChange={(e) =>
                    setUris((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, uri: e.target.value } : x
                      )
                    )
                  }
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <IconButton
                  aria-label="Remove link"
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => setUris((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <LuTrash2 />
                </IconButton>
              </Flex>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
