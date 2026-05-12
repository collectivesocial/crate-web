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
import { BskyPostLink } from '../../components/BskyPostPicker';
import {
  listDocuments,
  rkeyFromUri,
  type DocumentEntry,
} from '../../lib/documents';
import { useSession } from '../../lib/session';

export function DocumentsPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    setError(null);
    listDocuments()
      .then((data) => {
        if (!cancelled) setDocuments(data.documents);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [status, navigate]);

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={6}>
        <Box>
          <Heading as="h1" size="xl">
            Documents
          </Heading>
          <Text fontSize="sm" color="fg.muted" mt={1}>
            <code>site.standard.document</code> records from your PDS
          </Text>
        </Box>
        <Button colorPalette="teal" asChild>
          <RouterLink to="/documents/new">+ New document</RouterLink>
        </Button>
      </Flex>

      {status === 'loading' && (
        <HStack>
          <Spinner size="sm" />
          <Text color="fg.muted">Loading session…</Text>
        </HStack>
      )}

      {error && (
        <Box bg="accent.muted" borderWidth="1px" borderColor="border.subtle" p={4} borderRadius="md" mb={4}>
          <Text color="fg.error">{error}</Text>
        </Box>
      )}

      {status === 'authenticated' && documents === null && !error && (
        <HStack>
          <Spinner size="sm" />
          <Text color="fg.muted">Loading documents…</Text>
        </HStack>
      )}

      {status === 'authenticated' && documents !== null && documents.length === 0 && (
        <Box bg="bg.subtle" p={8} borderRadius="md" textAlign="center">
          <Text color="fg.muted" mb={4}>
            No documents yet. Documents published through Offprint, Leaflet, or
            other <code>standard.site</code> apps will appear here, and you can
            create new ones to attach a Bluesky post for comments.
          </Text>
          <Button colorPalette="teal" asChild>
            <RouterLink to="/documents/new">Create your first document</RouterLink>
          </Button>
        </Box>
      )}

      {status === 'authenticated' && documents && documents.length > 0 && (
        <Stack gap={3}>
          {documents.map((d) => {
            const rkey = rkeyFromUri(d.uri);
            return (
              <Card.Root key={d.uri} variant="outline">
                <Card.Body>
                  <Flex justify="space-between" align="start" gap={4}>
                    <Box flex="1" minW={0}>
                      <Heading as="h3" size="md" mb={1}>
                        <RouterLink to={`/documents/${encodeURIComponent(rkey)}`}>
                          {d.value.title}
                        </RouterLink>
                      </Heading>
                      <Text fontSize="xs" color="fg.muted" mb={2} truncate>
                        {d.value.site}
                        {d.value.path ?? ''}
                      </Text>
                      {d.value.description && (
                        <Text fontSize="sm" color="fg.muted" lineClamp={2} mb={2}>
                          {d.value.description}
                        </Text>
                      )}
                      <HStack gap={3} fontSize="xs" color="fg.muted" flexWrap="wrap">
                        <Text>
                          Published {new Date(d.value.publishedAt).toLocaleDateString()}
                        </Text>
                        {d.value.updatedAt && (
                          <Text>
                            · updated {new Date(d.value.updatedAt).toLocaleDateString()}
                          </Text>
                        )}
                        {d.value.bskyPostRef && (
                          <Text as="span" color="accent.default">
                            · 🦋 has Bluesky thread{' '}
                            <BskyPostLink uri={d.value.bskyPostRef.uri} />
                          </Text>
                        )}
                      </HStack>
                      {d.value.tags && d.value.tags.length > 0 && (
                        <HStack gap={2} mt={2}>
                          {d.value.tags.map((t) => (
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
