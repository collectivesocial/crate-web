import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Stack,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  listMyBskyPosts,
  resolveBskyPost,
  type BskyPostRef,
  type BskyPostSummary,
} from '../lib/documents';

export interface BskyPostPickerProps {
  /** Currently-attached post ref, if any. */
  value: BskyPostRef | null;
  onChange: (ref: BskyPostRef | null) => void;
}

/**
 * Compact picker for attaching a Bluesky post to a record. Two modes:
 *   - Paste a URL / AT-URI / rkey — resolved server-side to confirm the CID
 *   - Browse recent posts from the authed user's repo
 *
 * Returns a `{ uri, cid }` strongRef ready to embed as `bskyPostRef`.
 */
export function BskyPostPicker({ value, onChange }: BskyPostPickerProps) {
  if (value) {
    return <AttachedPost value={value} onClear={() => onChange(null)} />;
  }
  return <UnattachedPicker onPick={onChange} />;
}

function AttachedPost({ value, onClear }: { value: BskyPostRef; onClear: () => void }) {
  const [preview, setPreview] = useState<{ text: string; createdAt: string } | null>(null);

  // Cheap preview: we don't have a dedicated endpoint, so we use the public
  // bsky AppView via getPostThread. Falls back to just showing the URI.
  useEffect(() => {
    let cancelled = false;
    fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(value.uri)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.posts?.[0]) return;
        const post = data.posts[0] as {
          record?: { text?: string; createdAt?: string };
          indexedAt?: string;
        };
        setPreview({
          text: post.record?.text ?? '',
          createdAt: post.record?.createdAt ?? post.indexedAt ?? '',
        });
      })
      .catch(() => {
        /* swallow — preview is non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, [value.uri]);

  return (
    <Box
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="md"
      p={3}
    >
      <Flex align="start" justify="space-between" gap={3}>
        <Box flex="1" minW={0}>
          <Text fontSize="xs" color="fg.muted" mb={1}>
            Attached Bluesky post
          </Text>
          {preview ? (
            <>
              <Text fontSize="sm" lineClamp={3} whiteSpace="pre-wrap">
                {preview.text}
              </Text>
              {preview.createdAt && (
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {new Date(preview.createdAt).toLocaleString()}
                </Text>
              )}
            </>
          ) : (
            <Text fontSize="xs" color="fg.muted" truncate>
              {value.uri}
            </Text>
          )}
        </Box>
        <Button size="xs" variant="ghost" onClick={onClear}>
          Remove
        </Button>
      </Flex>
    </Box>
  );
}

function UnattachedPicker({ onPick }: { onPick: (ref: BskyPostRef) => void }) {
  const [mode, setMode] = useState<'paste' | 'browse'>('paste');
  return (
    <Box>
      <Tabs.Root value={mode} onValueChange={(d) => setMode(d.value as typeof mode)} size="sm">
        <Tabs.List>
          <Tabs.Trigger value="paste">Paste URL / rkey</Tabs.Trigger>
          <Tabs.Trigger value="browse">Browse my posts</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <Box mt={2}>
        {mode === 'paste' ? <PasteResolver onPick={onPick} /> : <BrowseMyPosts onPick={onPick} />}
      </Box>
    </Box>
  );
}

function PasteResolver({ onPick }: { onPick: (ref: BskyPostRef) => void }) {
  const [input, setInput] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onResolve = async () => {
    if (!input.trim()) return;
    setError(null);
    setResolving(true);
    try {
      const { ref } = await resolveBskyPost(input.trim());
      onPick(ref);
      setInput('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResolving(false);
    }
  };

  return (
    <Stack gap={2}>
      <HStack gap={2}>
        <Input
          size="sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://bsky.app/profile/handle/post/… or at:// or rkey"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void onResolve();
            }
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={onResolve}
          disabled={!input.trim() || resolving}
          loading={resolving}
        >
          Attach
        </Button>
      </HStack>
      {error && (
        <Text fontSize="xs" color="fg.error">
          {error}
        </Text>
      )}
      <Text fontSize="xs" color="fg.muted">
        Accepts a bsky.app URL, an AT-URI, or a bare rkey (your own posts).
      </Text>
    </Stack>
  );
}

function BrowseMyPosts({ onPick }: { onPick: (ref: BskyPostRef) => void }) {
  const [posts, setPosts] = useState<BskyPostSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    listMyBskyPosts({ limit: 25 })
      .then((data) => {
        if (!cancelled) setPosts(data.posts);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = (posts ?? []).filter((p) =>
    filter.trim() ? p.text.toLowerCase().includes(filter.toLowerCase()) : true
  );

  if (error) {
    return (
      <Text fontSize="sm" color="fg.error">
        {error}
      </Text>
    );
  }
  if (posts === null) {
    return (
      <HStack>
        <Spinner size="sm" />
        <Text fontSize="sm" color="fg.muted">
          Loading your posts…
        </Text>
      </HStack>
    );
  }
  if (posts.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        No Bluesky posts found in your repo.
      </Text>
    );
  }
  return (
    <Stack gap={2}>
      <Input
        size="sm"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter posts…"
      />
      <Box maxH="320px" overflowY="auto" borderWidth="1px" borderColor="border.subtle" borderRadius="md">
        <Stack gap={0}>
          {filtered.map((p) => (
            <Box
              key={p.uri}
              as="button"
              type="button"
              textAlign="left"
              px={3}
              py={2}
              borderBottomWidth="1px"
              borderColor="border.subtle"
              _hover={{ bg: 'bg.muted' }}
              _last={{ borderBottom: 'none' }}
              onClick={() => onPick({ uri: p.uri, cid: p.cid })}
            >
              <Text fontSize="sm" lineClamp={2} whiteSpace="pre-wrap">
                {p.text || <Text as="span" color="fg.muted" fontStyle="italic">(no text)</Text>}
              </Text>
              {p.createdAt && (
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {new Date(p.createdAt).toLocaleString()}
                </Text>
              )}
            </Box>
          ))}
          {filtered.length === 0 && (
            <Box px={3} py={2}>
              <Text fontSize="sm" color="fg.muted">
                No matches.
              </Text>
            </Box>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

/** Convenience: render a small bsky.app link for an existing post URI. */
export function BskyPostLink({ uri }: { uri: string }) {
  // uri shape: at://did/app.bsky.feed.post/rkey
  const parts = uri.replace(/^at:\/\//, '').split('/');
  if (parts.length < 3) return null;
  const [didOrHandle, , rkey] = parts;
  // bsky.app accepts DIDs directly in the URL.
  const href = `https://bsky.app/profile/${didOrHandle}/post/${rkey}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>
      view on bsky.app ↗
    </a>
  );
}

export type { BskyPostRef };
