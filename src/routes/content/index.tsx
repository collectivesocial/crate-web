import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  CONTENT_KINDS,
  type ContentEntry,
  type ContentKind,
  listContent,
  rkeyFromUri,
} from '../../lib/content';
import { useSession } from '../../lib/session';

const ALL = 'all' as const;
type Filter = ContentKind | typeof ALL;

export function ContentPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(ALL);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    setError(null);
    setItems(null);
    listContent(filter === ALL ? {} : { kind: filter })
      .then((data) => {
        if (!cancelled) setItems(data.content);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [status, navigate, filter]);

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={3}>
        <Heading as="h1" size="xl">
          Content
        </Heading>
        <HStack gap={2}>
          <Button colorPalette="teal" asChild>
            <RouterLink to="/content/new">+ New content</RouterLink>
          </Button>
        </HStack>
      </Flex>

      <HStack gap={2} mb={6} wrap="wrap">
        <FilterChip label="All" active={filter === ALL} onClick={() => setFilter(ALL)} />
        {CONTENT_KINDS.map((k) => (
          <FilterChip
            key={k}
            label={titleCase(k)}
            active={filter === k}
            onClick={() => setFilter(k)}
          />
        ))}
      </HStack>

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

      {status === 'authenticated' && items === null && !error && (
        <HStack>
          <Spinner size="sm" />
          <Text color="fg.muted">Loading content…</Text>
        </HStack>
      )}

      {status === 'authenticated' && items !== null && items.length === 0 && (
        <Box bg="bg.subtle" p={8} borderRadius="md" textAlign="center">
          <Text color="fg.muted" mb={4}>
            No content yet{filter !== ALL ? ` in “${titleCase(filter)}”` : ''}.
          </Text>
          <Button colorPalette="teal" asChild>
            <RouterLink to="/content/new">Add your first piece</RouterLink>
          </Button>
        </Box>
      )}

      {status === 'authenticated' && items && items.length > 0 && (
        <Stack gap={3}>
          {items.map((c) => {
            const rkey = rkeyFromUri(c.uri);
            return (
              <Card.Root key={c.uri} variant="outline">
                <Card.Body>
                  <Flex justify="space-between" align="start" gap={4}>
                    <Box flex="1" minW={0}>
                      <HStack gap={2} mb={1} align="baseline" wrap="wrap">
                        <Heading as="h3" size="md">
                          <RouterLink to={`/content/${encodeURIComponent(rkey)}`}>
                            {c.value.title}
                          </RouterLink>
                        </Heading>
                        <KindBadge kind={c.value.kind} />
                      </HStack>
                      <Text fontSize="sm" color="fg.muted" mb={2}>
                        {new Date(c.value.publishedAt).toLocaleDateString()}
                        {c.value.canonicalUrl && (
                          <>
                            {' · '}
                            <a
                              href={c.value.canonicalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--chakra-colors-accent-default)',
                                textDecoration: 'underline',
                              }}
                            >
                              source
                            </a>
                          </>
                        )}
                      </Text>
                      {c.value.tags && c.value.tags.length > 0 && (
                        <HStack gap={2} mb={2} wrap="wrap">
                          {c.value.tags.map((t) => (
                            <Text
                              key={t}
                              fontSize="xs"
                              bg="accent.muted"
                              color="accent.default"
                              px={2}
                              py={0.5}
                              borderRadius="sm"
                            >
                              #{t}
                            </Text>
                          ))}
                        </HStack>
                      )}
                      {c.value.description && (
                        <Text
                          fontSize="sm"
                          color="fg.muted"
                          lineClamp={2}
                          whiteSpace="pre-wrap"
                        >
                          {c.value.description}
                        </Text>
                      )}
                    </Box>
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

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant={active ? 'solid' : 'outline'}
      colorPalette={active ? 'teal' : undefined}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function KindBadge({ kind }: { kind: ContentKind }) {
  return (
    <Text
      fontSize="xs"
      bg="bg.muted"
      color="fg.muted"
      px={2}
      py={0.5}
      borderRadius="sm"
      textTransform="uppercase"
      letterSpacing="0.05em"
      fontWeight={600}
    >
      {kind}
    </Text>
  );
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
