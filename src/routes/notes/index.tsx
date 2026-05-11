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
import { listNotes, type NoteEntry, rkeyFromUri } from '../../lib/notes';
import { useSession } from '../../lib/session';

export function NotesPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    setError(null);
    listNotes()
      .then((data) => {
        if (!cancelled) setNotes(data.notes);
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
        <Heading as="h1" size="xl">
          Notes
        </Heading>
        <Button colorPalette="teal" asChild>
          <RouterLink to="/notes/new">+ New note</RouterLink>
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

      {status === 'authenticated' && notes === null && !error && (
        <HStack>
          <Spinner size="sm" />
          <Text color="fg.muted">Loading notes…</Text>
        </HStack>
      )}

      {status === 'authenticated' && notes !== null && notes.length === 0 && (
        <Box bg="bg.subtle" p={8} borderRadius="md" textAlign="center">
          <Text color="fg.muted" mb={4}>
            No notes yet.
          </Text>
          <Button colorPalette="teal" asChild>
            <RouterLink to="/notes/new">Write your first note</RouterLink>
          </Button>
        </Box>
      )}

      {status === 'authenticated' && notes && notes.length > 0 && (
        <Stack gap={3}>
          {notes.map((n) => {
            const rkey = rkeyFromUri(n.uri);
            return (
              <Card.Root key={n.uri} variant="outline">
                <Card.Body>
                  <Flex justify="space-between" align="start" gap={4}>
                    <Box flex="1" minW={0}>
                      <Heading as="h3" size="md" mb={1}>
                        <RouterLink to={`/notes/${encodeURIComponent(rkey)}`}>
                          {n.value.title}
                        </RouterLink>
                      </Heading>
                      <Text fontSize="sm" color="fg.muted" mb={2}>
                        {n.value.slug} ·{' '}
                        {new Date(n.value.publishedAt).toLocaleDateString()}
                        {n.value.updatedAt && (
                          <> · updated {new Date(n.value.updatedAt).toLocaleDateString()}</>
                        )}
                      </Text>
                      {n.value.tags && n.value.tags.length > 0 && (
                        <HStack gap={2} mb={2}>
                          {n.value.tags.map((t) => (
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
                      <Text
                        fontSize="sm"
                        color="fg.muted"
                        lineClamp={2}
                        whiteSpace="pre-wrap"
                      >
                        {n.value.body}
                      </Text>
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
