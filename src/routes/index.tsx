import { Box, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  listContent,
  rkeyFromUri as contentRkey,
  type ContentEntry,
} from '../lib/content';
import {
  listDocuments,
  rkeyFromUri as documentRkey,
  type DocumentEntry,
} from '../lib/documents';
import {
  getCurrentNow,
  listNowHistory,
  type NowEntry,
} from '../lib/now';
import {
  listNotes,
  rkeyFromUri as noteRkey,
  type NoteEntry,
} from '../lib/notes';
import { useSession } from '../lib/session';

/**
 * Section descriptions read in the workshop voice: matter-of-fact, plain.
 * One line per record type explaining what lives there. Kept short on purpose
 * — the dashboard is a workbench overview, not a marketing page.
 */
const SECTION_COPY = {
  notes: {
    description:
      'PKM/Zettelkasten markdown notes. Slug-addressable, supports parent links, draftable. The connective tissue of everything you write.',
    listPath: '/notes',
    newPath: '/notes/new',
    newLabel: 'New note',
  },
  content: {
    description:
      'Illustrations, articles, videos, talks, newsletters, podcasts. Long-form things you make and want rendered elsewhere.',
    listPath: '/content',
    newPath: '/content/new',
    newLabel: 'New content',
  },
  documents: {
    description:
      '`site.standard.document` records. Blog posts and newsletter entries that follow the Standard.site lexicon.',
    listPath: '/documents',
    newPath: '/documents/new',
    newLabel: 'New document',
  },
  now: {
    description:
      'Append-only stream of "what I\u2019m working on right now" updates. The latest entry is current.',
    listPath: '/now',
    newPath: '/now/edit',
    newLabel: 'New update',
  },
} as const;

interface RecentItem {
  rkey: string;
  title: string;
  meta: string;
  href: string;
}

interface SectionData {
  count: number;
  recent: RecentItem[];
  error: string | null;
}

interface DashboardData {
  notes: SectionData;
  content: SectionData;
  documents: SectionData;
  now: SectionData;
}

const EMPTY_SECTION: SectionData = { count: 0, recent: [], error: null };
const EMPTY: DashboardData = {
  notes: EMPTY_SECTION,
  content: EMPTY_SECTION,
  documents: EMPTY_SECTION,
  now: EMPTY_SECTION,
};

// Generous enough to surface a useful count without paging the dashboard.
const FETCH_LIMIT = 50;

export function HomePage() {
  const { status, user } = useSession();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    setData(null);

    // Fetch every section concurrently. One failing endpoint should not kill
    // the rest of the dashboard, so per-section errors surface inline rather
    // than throwing out of the whole load.
    (async () => {
      const [notes, content, documents, currentNow, nowHistory] =
        await Promise.allSettled([
          listNotes({ limit: FETCH_LIMIT }),
          listContent({ limit: FETCH_LIMIT }),
          listDocuments({ limit: FETCH_LIMIT }),
          getCurrentNow(),
          listNowHistory({ limit: FETCH_LIMIT }),
        ]);

      if (cancelled) return;

      const next: DashboardData = { ...EMPTY };

      next.notes =
        notes.status === 'fulfilled'
          ? {
              count: notes.value.notes.length,
              recent: notes.value.notes.slice(0, 3).map(noteToRecent),
              error: null,
            }
          : { count: 0, recent: [], error: errMsg(notes.reason) };

      next.content =
        content.status === 'fulfilled'
          ? {
              count: content.value.content.length,
              recent: content.value.content.slice(0, 3).map(contentToRecent),
              error: null,
            }
          : { count: 0, recent: [], error: errMsg(content.reason) };

      next.documents =
        documents.status === 'fulfilled'
          ? {
              count: documents.value.documents.length,
              recent: documents.value.documents
                .slice(0, 3)
                .map(documentToRecent),
              error: null,
            }
          : { count: 0, recent: [], error: errMsg(documents.reason) };

      // Merge "current now" with history (deduped), so the current entry
      // shows first when both endpoints come back.
      if (nowHistory.status === 'fulfilled') {
        const history = nowHistory.value.entries;
        const current =
          currentNow.status === 'fulfilled' ? currentNow.value.entry : null;
        const merged = current
          ? [current, ...history.filter((h) => h.uri !== current.uri)]
          : history;
        next.now = {
          count: merged.length,
          recent: merged.slice(0, 3).map(nowToRecent),
          error: null,
        };
      } else {
        next.now = { count: 0, recent: [], error: errMsg(nowHistory.reason) };
      }

      setData(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [status, navigate]);

  if (status === 'loading') {
    return <DashboardSkeleton greeting="Loading…" />;
  }

  if (status === 'authenticated' && data === null) {
    return (
      <DashboardSkeleton
        greeting={`Welcome back, ${greetingName(
          user?.displayName,
          user?.handle,
        )}.`}
      />
    );
  }

  if (data === null) {
    // Unauthenticated — the effect kicked off a redirect to /login.
    return null;
  }

  return (
    <Stack gap={10} w="full">
      <Box>
        <Heading as="h1" size="2xl" mb={1}>
          Welcome back, {greetingName(user?.displayName, user?.handle)}.
        </Heading>
        <Text color="fg.muted" fontSize="md">
          Four shelves on the workbench. Pick one up.
        </Text>
      </Box>

      <Section
        title="Notes"
        copy={SECTION_COPY.notes}
        data={data.notes}
        emptyLine="No notes yet."
      />
      <Section
        title="Content"
        copy={SECTION_COPY.content}
        data={data.content}
        emptyLine="No content pieces yet."
      />
      <Section
        title="Documents"
        copy={SECTION_COPY.documents}
        data={data.documents}
        emptyLine="No documents yet."
      />
      <Section
        title="Now"
        copy={SECTION_COPY.now}
        data={data.now}
        emptyLine="No now updates yet."
      />
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  copy: (typeof SECTION_COPY)[keyof typeof SECTION_COPY];
  data: SectionData;
  emptyLine: string;
}

function Section({ title, copy, data, emptyLine }: SectionProps) {
  return (
    <Box as="section" borderTop="1px solid" borderColor="border.card" pt={6}>
      <Flex
        justify="space-between"
        align="baseline"
        gap={4}
        mb={2}
        wrap="wrap"
      >
        <HStack gap={3} align="baseline">
          <Heading as="h2" size="lg">
            {title}
          </Heading>
          {data.error === null && (
            <Text
              fontFamily="mono"
              fontSize="sm"
              color="fg.subtle"
              aria-label={`${data.count} item${data.count === 1 ? '' : 's'}`}
            >
              {data.count}
            </Text>
          )}
        </HStack>
        <HStack gap={4}>
          <RouterLink to={copy.listPath}>
            <Text
              as="span"
              fontSize="xs"
              fontWeight="medium"
              letterSpacing="0.06em"
              textTransform="uppercase"
              color="fg.muted"
              _hover={{ color: 'accent.default' }}
            >
              View all
            </Text>
          </RouterLink>
          <RouterLink to={copy.newPath}>
            <Text
              as="span"
              fontSize="xs"
              fontWeight="medium"
              letterSpacing="0.06em"
              textTransform="uppercase"
              color="accent.default"
              _hover={{ color: 'accent.hover' }}
            >
              {copy.newLabel} →
            </Text>
          </RouterLink>
        </HStack>
      </Flex>

      <Text color="fg.muted" mb={4} maxW="62ch">
        {renderInlineCode(copy.description)}
      </Text>

      {data.error && (
        <Text color="fg.error" fontSize="sm">
          Couldn’t load: {data.error}
        </Text>
      )}

      {!data.error && data.recent.length === 0 && (
        <Text color="fg.subtle" fontSize="sm">
          {emptyLine}{' '}
          <RouterLink to={copy.newPath}>
            <Text
              as="span"
              color="accent.default"
              _hover={{ color: 'accent.hover', textDecoration: 'underline' }}
            >
              {copy.newLabel.toLowerCase()} →
            </Text>
          </RouterLink>
        </Text>
      )}

      {!data.error && data.recent.length > 0 && (
        <Stack
          as="ul"
          gap={0}
          listStyleType="none"
          borderTop="1px solid"
          borderColor="border.subtle"
        >
          {data.recent.map((item) => (
            <Box
              as="li"
              key={item.rkey}
              borderBottom="1px solid"
              borderColor="border.subtle"
              py={3}
            >
              <Flex
                justify="space-between"
                align="baseline"
                gap={4}
                wrap="wrap"
              >
                <RouterLink to={item.href}>
                  <Text
                    as="span"
                    fontWeight="medium"
                    color="fg.default"
                    _hover={{ color: 'accent.default' }}
                    truncate
                  >
                    {item.title}
                  </Text>
                </RouterLink>
                <Text
                  fontFamily="mono"
                  fontSize="xs"
                  color="fg.subtle"
                  flexShrink={0}
                >
                  {item.meta}
                </Text>
              </Flex>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton({ greeting }: { greeting: string }) {
  return (
    <Stack gap={10} w="full">
      <Box>
        <Heading as="h1" size="2xl" mb={1}>
          {greeting}
        </Heading>
        <Text color="fg.muted" fontSize="md">
          Loading shelves…
        </Text>
      </Box>
      {(['Notes', 'Content', 'Documents', 'Now'] as const).map((title) => (
        <Box
          key={title}
          as="section"
          borderTop="1px solid"
          borderColor="border.card"
          pt={6}
        >
          <Heading as="h2" size="lg" mb={2}>
            {title}
          </Heading>
          <SkeletonLine width="62ch" />
          <Stack mt={4} gap={3}>
            <SkeletonLine width="42ch" />
            <SkeletonLine width="36ch" />
            <SkeletonLine width="48ch" />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <Box
      bg="bg.muted"
      h="0.875rem"
      maxW={width}
      w="100%"
      borderRadius="xs"
      aria-hidden
    />
  );
}

// ---------------------------------------------------------------------------
// Adapters: record \u2192 RecentItem
// ---------------------------------------------------------------------------

function noteToRecent(n: NoteEntry): RecentItem {
  const rkey = noteRkey(n.uri);
  return {
    rkey,
    title: n.value.title || 'Untitled note',
    meta: formatDate(n.value.publishedAt || n.value.createdAt),
    href: `/notes/${encodeURIComponent(rkey)}`,
  };
}

function contentToRecent(c: ContentEntry): RecentItem {
  const rkey = contentRkey(c.uri);
  return {
    rkey,
    title: c.value.title || 'Untitled content',
    meta: `${c.value.kind} \u00b7 ${formatDate(
      c.value.publishedAt || c.value.createdAt,
    )}`,
    href: `/content/${encodeURIComponent(rkey)}`,
  };
}

function documentToRecent(d: DocumentEntry): RecentItem {
  const rkey = documentRkey(d.uri);
  // DocumentEntry's record shape varies (vendored site.standard.document
  // lexicon); pull only what we know is there.
  const v = d.value as {
    title?: string;
    publishedAt?: string;
    createdAt?: string;
  };
  return {
    rkey,
    title: v.title || 'Untitled document',
    meta: formatDate(v.publishedAt || v.createdAt || ''),
    href: `/documents/${encodeURIComponent(rkey)}`,
  };
}

function nowToRecent(entry: NowEntry): RecentItem {
  const v = entry.value as {
    summary?: string;
    body?: string;
    createdAt?: string;
    location?: string;
  };
  // Now entries don't have titles. Use summary, then a body excerpt, then a
  // friendly fallback.
  const title =
    v.summary ||
    (typeof v.body === 'string' && v.body.trim()
      ? excerpt(v.body, 60)
      : 'Now update');
  const date = formatDate(v.createdAt || '');
  const meta = v.location ? `${v.location} \u00b7 ${date}` : date;
  // No per-entry detail route exists yet; link to the section index.
  return {
    rkey: entry.uri,
    title,
    meta,
    href: '/now',
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function greetingName(
  displayName?: string | null,
  handle?: string | null,
): string {
  if (displayName && displayName.trim()) return displayName.trim();
  if (handle) {
    // "brittanyellich.com" \u2192 "brittanyellich"
    return handle.split('.')[0] || handle;
  }
  return 'friend';
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function excerpt(body: string, max: number): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max).trimEnd() + '\u2026';
}

function errMsg(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  return 'Unknown error';
}

/**
 * Lightweight inline-`code` renderer for section descriptions \u2014 keeps the
 * `site.standard.document` token in mono without pulling in react-markdown.
 */
function renderInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Text
          as="code"
          key={i}
          fontFamily="mono"
          fontSize="0.92em"
          bg="bg.subtle"
          px={1}
          borderRadius="xs"
        >
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
