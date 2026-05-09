import { Box, Heading, Text } from '@chakra-ui/react';

/**
 * Notes route — placeholder for the Zettelkasten editor.
 * The full editor (markdown + [[wikilinks]] + backlinks panel) is a future work item.
 */
export function NotesPage() {
  return (
    <Box>
      <Heading as="h1" size="xl" mb={4}>
        Notes
      </Heading>
      <Text color="fg.muted">
        Zettelkasten editor coming soon. Your{' '}
        <Text as="code" fontFamily="mono" fontSize="sm">
          social.crate.note
        </Text>{' '}
        records will live here.
      </Text>
    </Box>
  );
}
