import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { LuExternalLink, LuPencil, LuTrash2 } from 'react-icons/lu';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  deleteFeed,
  type FeedEntry,
  listFeeds,
  rkeyFromUri,
} from '../../lib/feeds';
import { useSession } from '../../lib/session';

export function FeedsPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const [feeds, setFeeds] = useState<FeedEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyUri, setBusyUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listFeeds();
      setFeeds(data.feeds);
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

  const onDelete = async (entry: FeedEntry) => {
    if (!window.confirm(`Remove "${entry.value.title}"?`)) return;
    setBusyUri(entry.uri);
    setError(null);
    try {
      await deleteFeed(rkeyFromUri(entry.uri));
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyUri(null);
    }
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={3}>
        <Heading as="h1" size="xl">
          Feeds
        </Heading>
        <Button colorPalette="teal" asChild>
          <RouterLink to="/feeds/new">+ New feed</RouterLink>
        </Button>
      </Flex>

      <Text fontSize="sm" color="fg.muted" mb={4}>
        RSS / Atom feed links stored as <code>social.crate.rss.feed</code>{' '}
        records on your PDS. Renderers (like your personal site) can read these
        and list "feeds I follow" or "feeds I publish".
      </Text>

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

      {status === 'authenticated' && feeds === null && !error && (
        <HStack>
          <Spinner size="sm" />
          <Text color="fg.muted">Loading feeds…</Text>
        </HStack>
      )}

      {status === 'authenticated' && feeds !== null && feeds.length === 0 && (
        <Box bg="bg.subtle" p={8} borderRadius="md" textAlign="center">
          <Text color="fg.muted" mb={4}>
            No feeds yet.
          </Text>
          <Button colorPalette="teal" asChild>
            <RouterLink to="/feeds/new">Add your first feed</RouterLink>
          </Button>
        </Box>
      )}

      {status === 'authenticated' && feeds && feeds.length > 0 && (
        <Stack gap={3}>
          {feeds.map((entry) => {
            const v = entry.value;
            const rkey = rkeyFromUri(entry.uri);
            return (
              <Card.Root key={entry.uri} variant="outline">
                <Card.Body>
                  <Flex justify="space-between" align="start" gap={4} wrap="wrap">
                    <Box flex="1" minW={0}>
                      <Heading as="h3" size="md" mb={1}>
                        {v.title}
                      </Heading>
                      <Stack gap={1}>
                        <HStack gap={2} fontSize="sm" wrap="wrap">
                          <Text color="fg.muted" flexShrink={0}>
                            Feed:
                          </Text>
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--chakra-colors-accent-default)',
                              wordBreak: 'break-all',
                            }}
                          >
                            {v.url}
                          </a>
                          <LuExternalLink size={12} />
                        </HStack>
                        {v.siteUrl && (
                          <HStack gap={2} fontSize="sm" wrap="wrap">
                            <Text color="fg.muted" flexShrink={0}>
                              Site:
                            </Text>
                            <a
                              href={v.siteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--chakra-colors-accent-default)',
                                wordBreak: 'break-all',
                              }}
                            >
                              {v.siteUrl}
                            </a>
                            <LuExternalLink size={12} />
                          </HStack>
                        )}
                        {v.description && (
                          <Text fontSize="sm" color="fg.muted" mt={1} lineClamp={3}>
                            {v.description}
                          </Text>
                        )}
                      </Stack>
                    </Box>
                    <HStack gap={1} flexShrink={0}>
                      <IconButton
                        aria-label="Edit feed"
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <RouterLink to={`/feeds/${encodeURIComponent(rkey)}`}>
                          <LuPencil />
                        </RouterLink>
                      </IconButton>
                      <IconButton
                        aria-label="Delete feed"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => onDelete(entry)}
                        disabled={busyUri === entry.uri}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </HStack>
                  </Flex>
                </Card.Body>
              </Card.Root>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
