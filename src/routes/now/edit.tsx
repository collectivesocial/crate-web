import {
  Box,
  Button,
  Card,
  Flex,
  HStack,
  Heading,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { createNow, getCurrentNow, type NowInput, type NowSection } from '../../lib/now';
import { useSession } from '../../lib/session';

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  marginBottom: '0.25rem',
  display: 'block',
};

export function NowEditorPage() {
  const { status } = useSession();
  const navigate = useNavigate();

  const [summary, setSummary] = useState('');
  const [location, setLocation] = useState('');
  const [body, setBody] = useState('');
  const [sections, setSections] = useState<NowSection[]>([
    { title: 'Professional', body: '' },
    { title: 'Personal', body: '' },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the current entry so updates feel like edits (even though
  // the underlying record is append-only).
  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
      return;
    }
    if (status !== 'authenticated') return;
    let cancelled = false;
    getCurrentNow()
      .then((data) => {
        if (cancelled) return;
        const v = data.entry?.value;
        if (v) {
          setSummary(v.summary ?? '');
          setLocation(v.location ?? '');
          setBody(v.body ?? '');
          if (v.sections && v.sections.length > 0) setSections(v.sections);
        }
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
  }, [status, navigate]);

  const updateSection = (i: number, patch: Partial<NowSection>) => {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const removeSection = (i: number) =>
    setSections((prev) => prev.filter((_, idx) => idx !== i));
  const addSection = () =>
    setSections((prev) => [...prev, { title: '', body: '' }]);
  const moveSection = (i: number, dir: -1 | 1) =>
    setSections((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const onSave = async () => {
    setError(null);
    const cleanedSections = sections
      .map((s) => ({ title: s.title.trim(), body: s.body }))
      .filter((s) => s.title.length > 0 && s.body.trim().length > 0);

    const input: NowInput = {
      body: body.trim() || undefined,
      sections: cleanedSections.length > 0 ? cleanedSections : undefined,
      location: location.trim() || undefined,
      summary: summary.trim() || undefined,
    };

    if (!input.body && !input.sections) {
      setError('Add a body, or at least one section with content.');
      return;
    }

    setSaving(true);
    try {
      await createNow(input);
      navigate('/now');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
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
          Update now
        </Heading>
        <HStack gap={2}>
          <Button variant="ghost" onClick={() => navigate('/now')} disabled={saving}>
            Cancel
          </Button>
          <Button colorPalette="teal" onClick={onSave} disabled={saving} loading={saving}>
            Publish update
          </Button>
        </HStack>
      </Flex>

      <Text fontSize="sm" color="fg.muted" mb={6}>
        Each publish creates a new <code>social.crate.now</code> record. The
        latest one is shown as your current now page; older entries become a
        timeline of where your focus has been.
      </Text>

      {error && (
        <Box bg="accent.muted" borderWidth="1px" borderColor="border.subtle" p={3} borderRadius="md" mb={4}>
          <Text color="fg.error">{error}</Text>
        </Box>
      )}

      <Stack gap={4}>
        <Flex gap={3} wrap="wrap">
          <Box flex="1" minW="240px">
            <label htmlFor="now-summary" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">
                One-line summary (optional)
              </Text>
            </label>
            <Input
              id="now-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Deep in the garden buildout, shipping Crate."
            />
          </Box>
          <Box flex="1" minW="200px">
            <label htmlFor="now-location" style={labelStyle}>
              <Text as="span" fontSize="sm" color="fg.muted">
                Location (optional)
              </Text>
            </label>
            <Input
              id="now-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Vancouver, WA"
            />
          </Box>
        </Flex>

        <Box>
          <label htmlFor="now-body" style={labelStyle}>
            <Text as="span" fontSize="sm" color="fg.muted">
              Intro / headline (optional — shown above any sections)
            </Text>
          </label>
          <MarkdownEditor
            id="now-body"
            value={body}
            onChange={setBody}
            placeholder="Anything you want to lead with…"
            rows={6}
          />
        </Box>

        <Box>
          <Flex align="center" justify="space-between" mb={2}>
            <Text fontSize="sm" color="fg.muted">
              Sections
            </Text>
            <Button size="xs" variant="outline" onClick={addSection}>
              + Add section
            </Button>
          </Flex>
          <Stack gap={3}>
            {sections.map((s, i) => (
              <Card.Root key={i} variant="outline">
                <Card.Body>
                  <Flex align="center" gap={2} mb={2}>
                    <Input
                      flex="1"
                      value={s.title}
                      onChange={(e) => updateSection(i, { title: e.target.value })}
                      placeholder="Section title"
                      size="sm"
                    />
                    <IconButton
                      aria-label="Move up"
                      size="xs"
                      variant="ghost"
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      aria-label="Move down"
                      size="xs"
                      variant="ghost"
                      onClick={() => moveSection(i, 1)}
                      disabled={i === sections.length - 1}
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      aria-label="Remove section"
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => removeSection(i)}
                    >
                      ✕
                    </IconButton>
                  </Flex>
                  <MarkdownEditor
                    value={s.body}
                    onChange={(v) => updateSection(i, { body: v })}
                    placeholder="What's going on in this part of life…"
                    rows={6}
                  />
                </Card.Body>
              </Card.Root>
            ))}
            {sections.length === 0 && (
              <Text fontSize="sm" color="fg.muted">
                No sections yet. Use the intro alone, or add named sections like
                "Professional" and "Personal".
              </Text>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
