import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BskyPostPicker } from '../../components/BskyPostPicker';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import {
  CONTENT_KINDS,
  createContent,
  deleteContent,
  getContent,
  rkeyFromUri,
  updateContent,
  uploadContentImage,
  type BlobRef,
  type ContentInput,
  type ContentKind,
} from '../../lib/content';
import { useSession } from '../../lib/session';

const NEW = 'new';

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  marginBottom: '0.25rem',
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid var(--chakra-colors-border)',
  background: 'var(--chakra-colors-bg)',
  color: 'var(--chakra-colors-fg)',
  fontSize: '0.95rem',
};

/** Local format expected by `<input type=datetime-local>`. */
function toLocalInput(isoOrEmpty: string): string {
  if (!isoOrEmpty) return '';
  const d = new Date(isoOrEmpty);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/**
 * Convert any Date-parseable string (ISO 8601, RFC 2822, frontmatter-style
 * "2025-01-06 06:00:00-08:00", etc.) into the local datetime format the
 * <input type=datetime-local> picker expects. Returns null when the input
 * is not a recognizable date so the caller can fall through to default
 * paste behavior.
 */
function parseAnyDateToLocal(raw: string): string | null {
  if (!raw) return null;
  let trimmed = raw.trim();
  // "YYYY-MM-DD HH:MM:SS-08:00" (frontmatter-style with a space) is not
  // accepted by every JS engine — promote the space to a T so Date.parse
  // handles it consistently.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) {
    trimmed = trimmed.replace(' ', 'T');
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return toLocalInput(d.toISOString());
}

export function ContentEditorPage() {
  const params = useParams<{ rkey: string }>();
  const rkey = params.rkey ?? NEW;
  const isNew = rkey === NEW;

  const { status } = useSession();
  const navigate = useNavigate();

  const [kind, setKind] = useState<ContentKind>('article');
  const [kindLabel, setKindLabel] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [image, setImage] = useState<BlobRef | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bskyPostRef, setBskyPostRef] = useState<{ uri: string; cid: string } | null>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Revoke object URLs when they're replaced or the component unmounts.
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (isNew || status !== 'authenticated') return;

    let cancelled = false;
    setLoading(true);
    getContent(rkey)
      .then((entry) => {
        if (cancelled) return;
        const v = entry.value;
        setKind(v.kind);
        setKindLabel(v.kindLabel ?? '');
        setTitle(v.title);
        setDescription(v.description ?? '');
        setBody(v.body ?? '');
        setCanonicalUrl(v.canonicalUrl ?? '');
        setTagsInput((v.tags ?? []).join(', '));
        setPublishedAt(toLocalInput(v.publishedAt));
        setImage(v.image ?? null);
        setImageAlt(v.imageAlt ?? '');
        setImagePreview(null);
        setBskyPostRef(v.bskyPostRef ?? null);
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

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const onPickImage = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    // Show a local preview immediately while the upload runs.
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImagePreview(url);
    try {
      const blob = await uploadContentImage(file);
      setImage(blob);
    } catch (err) {
      setError((err as Error).message);
      setImagePreview(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    } finally {
      setUploading(false);
    }
  };

  const onClearImage = () => {
    setImage(null);
    setImageAlt('');
    setImagePreview(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const onSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const input: ContentInput = {
      kind,
      kindLabel: kind === 'other' && kindLabel.trim() ? kindLabel.trim() : undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      body: body.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      image: image ?? undefined,
      imageAlt: imageAlt.trim() || undefined,
      bskyPostRef: bskyPostRef ?? undefined,
      publishedAt: fromLocalInput(publishedAt),
    };

    setSaving(true);
    try {
      if (isNew) {
        const entry = await createContent(input);
        const newRkey = rkeyFromUri(entry.uri);
        navigate(`/content/${encodeURIComponent(newRkey)}`, { replace: true });
      } else {
        await updateContent(rkey, input);
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
      await deleteContent(rkey);
      navigate('/content', { replace: true });
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

  const hasImage = Boolean(image || imagePreview);

  return (
    <Box maxW="container.content">
      <Flex align="center" justify="space-between" mb={6}>
        <Heading as="h1" size="xl">
          {isNew ? 'New content' : 'Edit content'}
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
            onClick={() => navigate('/content')}
            disabled={saving || deleting}
          >
            Cancel
          </Button>
          <Button
            colorPalette="teal"
            onClick={onSave}
            disabled={saving || deleting || uploading}
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
          <label htmlFor="content-title" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">Title</Text>
          </label>
          <Input
            id="content-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            size="lg"
          />
        </Box>

        <Flex gap={4} wrap="wrap">
          <Box flex="1" minW="200px">
            <label htmlFor="content-kind" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">Type</Text>
            </label>
            <select
              id="content-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ContentKind)}
              style={selectStyle}
            >
              {CONTENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </option>
              ))}
            </select>
          </Box>

          {kind === 'other' && (
            <Box flex="1" minW="200px">
              <label htmlFor="content-kind-label" style={labelStyle}>
                <Text as="span" fontSize="sm" color="fg.muted">
                  Describe the type
                </Text>
              </label>
              <Input
                id="content-kind-label"
                value={kindLabel}
                onChange={(e) => setKindLabel(e.target.value)}
                placeholder="zine, recipe, sticker pack…"
                autoFocus
              />
            </Box>
          )}

          <Box flex="1" minW="240px">
            <label htmlFor="content-published-at" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">
                Date (optional — defaults to now)
              </Text>
            </label>
            <Input
              id="content-published-at"
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                const parsed = parseAnyDateToLocal(pasted);
                if (parsed) {
                  e.preventDefault();
                  setPublishedAt(parsed);
                }
              }}
            />
          </Box>
        </Flex>

        <Box>
          <label htmlFor="content-canonical-url" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Link (optional — where this content lives elsewhere)
            </Text>
          </label>
          <Input
            id="content-canonical-url"
            type="url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder="https://example.com/post"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </Box>

        <Box>
          <Text as="span" fontSize="sm" color="fg.muted" style={labelStyle}>
            Image (optional)
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
          {hasImage ? (
            <Stack gap={2}>
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  maxH="240px"
                  borderRadius="md"
                  objectFit="contain"
                  bg="bg.subtle"
                />
              )}
              {!imagePreview && image && (
                <Box
                  bg="bg.subtle"
                  borderRadius="md"
                  p={3}
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <Text fontSize="sm" color="fg.muted">
                    Image attached ({image.mimeType}
                    {image.size ? ` · ${(image.size / 1024).toFixed(1)} KB` : ''})
                  </Text>
                </Box>
              )}
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPickImage}
                  disabled={uploading || saving}
                  loading={uploading}
                >
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={onClearImage}
                  disabled={uploading || saving}
                >
                  Remove
                </Button>
              </HStack>
            </Stack>
          ) : (
            <Button
              variant="outline"
              onClick={onPickImage}
              disabled={uploading || saving}
              loading={uploading}
            >
              Upload image
            </Button>
          )}
          {hasImage && (
            <Box mt={3}>
              <label htmlFor="content-image-alt" style={labelStyle}>
                <Text as="span" fontSize="sm" color="fg.muted">
                  Alt text (describe the image for screen readers)
                </Text>
              </label>
              <Input
                id="content-image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="A stick figure looking at a laptop with a flashlight…"
              />
            </Box>
          )}
        </Box>

        <Box>
          <label htmlFor="content-tags" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Tags (comma-separated, optional)
            </Text>
          </label>
          <Input
            id="content-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="atproto, illustration, fiber"
          />
        </Box>

        <Box>
          <Text fontSize="sm" color="fg.muted" mb={1}>
            Bluesky post (optional — link to the announcement post for off-platform comments)
          </Text>
          <BskyPostPicker value={bskyPostRef} onChange={setBskyPostRef} />
        </Box>

        <Box>
          <label htmlFor="content-description" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Description (optional — short summary or caption)
            </Text>
          </label>
          <Input
            id="content-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short summary…"
          />
        </Box>

        <Box>
          <label htmlFor="content-body" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Body (markdown, optional — omit for link-only entries)
            </Text>
          </label>
          <MarkdownEditor
            id="content-body"
            value={body}
            onChange={setBody}
            placeholder="Write the body of your content here…"
            rows={20}
          />
        </Box>
      </Stack>
    </Box>
  );
}
