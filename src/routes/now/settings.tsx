import {
  Box,
  Button,
  Card,
  Flex,
  HStack,
  Heading,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNowConfig,
  saveNowConfig,
  type LiveFeed,
  type LiveFeedFilter,
} from '../../lib/now';
import { useSession } from '../../lib/session';

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  marginBottom: '0.25rem',
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.375rem 0.5rem',
  borderRadius: '6px',
  border: '1px solid var(--chakra-colors-border)',
  background: 'var(--chakra-colors-bg)',
  color: 'var(--chakra-colors-fg)',
  fontSize: '0.875rem',
};

/** Quick presets users can drop in with one click. */
const PRESETS: LiveFeed[] = [
  {
    title: 'Recent Bluesky posts',
    collection: 'app.bsky.feed.post',
    limit: 5,
    filter: 'social.crate.now.config#topLevelPosts',
  },
  {
    title: 'In progress on Collective',
    collection: 'app.collectivesocial.feed.useritem',
    limit: 5,
  },
  {
    title: 'Latest crate content',
    collection: 'social.crate.content',
    limit: 5,
  },
  {
    title: 'Recent notes',
    collection: 'social.crate.note',
    limit: 5,
  },
];

const FILTER_LABELS: Record<LiveFeedFilter, string> = {
  'social.crate.now.config#topLevelPosts': 'Top-level posts only (drop replies)',
  'social.crate.now.config#noReplies': 'Top-level posts only (drop replies)',
  'social.crate.now.config#noReposts': 'Drop reposts',
};

export function NowSettingsPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const [feeds, setFeeds] = useState<LiveFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;
    let cancelled = false;
    getNowConfig()
      .then((data) => {
        if (cancelled) return;
        setFeeds(data.config?.value.liveFeeds ?? []);
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
  }, [status, navigate]);

  const update = (i: number, patch: Partial<LiveFeed>) =>
    setFeeds((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const remove = (i: number) =>
    setFeeds((prev) => prev.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setFeeds((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = (preset?: LiveFeed) =>
    setFeeds((prev) => [
      ...prev,
      preset ?? { title: '', collection: '', limit: 5 },
    ]);

  const onSave = async () => {
    setError(null);
    // Drop incomplete rows on save.
    const cleaned: LiveFeed[] = feeds
      .map((f) => ({
        ...f,
        title: f.title.trim(),
        collection: f.collection.trim(),
        did: f.did?.trim() || undefined,
      }))
      .filter((f) => f.title.length > 0 && f.collection.length > 0);
    setSaving(true);
    try {
      await saveNowConfig({ liveFeeds: cleaned });
      navigate('/now');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
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
          Now page settings
        </Heading>
        <HStack gap={2}>
          <Button variant="ghost" onClick={() => navigate('/now')} disabled={saving}>
            Cancel
          </Button>
          <Button colorPalette="teal" onClick={onSave} disabled={saving} loading={saving}>
            Save
          </Button>
        </HStack>
      </Flex>

      <Text fontSize="sm" color="fg.muted" mb={4} maxW="60ch">
        Live feeds pull the most recent records from any ATProto collection
        (yours by default) and render them under your now page. Useful for
        "recent Bluesky posts", "currently reading" from Collective, etc.
      </Text>

      {error && (
        <Box bg="accent.muted" borderWidth="1px" borderColor="border.subtle" p={3} borderRadius="md" mb={4}>
          <Text color="fg.error">{error}</Text>
        </Box>
      )}

      <Box mb={4}>
        <Text fontSize="sm" color="fg.muted" mb={2}>
          Quick add:
        </Text>
        <HStack gap={2} wrap="wrap">
          {PRESETS.map((p) => (
            <Button key={p.collection} size="xs" variant="outline" onClick={() => add(p)}>
              + {p.title}
            </Button>
          ))}
          <Button size="xs" variant="ghost" onClick={() => add()}>
            + Custom feed
          </Button>
        </HStack>
      </Box>

      <Stack gap={3}>
        {feeds.map((f, i) => (
          <Card.Root key={i} variant="outline">
            <Card.Body>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="sm" fontWeight={600}>
                  Feed {i + 1}
                </Text>
                <HStack gap={1}>
                  <IconButton
                    aria-label="Move up"
                    size="xs"
                    variant="ghost"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    aria-label="Move down"
                    size="xs"
                    variant="ghost"
                    onClick={() => move(i, 1)}
                    disabled={i === feeds.length - 1}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    aria-label="Remove"
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => remove(i)}
                  >
                    ✕
                  </IconButton>
                </HStack>
              </Flex>
              <Stack gap={2}>
                <Box>
                  <label style={labelStyle}>
                    <Text as="span" fontSize="xs" color="fg.muted">Display title</Text>
                  </label>
                  <Input
                    size="sm"
                    value={f.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="Recent Bluesky posts"
                  />
                </Box>
                <Flex gap={2} wrap="wrap">
                  <Box flex="2" minW="240px">
                    <label style={labelStyle}>
                      <Text as="span" fontSize="xs" color="fg.muted">
                        Collection (NSID)
                      </Text>
                    </label>
                    <Input
                      size="sm"
                      value={f.collection}
                      onChange={(e) => update(i, { collection: e.target.value })}
                      placeholder="app.bsky.feed.post"
                      fontFamily="mono"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </Box>
                  <Box flex="1" minW="100px">
                    <label style={labelStyle}>
                      <Text as="span" fontSize="xs" color="fg.muted">Limit</Text>
                    </label>
                    <Input
                      size="sm"
                      type="number"
                      min={1}
                      max={50}
                      value={f.limit ?? 5}
                      onChange={(e) =>
                        update(i, { limit: parseInt(e.target.value, 10) || 5 })
                      }
                    />
                  </Box>
                </Flex>
                <Box>
                  <label style={labelStyle}>
                    <Text as="span" fontSize="xs" color="fg.muted">
                      Author DID (optional — defaults to you)
                    </Text>
                  </label>
                  <Input
                    size="sm"
                    value={f.did ?? ''}
                    onChange={(e) => update(i, { did: e.target.value })}
                    placeholder="did:plc:…"
                    fontFamily="mono"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </Box>
                <Box>
                  <label style={labelStyle}>
                    <Text as="span" fontSize="xs" color="fg.muted">Filter</Text>
                  </label>
                  <select
                    style={selectStyle}
                    value={f.filter ?? ''}
                    onChange={(e) =>
                      update(i, {
                        filter: (e.target.value || undefined) as LiveFeedFilter | undefined,
                      })
                    }
                  >
                    <option value="">No filter</option>
                    {Object.entries(FILTER_LABELS)
                      .filter(
                        // Drop the duplicate alias from the dropdown.
                        ([key]) => key !== 'social.crate.now.config#noReplies'
                      )
                      .map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                  </select>
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
        {feeds.length === 0 && (
          <Box bg="bg.subtle" p={6} borderRadius="md" textAlign="center">
            <Text color="fg.muted">No live feeds yet. Add one above.</Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
