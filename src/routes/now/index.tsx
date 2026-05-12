import {
  Box,
  Button,
  Card,
  Flex,
  HStack,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { MarkdownView } from '../../components/MarkdownEditor';
import {
  fetchLiveFeed,
  getCurrentNow,
  getNowConfig,
  type LiveFeed,
  type LiveFeedRecord,
  type NowEntry,
} from '../../lib/now';
import { useSession } from '../../lib/session';

export function NowPage() {
  const { status, user } = useSession();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<NowEntry | null | undefined>(undefined);
  const [liveFeeds, setLiveFeeds] = useState<LiveFeed[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    (async () => {
      try {
        const [{ entry }, { config }] = await Promise.all([
          getCurrentNow(),
          getNowConfig(),
        ]);
        if (cancelled) return;
        setEntry(entry);
        setLiveFeeds(config?.value.liveFeeds ?? []);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, navigate]);

  if (status === 'loading' || entry === undefined) {
    return (
      <HStack>
        <Spinner size="sm" />
        <Text color="fg.muted">Loading…</Text>
      </HStack>
    );
  }

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={3}>
        <Box>
          <Heading as="h1" size="xl">
            What I'm up to right now
          </Heading>
          {entry?.value.createdAt && (
            <Text fontSize="sm" color="fg.muted" mt={1}>
              Last updated {new Date(entry.value.createdAt).toLocaleDateString()}
              {entry.value.location && <> · {entry.value.location}</>}
            </Text>
          )}
        </Box>
        <HStack gap={2}>
          <Button variant="outline" size="sm" asChild>
            <RouterLink to="/now/settings">Settings</RouterLink>
          </Button>
          <Button colorPalette="teal" size="sm" asChild>
            <RouterLink to="/now/edit">
              {entry ? 'Update' : 'Write your now page'}
            </RouterLink>
          </Button>
        </HStack>
      </Flex>

      {error && (
        <Box bg="accent.muted" borderWidth="1px" borderColor="border.subtle" p={3} borderRadius="md" mb={4}>
          <Text color="fg.error">{error}</Text>
        </Box>
      )}

      {!entry && (
        <Box bg="bg.subtle" p={8} borderRadius="md" textAlign="center" mb={6}>
          <Text color="fg.muted" mb={4}>
            No now entry yet. Tell people what you're focused on.
          </Text>
          <Button colorPalette="teal" asChild>
            <RouterLink to="/now/edit">Write your first now</RouterLink>
          </Button>
        </Box>
      )}

      {entry && (
        <Stack gap={6} mb={8}>
          {entry.value.summary && (
            <Text fontSize="lg" color="fg.default" fontStyle="italic">
              {entry.value.summary}
            </Text>
          )}
          {entry.value.body && entry.value.body.trim() && (
            <Box>
              <MarkdownView>{entry.value.body}</MarkdownView>
            </Box>
          )}
          {entry.value.sections?.map((s, i) => (
            <Box key={`${s.title}-${i}`}>
              <Heading as="h2" size="lg" mb={2}>
                {s.title}
              </Heading>
              <MarkdownView>{s.body}</MarkdownView>
            </Box>
          ))}
        </Stack>
      )}

      {liveFeeds && liveFeeds.length > 0 && user?.did && (
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Recent activity
          </Heading>
          <Stack gap={6}>
            {liveFeeds.map((feed, i) => (
              <LiveFeedPanel key={`${feed.collection}-${i}`} feed={feed} ownerDid={user.did} />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

function LiveFeedPanel({ feed, ownerDid }: { feed: LiveFeed; ownerDid: string }) {
  const [records, setRecords] = useState<LiveFeedRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setRecords(null);
    fetchLiveFeed({
      did: feed.did || ownerDid,
      collection: feed.collection,
      limit: feed.limit ?? 5,
      filter: feed.filter,
    })
      .then((data) => {
        if (!cancelled) setRecords(data.records);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [feed.did, feed.collection, feed.limit, feed.filter, ownerDid]);

  return (
    <Box>
      <Flex align="baseline" justify="space-between" mb={2}>
        <Heading as="h3" size="md">
          {feed.title}
        </Heading>
        <Text fontSize="xs" color="fg.muted">
          {feed.collection}
        </Text>
      </Flex>
      {error && (
        <Text fontSize="sm" color="fg.error">
          {error}
        </Text>
      )}
      {records === null && !error && (
        <HStack>
          <Spinner size="xs" />
          <Text fontSize="sm" color="fg.muted">
            Loading…
          </Text>
        </HStack>
      )}
      {records && records.length === 0 && (
        <Text fontSize="sm" color="fg.muted">
          No recent records.
        </Text>
      )}
      {records && records.length > 0 && (
        <Stack gap={2}>
          {records.map((r) => (
            <RecordCard key={r.uri} record={r} collection={feed.collection} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

/**
 * Best-effort record preview. We don't know the lexicon shape generically,
 * so we look for common fields (text, title, body, description, createdAt)
 * and fall back to showing the AT-URI.
 */
function RecordCard({ record, collection }: { record: LiveFeedRecord; collection: string }) {
  const v = record.value as {
    text?: string;
    title?: string;
    body?: string;
    description?: string;
    createdAt?: string;
    publishedAt?: string;
    name?: string;
    kind?: string;
  };

  const headline = v.title || v.name || (v.text ? truncate(v.text, 200) : null);
  const subhead = !headline && v.description ? truncate(v.description, 200) : null;
  const timestamp = v.publishedAt || v.createdAt;
  const isBskyPost = collection === 'app.bsky.feed.post';

  return (
    <Card.Root variant="outline">
      <Card.Body py={3}>
        <Flex justify="space-between" align="start" gap={3}>
          <Box flex="1" minW={0}>
            {headline && (
              <Text fontSize="sm" whiteSpace="pre-wrap" lineClamp={3}>
                {headline}
              </Text>
            )}
            {subhead && (
              <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                {subhead}
              </Text>
            )}
            {!headline && !subhead && (
              <Text fontSize="xs" color="fg.muted" truncate>
                {record.uri}
              </Text>
            )}
            <HStack gap={3} fontSize="xs" color="fg.muted" mt={1}>
              {timestamp && <Text>{new Date(timestamp).toLocaleString()}</Text>}
              {v.kind && <Text>· {v.kind}</Text>}
              {isBskyPost && <BskyPostLink uri={record.uri} />}
            </HStack>
          </Box>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

function BskyPostLink({ uri }: { uri: string }) {
  const parts = uri.replace(/^at:\/\//, '').split('/');
  if (parts.length < 3) return null;
  const [didOrHandle, , rkey] = parts;
  return (
    <a
      href={`https://bsky.app/profile/${didOrHandle}/post/${rkey}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      view on bsky.app ↗
    </a>
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + '…';
}
