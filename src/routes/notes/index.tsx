import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { LuChevronDown, LuChevronRight, LuFileText } from 'react-icons/lu';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { listAllNotes, type NoteEntry, rkeyFromUri } from '../../lib/notes';
import { useSession } from '../../lib/session';

/** A node in the rendered tree: a note plus its (sorted) children. */
interface TreeNode {
  note: NoteEntry;
  children: TreeNode[];
}

/**
 * Build a parent → children tree from the flat list. Notes whose `parent` is
 * not present in the set are treated as roots so nothing gets orphaned if a
 * parent is missing or off the current page.
 */
function buildTree(notes: NoteEntry[]): TreeNode[] {
  const byUri = new Map<string, TreeNode>();
  for (const n of notes) byUri.set(n.uri, { note: n, children: [] });

  const roots: TreeNode[] = [];
  for (const node of byUri.values()) {
    const parentUri = node.note.value.parent;
    const parent = parentUri ? byUri.get(parentUri) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortByTitle = (a: TreeNode, b: TreeNode) =>
    a.note.value.title.localeCompare(b.note.value.title);
  const sortRecursive = (nodes: TreeNode[]) => {
    nodes.sort(sortByTitle);
    for (const n of nodes) sortRecursive(n.children);
  };
  sortRecursive(roots);

  return roots;
}

export function NotesPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Collapsed set stores URIs that the user has explicitly collapsed. Default
  // is expanded so newly-imported trees are immediately browsable.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    setError(null);
    // Page through every note so the tree view is complete; a 50-note
    // default page would silently hide everything past the first batch.
    listAllNotes()
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

  const tree = useMemo(() => buildTree(notes ?? []), [notes]);

  const toggle = (uri: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    // Only collapse nodes that actually have children — leaves don't matter.
    const all = new Set<string>();
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.children.length > 0) {
          all.add(n.note.uri);
          walk(n.children);
        }
      }
    };
    walk(tree);
    setCollapsed(all);
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={3}>
        <Heading as="h1" size="xl">
          Notes
        </Heading>
        <HStack gap={2}>
          {notes && notes.length > 0 && (
            <>
              <Button size="sm" variant="ghost" onClick={expandAll}>
                Expand all
              </Button>
              <Button size="sm" variant="ghost" onClick={collapseAll}>
                Collapse all
              </Button>
            </>
          )}
          <Button colorPalette="teal" asChild>
            <RouterLink to="/notes/new">+ New note</RouterLink>
          </Button>
        </HStack>
      </Flex>

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
          <HStack gap={3} justify="center" wrap="wrap">
            <Button colorPalette="teal" asChild>
              <RouterLink to="/notes/new">Write your first note</RouterLink>
            </Button>
            <Button variant="outline" asChild>
              <RouterLink to="/notes/import">…or import a folder</RouterLink>
            </Button>
          </HStack>
          <Text fontSize="sm" color="fg.muted" mt={3}>
            Already have a digital garden? Drop your existing markdown folder
            and we'll preserve the hierarchy.
          </Text>
        </Box>
      )}

      {status === 'authenticated' && tree.length > 0 && (
        <Box
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="md"
          bg="bg.subtle"
          py={1}
        >
          <Stack gap={0}>
            {tree.map((node) => (
              <TreeRow
                key={node.note.uri}
                node={node}
                depth={0}
                collapsed={collapsed}
                onToggle={toggle}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggle: (uri: string) => void;
}

/** Single row in the tree, plus recursive children when expanded. */
function TreeRow({ node, depth, collapsed, onToggle }: TreeRowProps) {
  const { note, children } = node;
  const hasChildren = children.length > 0;
  const isOpen = !collapsed.has(note.uri);
  const rkey = rkeyFromUri(note.uri);

  // 20px per level keeps deep hierarchies legible without running off the
  // right edge. The chevron column itself is fixed-width so titles align.
  const indentPx = depth * 20;

  return (
    <>
      <Flex
        align="center"
        gap={2}
        pl={`${indentPx + 8}px`}
        pr={3}
        py={1.5}
        _hover={{ bg: 'bg.muted' }}
        borderRadius="sm"
      >
        {hasChildren ? (
          <IconButton
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            size="2xs"
            variant="ghost"
            onClick={() => onToggle(note.uri)}
          >
            {isOpen ? <LuChevronDown /> : <LuChevronRight />}
          </IconButton>
        ) : (
          <Box w="22px" display="flex" justifyContent="center" color="fg.muted">
            <LuFileText size={12} />
          </Box>
        )}

        <Box flex="1" minW={0}>
          <HStack gap={2} align="baseline" wrap="wrap">
            <Text
              fontSize="sm"
              fontWeight={hasChildren ? 600 : 500}
              lineClamp={1}
            >
              <RouterLink to={`/notes/${encodeURIComponent(rkey)}`}>
                {note.value.title}
              </RouterLink>
            </Text>
            {note.value.draft && (
              <Text
                fontSize="2xs"
                bg="bg.subtle"
                color="fg.muted"
                px={1.5}
                borderRadius="sm"
                textTransform="uppercase"
                letterSpacing="0.05em"
                fontWeight={600}
                borderWidth="1px"
                borderColor="border.subtle"
              >
                Draft
              </Text>
            )}
            {hasChildren && (
              <Text fontSize="2xs" color="fg.muted">
                ({children.length})
              </Text>
            )}
          </HStack>
          {note.value.tags && note.value.tags.length > 0 && (
            <HStack gap={1} mt={0.5} wrap="wrap">
              {note.value.tags.map((t) => (
                <Text
                  key={t}
                  fontSize="2xs"
                  color="accent.default"
                  bg="accent.muted"
                  px={1.5}
                  borderRadius="sm"
                >
                  #{t}
                </Text>
              ))}
            </HStack>
          )}
        </Box>

        <Text fontSize="2xs" color="fg.muted" flexShrink={0}>
          {new Date(note.value.publishedAt).toLocaleDateString()}
        </Text>
      </Flex>

      {hasChildren && isOpen && (
        <>
          {children.map((child) => (
            <TreeRow
              key={child.note.uri}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </>
      )}
    </>
  );
}
