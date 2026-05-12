import yaml from 'js-yaml';
import type { NoteInput } from './notes';

/**
 * Parses a folder of markdown notes (as dropped/picked in the browser) into a
 * tree of NoteInputs whose `parent` chain matches the directory structure.
 *
 * Slug rules:
 *   - `foo/bar.md`         → slug = "bar"
 *   - `foo/bar/index.md`   → slug = "bar"   (parent folder name; the file IS the folder)
 *   - root `index.md`      → slug = "index"
 *
 * Frontmatter (`---` YAML block at the top of the file) is honored. Field
 * names are configurable via FieldMapping — each field has an ordered list of
 * aliases tried in turn, so the importer adapts to whatever convention the
 * user's existing notes use.
 */

/**
 * Ordered alias list for each NoteInput field. The first alias whose value is
 * present in the frontmatter wins. Field names are case-insensitive.
 */
export interface FieldMapping {
  title: string[];
  slug: string[];
  tags: string[];
  draft: string[];
  publishedAt: string[];
  updatedAt: string[];
  parent: string[];
}

/**
 * Default aliases. Covers the most common conventions out of the box: Hugo,
 * Jekyll, Astro content collections, Obsidian, plain markdown.
 */
export const DEFAULT_FIELD_MAPPING: FieldMapping = {
  title: ['title'],
  slug: ['slug'],
  tags: ['tags', 'keywords', 'categories'],
  draft: ['draft', 'published', 'unpublished'],
  publishedAt: ['publishedAt', 'publishDate', 'publish_date', 'date', 'created', 'createdAt', 'created_at'],
  updatedAt: ['updatedAt', 'updateDate', 'update_date', 'lastmod', 'last_modified', 'updated', 'modified'],
  parent: ['parent', 'parentSlug', 'parent_slug'],
};

export interface ParsedNote {
  /** Path relative to the dropped root (for display in the import preview). */
  path: string;
  /** Path segments minus filename — used to compute parent. */
  folderSegments: string[];
  /** True for `index.md` / `index.mdx` files (the folder's own note). */
  isIndex: boolean;
  /**
   * True when this note doesn't correspond to a real file in the dropped
   * tree but was synthesized to fill a gap in the parent hierarchy (e.g. a
   * folder containing markdown but lacking its own `index.md`).
   */
  synthetic?: boolean;
  /** The note's slug (after frontmatter override). */
  slug: string;
  /** Optional explicit parent path declared in frontmatter (rare). */
  frontmatterParent?: string;
  /** Anything that goes into the note record (minus `parent` — that's resolved at import time). */
  input: Omit<NoteInput, 'parent'>;
}

export interface DroppedFile {
  /** Relative path including filename, with forward slashes. */
  path: string;
  file: File;
}

const MD_EXT = /\.(md|mdx|markdown)$/i;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function stripFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const match = text.match(FRONTMATTER_RE);
  if (!match) return { data: {}, body: text };
  let data: Record<string, unknown> = {};
  try {
    const parsed = yaml.load(match[1]);
    if (parsed && typeof parsed === 'object') data = parsed as Record<string, unknown>;
  } catch {
    // Malformed frontmatter — fall back to no metadata, keep the body intact.
  }
  return { data, body: text.slice(match[0].length) };
}

/**
 * Build a case-insensitive lookup table over the frontmatter object so an
 * alias `publishDate` matches a key `publishdate` or `PublishDate`.
 */
function lowercaseKeys(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) out[k.toLowerCase()] = v;
  return out;
}

/** Return the first defined frontmatter value across an alias list. */
function pick(
  ciData: Record<string, unknown>,
  aliases: readonly string[]
): unknown {
  for (const a of aliases) {
    const v = ciData[a.toLowerCase()];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function asString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.map(asString).filter((s): s is string => !!s && s.length > 0);
  return out.length > 0 ? out : undefined;
}

function toIsoDate(v: unknown, fallback: number | undefined): string {
  const s = asString(v);
  if (s) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (fallback) return new Date(fallback).toISOString();
  return new Date().toISOString();
}

/**
 * Convert a kebab-case-or-snake_case slug into a Title Case display title.
 * Used when frontmatter doesn't supply a title.
 */
function titleize(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function parseDroppedFile(
  df: DroppedFile,
  mapping: FieldMapping = DEFAULT_FIELD_MAPPING
): Promise<ParsedNote | null> {
  if (!MD_EXT.test(df.path)) return null;

  const text = await df.file.text();
  const { data, body } = stripFrontmatter(text);
  const ci = lowercaseKeys(data);

  const segments = df.path.split('/').filter(Boolean);
  const filename = segments[segments.length - 1] ?? df.path;
  const folderSegments = segments.slice(0, -1);
  const bareName = filename.replace(MD_EXT, '');
  const isIndex = bareName.toLowerCase() === 'index';

  // If index.md, the slug is the parent folder's name (the file represents the
  // folder itself). At the root, fall back to "index".
  const derivedSlug = isIndex
    ? folderSegments[folderSegments.length - 1] ?? 'index'
    : bareName;
  const slug = asString(pick(ci, mapping.slug)) ?? derivedSlug;
  const title = asString(pick(ci, mapping.title)) ?? titleize(slug);

  const mtime = df.file.lastModified || undefined;
  const publishedAt = toIsoDate(pick(ci, mapping.publishedAt), mtime);

  const updatedAtRaw = pick(ci, mapping.updatedAt);
  const updatedAt = updatedAtRaw ? toIsoDate(updatedAtRaw, mtime) : undefined;

  const tags = asStringArray(pick(ci, mapping.tags));

  // `draft` mapping is interesting: `published` and `unpublished` invert the
  // boolean. If the alias name itself implies negation we invert here so the
  // surface meaning stays consistent.
  let draft: true | undefined;
  for (const alias of mapping.draft) {
    const raw = ci[alias.toLowerCase()];
    if (raw === undefined) continue;
    const truthy = raw === true || raw === 'true' || raw === 1;
    if (alias.toLowerCase() === 'published') {
      draft = !truthy ? true : undefined;
    } else {
      draft = truthy ? true : undefined;
    }
    break;
  }

  const frontmatterParent = asString(pick(ci, mapping.parent));

  return {
    path: df.path,
    folderSegments,
    isIndex,
    slug,
    frontmatterParent,
    input: {
      title,
      slug,
      body: body.trim(),
      tags,
      draft,
      publishedAt,
      // updatedAt isn't a NoteInput field today; surface via the body via
      // the API's existing updatedAt-on-PUT path if needed later.
      ...(updatedAt ? { updatedAt } as Partial<NoteInput> : {}),
    },
  };
}

/**
 * For a note at `notes/foo/bar.md`, the parent is the index of folder `foo`
 * (i.e. `foo/index.md`). For `notes/foo/index.md`, the parent is the parent
 * folder's index (`notes/index.md` or null).
 *
 * Returns the path (within the dropped tree) of the parent's source file, or
 * null if no parent exists in the dropped set. Synthetic indexes (paths
 * ending in `/__synthesized__/index.md`) are recognized the same as real
 * `index.md` files — see synthesizeMissingIndexes below.
 */
export function parentPathFor(
  note: ParsedNote,
  pathsInSet: Set<string>
): string | null {
  // For non-index files, parent is the same folder's index.
  const targetFolders = note.isIndex
    ? note.folderSegments.slice(0, -1) // index.md → step up one folder
    : note.folderSegments;

  // Walk up the tree from the most specific folder looking for an index.
  for (let i = targetFolders.length; i >= 0; i--) {
    const folder = targetFolders.slice(0, i);
    const candidates = [
      [...folder, 'index.md'].join('/'),
      [...folder, 'index.mdx'].join('/'),
      [...folder, 'index.markdown'].join('/'),
      // Synthetic indexes produced by synthesizeMissingIndexes(). Suffix is
      // chosen so it can't collide with a real file on a real filesystem.
      [...folder, '__synthesized__', 'index.md'].join('/'),
    ];
    for (const c of candidates) {
      if (c === note.path) continue; // a note isn't its own parent
      if (pathsInSet.has(c)) return c;
    }
  }
  return null;
}

/**
 * Walk a DataTransferItemList (from a drop event) and return every file with
 * its path relative to the dropped root, preserving folder structure.
 *
 * Uses the legacy `webkitGetAsEntry` API which is supported in all major
 * browsers and is what `<input type="file" webkitdirectory>` lowers to.
 */
export async function readDroppedItems(items: DataTransferItemList): Promise<DroppedFile[]> {
  const out: DroppedFile[] = [];
  const tasks: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== 'file') continue;
    const entry = (item as DataTransferItem & {
      webkitGetAsEntry: () => FileSystemEntry | null;
    }).webkitGetAsEntry();
    if (entry) tasks.push(walkEntry(entry, '', out));
  }
  await Promise.all(tasks);
  return out;
}

// Minimal FS Entry types — the browser's lib.dom types are unstable here.
interface FSEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
}
interface FSFileEntry extends FSEntry {
  file(cb: (f: File) => void, errCb?: (e: unknown) => void): void;
}
interface FSDirReader {
  readEntries(cb: (entries: FSEntry[]) => void, errCb?: (e: unknown) => void): void;
}
interface FSDirEntry extends FSEntry {
  createReader(): FSDirReader;
}

async function walkEntry(entry: FileSystemEntry, prefix: string, out: DroppedFile[]) {
  const e = entry as unknown as FSEntry;
  const path = prefix ? `${prefix}/${e.name}` : e.name;
  if (e.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (e as FSFileEntry).file(resolve, reject)
    );
    out.push({ path, file });
  } else if (e.isDirectory) {
    const reader = (e as FSDirEntry).createReader();
    // readEntries returns batches; loop until empty.
    while (true) {
      const batch: FSEntry[] = await new Promise((resolve, reject) =>
        reader.readEntries(resolve, reject)
      );
      if (batch.length === 0) break;
      for (const child of batch) {
        await walkEntry(child as unknown as FileSystemEntry, path, out);
      }
    }
  }
}

/**
 * Files from `<input type="file" webkitdirectory>` arrive as a FileList where
 * each File has a non-standard `webkitRelativePath`. Convert to DroppedFile[].
 */
export function filesFromInput(fileList: FileList): DroppedFile[] {
  const out: DroppedFile[] = [];
  for (let i = 0; i < fileList.length; i++) {
    const f = fileList.item(i);
    if (!f) continue;
    const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    out.push({ path, file: f });
  }
  return out;
}

/**
 * Returns an augmented list of notes containing the original parsed notes plus
 * one synthetic index note per folder that contains markdown but lacks a real
 * `index.md` (or `.mdx` / `.markdown`).
 *
 * Why: we want the parent hierarchy to mirror the dropped folder structure
 * exactly. If `notes/foo/bar/baz.md` exists but `notes/foo/bar/` has no index,
 * `baz.md` would otherwise jump straight to `notes/foo/index.md` (or even root),
 * collapsing a level of hierarchy. Synthesizing a `bar` index keeps the chain
 * intact and surfaces the implied node in the UI.
 *
 * The synthetic note's path is `<folder>/__synthesized__/index.md` so it can't
 * collide with anything in the dropped set. `parentPathFor` recognizes this
 * suffix specifically.
 */
export function synthesizeMissingIndexes(notes: ParsedNote[]): ParsedNote[] {
  if (notes.length === 0) return notes;

  // Set of real paths in the drop, for the existing index-detection logic.
  const realPaths = new Set(notes.map((n) => n.path));

  // Collect every folder that contains at least one markdown file (directly
  // or via descendants). For each, determine if it already has an index.
  const foldersWithMarkdown = new Set<string>();
  for (const n of notes) {
    // Each ancestor folder (including the file's own folder) counts.
    for (let i = 0; i <= n.folderSegments.length; i++) {
      foldersWithMarkdown.add(n.folderSegments.slice(0, i).join('/'));
    }
  }

  // A folder is considered to already have an index iff any of these paths
  // exist in the dropped set:
  //   <folder>/index.md, <folder>/index.mdx, <folder>/index.markdown
  // Empty-string folder = root.
  const folderHasIndex = (folder: string) => {
    const candidates = folder
      ? [`${folder}/index.md`, `${folder}/index.mdx`, `${folder}/index.markdown`]
      : ['index.md', 'index.mdx', 'index.markdown'];
    return candidates.some((c) => realPaths.has(c));
  };

  const synthetic: ParsedNote[] = [];
  for (const folder of foldersWithMarkdown) {
    if (folderHasIndex(folder)) continue;
    // Skip the empty (root) folder. Most drops include a top-level wrapper
    // folder (e.g. dragging "notes/") so the root level is typically empty of
    // markdown — in that case we let those top-level notes be roots.
    if (folder === '') continue;

    const segments = folder.split('/').filter(Boolean);
    const slug = segments[segments.length - 1];
    if (!slug) continue;

    const path = `${folder}/__synthesized__/index.md`;
    const folderSegments = segments;
    const title = slug
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const now = new Date().toISOString();

    synthetic.push({
      path,
      folderSegments,
      isIndex: true,
      synthetic: true,
      slug,
      input: {
        title,
        slug,
        body: '',
        publishedAt: now,
      },
    });
  }

  return [...notes, ...synthetic];
}