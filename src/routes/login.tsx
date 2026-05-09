import { Box, Button, Heading, Text } from '@chakra-ui/react';

/**
 * Login page — clicking "Sign in" redirects to the API OAuth start endpoint.
 * The OAuth callback is handled entirely in api/, not here.
 */
export function LoginPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? '';

  return (
    <Box maxW="sm" mx="auto" mt={16} textAlign="center">
      <Heading as="h1" size="xl" mb={4}>
        Sign in to crate.social
      </Heading>
      <Text color="fg.muted" mb={8}>
        Use your ATProto handle to log in.
      </Text>
      <Button
        colorPalette="teal"
        size="lg"
        asChild
      >
        <a href={`${apiUrl}/oauth/login`}>Sign in with your handle</a>
      </Button>
    </Box>
  );
}
