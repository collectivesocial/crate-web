import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createNote,
  deleteNote,
  getNote,
  rkeyFromUri,
  updateNote,
  type NoteInput,
} from '../../lib/notes';
import { useSession } from '../../lib/session';

const NEW = 'new';

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  marginBottom: '0.25rem',
  display: 'block',
};

export function NoteEditorPage() {
  const params = useParams<{ rkey: string }>();
  const rkey = params.rkey ?? NEW;
  const isNew = rkey === NEW;

  const { status } = useSession();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [tagsInput, setTagsInput] = useState('');

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
    getNote(rkey)
      .then((entry) => {
        if (cancelled) return;
        setTitle(entry.value.title);
        setSlug(entry.value.slug);
        setBody(entry.value.body);
        setTagsInput((entry.value.tags ?? []).join(', '));
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
    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const input: NoteInput = {
      title: title.trim(),
      slug: slug.trim(),
      body,
      tags: tags.length > 0 ? tags : undefined,
    };

    setSaving(true);
    try {
      if (isNew) {
        const entry = await createNote(input);
        const newRkey = rkeyFromUri(entry.uri);
        navigate(`/notes/${encodeURIComponent(newRkey)}`, { replace: true });
      } else {
        await updateNote(rkey, input);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isNew) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteNote(rkey);
      navigate('/notes', { replace: true });
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
          {isNew ? 'New note' : 'Edit note'}
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
          <Button variant="ghost" onClick={() => navigate('/notes')} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button colorPalette="teal" onClick={onSave} disabled={saving || deleting} loading={saving}>
            Save
          </Button>
        </HStack>
      </Flex>

      {error && (
        <Box bg="accent.muted" borderWidth="1px" borderColor="border.subtle" p={3} borderRadius="md" mb={4}>
          <Text color="fg.error">{error}</Text>
        </Box>
      )}

      <Stack gap={4}>
        <Box>
          <label htmlFor="note-title" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Title</Text>
          </label>
          <Input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            size="lg"
          />
        </Box>

        <Box>
          <label htmlFor="note-slug" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Slug (URL-safe identifier)</Text>
          </label>
          <Input
            id="note-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-note-slug"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </Box>

        <Box>
          <label htmlFor="note-tags" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Tags (comma-separated, optional)</Text>
          </label>
          <Input
            id="note-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="atproto, zettelkasten, ideas"
          />
        </Box>

        <Box>
          <label htmlFor="note-body" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Body (markdown)</Text>
          </label>
          <Textarea
            id="note-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your note here…"
            rows={20}
            fontFamily="mono"
            fontSize="sm"
          />
        </Box>
      </Stack>
    </Box>
  );
}
