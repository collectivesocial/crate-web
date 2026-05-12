import { Box, Button, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useState, type FormEvent } from 'react';
import { API_BASE } from '../lib/api';

/**
 * Login page — accepts an ATProto handle, DID, or PDS URL and redirects
 * the browser to the API's `GET /oauth/login?handle=…` endpoint, which in
 * turn redirects to the user's PDS authorization page.
 *
 * The full OAuth callback (cookie set, redirect back to web app) is handled
 * entirely in api/, not here.
 */
export function LoginPage() {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = handle.trim();
    if (!trimmed) {
      setError('Please enter your handle');
      return;
    }
    setError(null);
    const url = `${API_BASE}/oauth/login?handle=${encodeURIComponent(trimmed)}`;
    window.location.assign(url);
  };

  return (
    <Box maxW="sm" mx="auto" mt={16}>
      <Heading as="h1" size="xl" mb={4} textAlign="center">
        Sign in to Crate
      </Heading>
      <Text color="fg.muted" mb={8} textAlign="center">
        Use your Atmosphere account to log in.
      </Text>

      <form onSubmit={onSubmit}>
        <Stack gap={4}>
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="alice.bsky.social"
            size="lg"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Your Atmosphere account"
          />
          {error && (
            <Text color="fg.error" fontSize="sm">
              {error}
            </Text>
          )}
          <Button type="submit" colorPalette="teal" size="lg">
            Sign in with your handle
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
