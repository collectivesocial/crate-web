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
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import {
  buildBreadcrumb,
  createNote,
  deleteNote,
  getNote,
  listNotes,
  rkeyFromUri,
  updateNote,
  type NoteEntry,
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
  const [parent, setParent] = useState<string>('');
  const [draft, setDraft] = useState(false);
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [allNotes, setAllNotes] = useState<NoteEntry[]>([]);

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
        setParent(entry.value.parent ?? '');
        setDraft(entry.value.draft === true);
        setCurrentUri(entry.uri);
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

  // Load every note once so we can populate the parent picker and walk the
  // breadcrumb chain locally.
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    listNotes({ limit: 100 })
      .then((data) => {
        if (!cancelled) setAllNotes(data.notes);
      })
      .catch(() => {
        /* non-fatal — parent picker just won't populate */
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const byUri = useMemo(
    () => new Map(allNotes.map((n) => [n.uri, n])),
    [allNotes]
  );

  const breadcrumb = useMemo(() => {
    if (!parent) return [];
    // Build a synthetic NoteEntry that points at our chosen parent so we can
    // reuse buildBreadcrumb to walk upward from there.
    const parentEntry = byUri.get(parent);
    if (!parentEntry) return [];
    return [...buildBreadcrumb(parentEntry, byUri), parentEntry];
  }, [parent, byUri]);

  // Notes available as a parent option — exclude the current note and any of
  // its descendants to prevent cycles.
  const parentOptions = useMemo(() => {
    if (!currentUri) return allNotes;
    const descendants = new Set<string>([currentUri]);
    // Walk the tree breadth-first: anything whose parent chain reaches
    // currentUri is a descendant.
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of allNotes) {
        if (n.value.parent && descendants.has(n.value.parent) && !descendants.has(n.uri)) {
          descendants.add(n.uri);
          changed = true;
        }
      }
    }
    return allNotes.filter((n) => !descendants.has(n.uri));
  }, [allNotes, currentUri]);

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
      parent: parent || undefined,
      draft: draft || undefined,
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
      {breadcrumb.length > 0 && (
        <HStack gap={1} mb={2} fontSize="sm" color="fg.muted" flexWrap="wrap">
          <RouterLink to="/notes">Notes</RouterLink>
          {breadcrumb.map((ancestor) => (
            <HStack key={ancestor.uri} gap={1}>
              <Text as="span">/</Text>
              <RouterLink to={`/notes/${encodeURIComponent(rkeyFromUri(ancestor.uri))}`}>
                {ancestor.value.title}
              </RouterLink>
            </HStack>
          ))}
          <Text as="span">/</Text>
          <Text as="span" color="fg.default">
            {title || (isNew ? 'New note' : 'Untitled')}
          </Text>
        </HStack>
      )}

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
          <label htmlFor="note-parent" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Parent note (optional)</Text>
          </label>
          <select
            id="note-parent"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--chakra-colors-border)',
              background: 'var(--chakra-colors-bg)',
              color: 'var(--chakra-colors-fg)',
              fontSize: '0.95rem',
            }}
          >
            <option value="">— No parent (root note) —</option>
            {parentOptions.map((n) => (
              <option key={n.uri} value={n.uri}>
                {n.value.title}
              </option>
            ))}
          </select>
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
          <label
            htmlFor="note-draft"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <input
              id="note-draft"
              type="checkbox"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
            />
            <Text as="span" fontSize="sm" color="fg.muted">
              Draft — keep this note private (note this is still public in your PDS)
            </Text>
          </label>
        </Box>

        <Box>
          <label htmlFor="note-body" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Body (markdown)</Text>
          </label>
          <MarkdownEditor
            id="note-body"
            value={body}
            onChange={setBody}
            placeholder="Write your note here…"
            rows={24}
          />
        </Box>
      </Stack>
    </Box>
  );
}
