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
  createFeed,
  deleteFeed,
  type FeedInput,
  getFeed,
  rkeyFromUri,
  updateFeed,
} from '../../lib/feeds';
import { useSession } from '../../lib/session';

const NEW = 'new';

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  marginBottom: '0.25rem',
  display: 'block',
};

export function FeedEditorPage() {
  const params = useParams<{ rkey: string }>();
  const rkey = params.rkey ?? NEW;
  const isNew = rkey === NEW;

  const { status } = useSession();
  const navigate = useNavigate();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [siteUrl, setSiteUrl] = useState('');

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
    getFeed(rkey)
      .then((entry) => {
        if (cancelled) return;
        const v = entry.value;
        setUrl(v.url);
        setTitle(v.title);
        setDescription(v.description ?? '');
        setSiteUrl(v.siteUrl ?? '');
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
    if (!url.trim() || !title.trim()) {
      setError('URL and title are required');
      return;
    }
    const input: FeedInput = {
      url: url.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      siteUrl: siteUrl.trim() || undefined,
    };
    setSaving(true);
    try {
      if (isNew) {
        const entry = await createFeed(input);
        const newRkey = rkeyFromUri(entry.uri);
        navigate(`/feeds/${encodeURIComponent(newRkey)}`, { replace: true });
      } else {
        await updateFeed(rkey, input);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isNew) return;
    if (!window.confirm(`Remove "${title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteFeed(rkey);
      navigate('/feeds', { replace: true });
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
          {isNew ? 'New feed' : 'Edit feed'}
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
            onClick={() => navigate('/feeds')}
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
          <label htmlFor="feed-title" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Title</Text>
          </label>
          <Input
            id="feed-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Overcommitted"
            size="lg"
          />
        </Box>

        <Box>
          <label htmlFor="feed-url" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Feed URL</Text>
          </label>
          <Input
            id="feed-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/feed.xml"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </Box>

        <Box>
          <label htmlFor="feed-site-url" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Site URL (optional — human-readable home page)
            </Text>
          </label>
          <Input
            id="feed-site-url"
            type="url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://example.com"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </Box>

        <Box>
          <label htmlFor="feed-description" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Description (optional)
            </Text>
          </label>
          <Textarea
            id="feed-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this feed about?"
            rows={3}
          />
        </Box>
      </Stack>
    </Box>
  );
}
