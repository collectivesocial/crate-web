import { Box, Heading, Text } from '@chakra-ui/react';

export function HomePage() {
  return (
    <Box>
      <Heading as="h1" size="2xl" mb={4}>
        Welcome to crate.social
      </Heading>
      <Text color="fg.muted" fontSize="lg">
        Package your ATProto records for your PDS. Dashboard coming soon.
      </Text>
    </Box>
  );
}
