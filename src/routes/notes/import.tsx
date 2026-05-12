import {
  Box,
  Button,
  Collapsible,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  DEFAULT_FIELD_MAPPING,
  filesFromInput,
  parentPathFor,
  parseDroppedFile,
  readDroppedItems,
  synthesizeMissingIndexes,
  type DroppedFile,
  type FieldMapping,
  type ParsedNote,
} from '../../lib/noteImport';
import { createNote } from '../../lib/notes';
import { useSession } from '../../lib/session';

type ImportStatus = 'pending' | 'creating' | 'done' | 'error';

interface ImportRow extends ParsedNote {
  status: ImportStatus;
  uri?: string;
  error?: string;
}

/** Field labels + helper text shown next to each input row in the mapping UI. */
const MAPPING_FIELDS: Array<{
  key: keyof FieldMapping;
  label: string;
  help: string;
}> = [
  { key: 'title', label: 'Title', help: 'Frontmatter keys that hold the note title.' },
  { key: 'slug', label: 'Slug', help: 'Overrides the slug derived from the filename.' },
  { key: 'tags', label: 'Tags', help: 'Array of strings. First match wins.' },
  {
    key: 'draft',
    label: 'Draft',
    help:
      'Booleans. "published" is treated as the inverse (published:false → draft).',
  },
  {
    key: 'publishedAt',
    label: 'Published date',
    help: 'Used as the note\'s publish date. Falls back to file mtime if missing.',
  },
  {
    key: 'updatedAt',
    label: 'Updated date',
    help: 'Used as the note\'s last-modified timestamp.',
  },
  {
    key: 'parent',
    label: 'Parent',
    help: 'Explicit parent override (rare — folder structure handles this by default).',
  },
];

export function NotesImportPage() {
  const { status } = useSession();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>(DEFAULT_FIELD_MAPPING);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') navigate('/login');
  }, [status, navigate]);

  const ingest = async (files: DroppedFile[], m: FieldMapping = mapping) => {
    setDroppedFiles(files);
    const parsed: ParsedNote[] = [];
    for (const f of files) {
      const note = await parseDroppedFile(f, m);
      if (note) parsed.push(note);
    }
    // Fill in any missing folder index notes so the parent chain mirrors the
    // source folder structure exactly, even when sparse.
    const augmented = synthesizeMissingIndexes(parsed);
    // Sort so index.md files (folder roots) come before their siblings; this
    // doesn't matter for correctness (we resolve parents at create time) but
    // makes the preview list read top-down.
    augmented.sort((a, b) => {
      if (a.folderSegments.length !== b.folderSegments.length) {
        return a.folderSegments.length - b.folderSegments.length;
      }
      if (a.isIndex !== b.isIndex) return a.isIndex ? -1 : 1;
      return a.path.localeCompare(b.path);
    });
    setRows(augmented.map((p) => ({ ...p, status: 'pending' as const })));
  };

  // Whenever the mapping changes, re-parse the previously-dropped files so the
  // preview updates live. No-op if nothing has been dropped yet.
  const reparse = async (m: FieldMapping) => {
    if (droppedFiles.length === 0) return;
    await ingest(droppedFiles, m);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = await readDroppedItems(e.dataTransfer.items);
    await ingest(files);
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = filesFromInput(e.target.files);
    await ingest(files);
  };

  const onImport = async () => {
    setImporting(true);
    // Path → AT-URI map, populated as we create each note. Lookups against
    // this map are how we wire `parent` for children.
    const pathToUri = new Map<string, string>();
    const allPaths = new Set(rows.map((r) => r.path));

    // We need to create parents before children. Repeatedly walk the pending
    // list and create any rows whose parent is already resolved (or whose
    // parent is outside the dropped set).
    const working: ImportRow[] = rows.map((r) => ({ ...r }));
    setRows(working);

    let madeProgress = true;
    while (madeProgress) {
      madeProgress = false;
      for (let i = 0; i < working.length; i++) {
        const r = working[i];
        if (r.status !== 'pending') continue;

        const parentPath = parentPathFor(r, allPaths);
        if (parentPath && !pathToUri.has(parentPath)) {
          continue; // parent not yet created — try again later
        }
        const parentUri = parentPath ? pathToUri.get(parentPath) : undefined;

        // mark as creating, persist, mark done/error
        working[i] = { ...r, status: 'creating' };
        setRows([...working]);

        try {
          const entry = await createNote({
            ...r.input,
            parent: parentUri,
          });
          pathToUri.set(r.path, entry.uri);
          working[i] = { ...r, status: 'done', uri: entry.uri };
        } catch (err) {
          working[i] = { ...r, status: 'error', error: (err as Error).message };
        }
        setRows([...working]);
        madeProgress = true;
      }
    }

    // Anything still pending has a parent we couldn't resolve. Create it
    // anyway with no parent so we don't lose the content; user can fix later.
    for (let i = 0; i < working.length; i++) {
      const r = working[i];
      if (r.status !== 'pending') continue;
      working[i] = { ...r, status: 'creating' };
      setRows([...working]);
      try {
        const entry = await createNote(r.input);
        pathToUri.set(r.path, entry.uri);
        working[i] = { ...r, status: 'done', uri: entry.uri };
      } catch (err) {
        working[i] = { ...r, status: 'error', error: (err as Error).message };
      }
      setRows([...working]);
    }

    setImporting(false);
  };

  const counts = rows.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
    {} as Record<ImportStatus, number>
  );

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={4}>
        <Heading as="h1" size="xl">
          Import notes
        </Heading>
        <Button variant="ghost" asChild>
          <RouterLink to="/notes">Back to notes</RouterLink>
        </Button>
      </Flex>

      <Text color="fg.muted" mb={6} maxW="60ch">
        Drop a folder of markdown files — anything ending in <code>.md</code>,{' '}
        <code>.mdx</code>, or <code>.markdown</code>. Frontmatter is parsed for
        title, tags, draft state, and dates. Folder structure becomes the parent
        hierarchy: a folder's <code>index.md</code> becomes the parent of every
        other file in that folder. Missing folder indexes are synthesized so
        deeply nested notes keep their full ancestor chain. Use the field
        mapping below if your frontmatter uses different key names.
      </Text>

      <FieldMappingPanel mapping={mapping} setMapping={setMapping} onApply={reparse} />

      <Box
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={dragOver ? 'accent.default' : 'border.subtle'}
        bg={dragOver ? 'accent.muted' : 'bg.subtle'}
        borderRadius="lg"
        p={10}
        textAlign="center"
        transition="all 0.15s"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        mb={6}
      >
        <Text fontWeight="600" mb={2}>
          Drag a folder here
        </Text>
        <Text fontSize="sm" color="fg.muted" mb={4}>
          or
        </Text>
        <Button
          variant="outline"
          colorPalette="teal"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose a folder
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          // @ts-expect-error — webkitdirectory is non-standard but supported
          // by Chromium, WebKit, and Firefox via the same attribute name.
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
          onChange={onPick}
        />
      </Box>

      {rows.length > 0 && (
        <>
          <Flex align="center" justify="space-between" mb={3}>
            <HStack gap={4}>
              <Text fontSize="sm" color="fg.muted">
                {rows.length} markdown file{rows.length === 1 ? '' : 's'} ready
              </Text>
              {counts.done ? (
                <Text fontSize="sm" color="fg.success">
                  {counts.done} created
                </Text>
              ) : null}
              {counts.error ? (
                <Text fontSize="sm" color="fg.error">
                  {counts.error} failed
                </Text>
              ) : null}
            </HStack>
            <HStack gap={2}>
              <Button
                variant="ghost"
                onClick={() => setRows([])}
                disabled={importing}
              >
                Clear
              </Button>
              <Button
                colorPalette="teal"
                onClick={onImport}
                disabled={importing || rows.every((r) => r.status === 'done')}
                loading={importing}
              >
                {rows.some((r) => r.status === 'done') ? 'Continue import' : 'Import all'}
              </Button>
            </HStack>
          </Flex>

          <Stack gap={1}>
            {rows.map((r) => (
              <ImportRowView
                key={r.path}
                row={r}
                parentSlug={resolvedParent(r, rows)}
              />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}

/**
 * Look up the slug of the parent row in the import set. Used to show the
 * resolved hierarchy in the preview so users can verify it before importing.
 */
function resolvedParent(
  row: ImportRow,
  rows: ImportRow[]
): string | null {
  const allPaths = new Set(rows.map((r) => r.path));
  const parentPath = parentPathFor(row, allPaths);
  if (!parentPath) return null;
  const parent = rows.find((r) => r.path === parentPath);
  return parent ? parent.input.slug : null;
}

function ImportRowView({
  row,
  parentSlug,
}: {
  row: ImportRow;
  parentSlug: string | null;
}) {
  return (
    <Flex
      align="center"
      gap={3}
      px={3}
      py={2}
      bg={row.synthetic ? 'bg.muted' : 'bg.subtle'}
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="sm"
      fontSize="sm"
      opacity={row.synthetic ? 0.75 : 1}
    >
      <StatusIcon status={row.status} />
      <Box flex="1" minW={0}>
        <HStack gap={2} align="baseline">
          <Text truncate fontWeight={row.isIndex ? 600 : 400}>
            {row.input.title}
          </Text>
          {row.synthetic && (
            <Text
              fontSize="xs"
              color="fg.muted"
              bg="bg.subtle"
              px={1.5}
              borderRadius="sm"
              fontStyle="italic"
            >
              synthesized
            </Text>
          )}
          {row.input.draft && (
            <Text as="span" color="fg.muted" fontSize="xs">
              [draft]
            </Text>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.muted" truncate>
          {row.path} → /{row.input.slug}
          {parentSlug && (
            <Text as="span" color="fg.muted" ml={2}>
              ⤷ parent: /{parentSlug}
            </Text>
          )}
        </Text>
        {row.error && (
          <Text fontSize="xs" color="fg.error">
            {row.error}
          </Text>
        )}
      </Box>
      {row.input.tags && row.input.tags.length > 0 && (
        <HStack gap={1}>
          {row.input.tags.slice(0, 3).map((t) => (
            <Text key={t} fontSize="xs" color="fg.muted">
              #{t}
            </Text>
          ))}
        </HStack>
      )}
    </Flex>
  );
}

function StatusIcon({ status }: { status: ImportStatus }) {
  if (status === 'creating') return <Spinner size="xs" />;
  if (status === 'done')
    return (
      <Text as="span" color="fg.success" fontWeight={600}>
        ✓
      </Text>
    );
  if (status === 'error')
    return (
      <Text as="span" color="fg.error" fontWeight={600}>
        ✕
      </Text>
    );
  return (
    <Text as="span" color="fg.muted">
      ◦
    </Text>
  );
}

interface FieldMappingPanelProps {
  mapping: FieldMapping;
  setMapping: (m: FieldMapping) => void;
  /** Called after a mapping change so the import preview re-parses live. */
  onApply: (m: FieldMapping) => Promise<void> | void;
}

/**
 * Collapsible per-field alias editor. Each field shows a comma-separated list
 * of frontmatter keys to try; edits propagate immediately on blur so the
 * preview below reflects the new mapping.
 */
function FieldMappingPanel({ mapping, setMapping, onApply }: FieldMappingPanelProps) {
  // Local string buffers so users can edit freely without each keystroke
  // re-parsing the whole drop. Committed to `mapping` on blur or Enter.
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(mapping).map(([k, v]) => [k, (v as string[]).join(', ')])
    )
  );
  const isCustom = useMemo(
    () =>
      MAPPING_FIELDS.some(
        (f) =>
          mapping[f.key].join('|') !== DEFAULT_FIELD_MAPPING[f.key].join('|')
      ),
    [mapping]
  );

  const commitField = (key: keyof FieldMapping, raw: string) => {
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const next: FieldMapping = {
      ...mapping,
      [key]: parsed.length > 0 ? parsed : DEFAULT_FIELD_MAPPING[key],
    };
    setMapping(next);
    void onApply(next);
  };

  const resetAll = () => {
    setMapping(DEFAULT_FIELD_MAPPING);
    setDrafts(
      Object.fromEntries(
        Object.entries(DEFAULT_FIELD_MAPPING).map(([k, v]) => [
          k,
          (v as string[]).join(', '),
        ])
      )
    );
    void onApply(DEFAULT_FIELD_MAPPING);
  };

  return (
    <Collapsible.Root>
      <Box
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="md"
        bg="bg.subtle"
        mb={4}
      >
        <Collapsible.Trigger asChild>
          <Box as="button" type="button" w="100%" textAlign="left" px={4} py={3}>
            <Flex align="center" justify="space-between">
              <HStack gap={2}>
                <Text fontSize="sm" fontWeight={600}>
                  Frontmatter field mapping
                </Text>
                {isCustom && (
                  <Text
                    fontSize="xs"
                    bg="accent.muted"
                    color="accent.default"
                    px={2}
                    py={0.5}
                    borderRadius="sm"
                  >
                    Custom
                  </Text>
                )}
              </HStack>
              <Text fontSize="xs" color="fg.muted">
                Click to expand
              </Text>
            </Flex>
          </Box>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Box px={4} pb={4}>
            <Text fontSize="xs" color="fg.muted" mb={3}>
              For each note field, list the frontmatter keys to try (comma-separated, in
              order). First non-empty value wins. Names are case-insensitive.
            </Text>
            <Stack gap={3}>
              {MAPPING_FIELDS.map((f) => (
                <Box key={f.key}>
                  <Flex align="baseline" justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight={500}>
                      {f.label}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {f.help}
                    </Text>
                  </Flex>
                  <Input
                    size="sm"
                    value={drafts[f.key] ?? ''}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [f.key]: e.target.value }))
                    }
                    onBlur={(e) => commitField(f.key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    placeholder={DEFAULT_FIELD_MAPPING[f.key].join(', ')}
                    fontFamily="mono"
                  />
                </Box>
              ))}
            </Stack>
            <Flex justify="flex-end" mt={3}>
              <Button size="xs" variant="ghost" onClick={resetAll}>
                Reset to defaults
              </Button>
            </Flex>
          </Box>
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  );
}
