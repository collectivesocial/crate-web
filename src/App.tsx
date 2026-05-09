import { Box, Container, Flex, Text } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';

export function App() {
  return (
    <Flex direction="column" minH="100vh">
      <Box as="header" bg="bg.nav" borderBottom="1px solid" borderColor="border.subtle" py={3} px={6}>
        <Container maxW="container.workspace">
          <Flex align="center" justify="space-between">
            <Text fontWeight="700" fontSize="lg" color="accent.default">
              crate.social
            </Text>
          </Flex>
        </Container>
      </Box>

      <Box as="main" flex="1" py={8}>
        <Container maxW="container.workspace">
          <Outlet />
        </Container>
      </Box>

      <Box as="footer" bg="bg.subtle" borderTop="1px solid" borderColor="border.subtle" py={4} px={6}>
        <Container maxW="container.workspace">
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            crate.social — your content, your records
          </Text>
        </Container>
      </Box>
    </Flex>
  );
}
