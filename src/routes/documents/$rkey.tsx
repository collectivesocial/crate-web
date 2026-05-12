import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BskyPostPicker } from '../../components/BskyPostPicker';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import {
  createDocument,
  deleteDocument,
  getDocument,
  rkeyFromUri,
  updateDocument,
  type BskyPostRef,
  type DocumentInput,
} from '../../lib/documents';
import { useSession } from '../../lib/session';

const NEW = 'new';

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  marginBottom: '0.25rem',
  display: 'block',
};

export function DocumentEditorPage() {
  const params = useParams<{ rkey: string }>();
  const rkey = params.rkey ?? NEW;
  const isNew = rkey === NEW;

  const { status } = useSession();
  const navigate = useNavigate();

  const [site, setSite] = useState('');
  const [path, setPath] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [bskyPostRef, setBskyPostRef] = useState<BskyPostRef | null>(null);

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
    getDocument(rkey)
      .then((entry) => {
        if (cancelled) return;
        setSite(entry.value.site);
        setPath(entry.value.path ?? '');
        setTitle(entry.value.title);
        setDescription(entry.value.description ?? '');
        setTextContent(entry.value.textContent ?? '');
        setTagsInput((entry.value.tags ?? []).join(', '));
        setBskyPostRef(entry.value.bskyPostRef ?? null);
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
    if (!site.trim() || !title.trim()) {
      setError('Site and title are required');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const input: DocumentInput = {
      site: site.trim(),
      path: path.trim() || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      textContent: textContent.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      bskyPostRef: bskyPostRef ?? undefined,
    };

    setSaving(true);
    try {
      if (isNew) {
        const entry = await createDocument(input);
        const newRkey = rkeyFromUri(entry.uri);
        navigate(`/documents/${encodeURIComponent(newRkey)}`, { replace: true });
      } else {
        await updateDocument(rkey, input);
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
      await deleteDocument(rkey);
      navigate('/documents', { replace: true });
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
          {isNew ? 'New document' : 'Edit document'}
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
          <Button variant="ghost" onClick={() => navigate('/documents')} disabled={saving || deleting}>
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
          <label htmlFor="doc-title" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Title</Text>
          </label>
          <Input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            size="lg"
          />
        </Box>

        <Flex gap={3} wrap="wrap">
          <Box flex="1" minW="280px">
            <label htmlFor="doc-site" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">
                Site (publication AT-URI or web URL)
              </Text>
            </label>
            <Input
              id="doc-site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="at://… or https://yourblog.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </Box>
          <Box flex="1" minW="200px">
            <label htmlFor="doc-path" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">Path (optional)</Text>
            </label>
            <Input
              id="doc-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/blog/getting-started"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </Box>
        </Flex>

        <Box>
          <label htmlFor="doc-description" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Description / excerpt (optional)</Text>
          </label>
          <Textarea
            id="doc-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description used for feeds and link previews."
            rows={3}
          />
        </Box>

        <Box>
          <label htmlFor="doc-tags" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Tags (comma-separated, optional)</Text>
          </label>
          <Input
            id="doc-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="atproto, longform, essay"
          />
        </Box>

        <Box>
          <Text fontSize="sm" color="fg.muted" mb={1}>
            Bluesky post (optional — used for off-platform comments)
          </Text>
          <BskyPostPicker value={bskyPostRef} onChange={setBskyPostRef} />
        </Box>

        <Box>
          <label htmlFor="doc-content" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Plaintext content (optional — markdown for preview only; saved as plaintext)
            </Text>
          </label>
          <MarkdownEditor
            id="doc-content"
            value={textContent}
            onChange={setTextContent}
            placeholder="Document content…"
            rows={24}
          />
        </Box>
      </Stack>
    </Box>
  );
}
