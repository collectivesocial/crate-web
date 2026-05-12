import { Box, Heading, HStack, Tabs, Text, Textarea } from '@chakra-ui/react';
import { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders a string of markdown using Chakra primitives. Reusable for any
 * read-only markdown surface (note bodies, content descriptions, now pages,
 * etc.). Supports GitHub-flavored extensions (tables, task lists, strikethrough).
 */
export function MarkdownView({ children }: { children: string }) {
  return (
    <Box className="markdown-view" css={markdownStyles}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {children}
      </ReactMarkdown>
    </Box>
  );
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <Heading as="h1" size="2xl" mt={6} mb={3}>
      {children}
    </Heading>
  ),
  h2: ({ children }) => (
    <Heading as="h2" size="xl" mt={6} mb={2}>
      {children}
    </Heading>
  ),
  h3: ({ children }) => (
    <Heading as="h3" size="lg" mt={5} mb={2}>
      {children}
    </Heading>
  ),
  h4: ({ children }) => (
    <Heading as="h4" size="md" mt={4} mb={1}>
      {children}
    </Heading>
  ),
  p: ({ children }) => (
    <Text mb={3} lineHeight="1.7">
      {children}
    </Text>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      style={{ color: 'var(--chakra-colors-accent-default)', textDecoration: 'underline' }}
    >
      {children}
    </a>
  ),
};

// Styles applied to descendants of .markdown-view that aren't handled by the
// Chakra component overrides above (lists, code, blockquote, hr, etc.).
const markdownStyles = {
  '& ul, & ol': { paddingLeft: '1.5rem', marginBottom: '0.75rem' },
  '& ul': { listStyle: 'disc' },
  '& ol': { listStyle: 'decimal' },
  '& li': { marginBottom: '0.25rem', lineHeight: 1.7 },
  '& li > p': { marginBottom: '0.25rem' },
  '& code': {
    fontFamily: 'mono',
    fontSize: '0.875em',
    background: 'bg.muted',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
  },
  '& pre': {
    background: 'bg.muted',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    overflowX: 'auto',
    marginBottom: '0.75rem',
  },
  '& pre code': {
    background: 'transparent',
    padding: 0,
  },
  '& blockquote': {
    borderLeft: '3px solid',
    borderColor: 'border.subtle',
    paddingLeft: '1rem',
    color: 'fg.muted',
    margin: '0.75rem 0',
  },
  '& hr': {
    border: 'none',
    borderTop: '1px solid',
    borderColor: 'border.subtle',
    margin: '1.5rem 0',
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: '0.75rem',
    fontSize: '0.9em',
  },
  '& th, & td': {
    border: '1px solid',
    borderColor: 'border.subtle',
    padding: '0.5rem 0.75rem',
    textAlign: 'left',
  },
  '& th': { background: 'bg.subtle', fontWeight: 600 },
  '& img': { maxWidth: '100%', borderRadius: '4px' },
  '& input[type="checkbox"]': { marginRight: '0.5rem' },
};

export interface MarkdownEditorProps {
  /** Markdown source. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  /** Element id used for the underlying textarea (for label `htmlFor`). */
  id?: string;
  /** When true, hides the tab strip and just renders the raw editor. */
  hideTabs?: boolean;
}

/**
 * Reusable markdown editor with an Edit / Preview / Split toggle.
 *
 * Tabs:
 *   - Edit    — plain textarea (markdown source)
 *   - Preview — rendered output only
 *   - Split   — side-by-side editor + preview (collapses to stacked on narrow viewports)
 *
 * Designed to be drop-in compatible with whatever wraps a <Textarea> today: it
 * controls only its own internal markup; the label and surrounding form stay
 * with the caller.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 20,
  id,
  hideTabs = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit');

  const editor = (
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      fontFamily="mono"
      fontSize="sm"
      resize="vertical"
    />
  );

  const preview = (
    <Box
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="md"
      px={4}
      py={3}
      minH={`${Math.max(rows * 1.5, 6)}rem`}
      overflowY="auto"
    >
      {value.trim() ? (
        <MarkdownView>{value}</MarkdownView>
      ) : (
        <Text color="fg.muted" fontStyle="italic">
          Nothing to preview yet.
        </Text>
      )}
    </Box>
  );

  if (hideTabs) return editor;

  return (
    <Box>
      <Tabs.Root
        value={mode}
        onValueChange={(d) => setMode(d.value as typeof mode)}
        size="sm"
        mb={2}
      >
        <Tabs.List>
          <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
          <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
          <Tabs.Trigger value="split">Split</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      {mode === 'edit' && editor}
      {mode === 'preview' && preview}
      {mode === 'split' && (
        <HStack align="stretch" gap={3}>
          <Box flex="1" minW={0}>
            {editor}
          </Box>
          <Box flex="1" minW={0}>
            {preview}
          </Box>
        </HStack>
      )}
    </Box>
  );
}
