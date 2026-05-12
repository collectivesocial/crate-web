import { Avatar, Box, Button, Container, Flex, HStack, Spinner, Text } from '@chakra-ui/react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from './lib/session';

export function App() {
  const { status, user, logout } = useSession();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Bluesky-style fallback label for the avatar when no image is set.
  const handleOrDid = user?.handle ?? user?.did ?? '';
  const avatarLabel = (user?.displayName || user?.handle || handleOrDid).replace(/^@/, '');

  return (
    <Flex direction="column" minH="100vh">
      <Box as="header" bg="bg.nav" borderBottom="1px solid" borderColor="border.subtle" py={3} px={6}>
        <Container maxW="container.workspace">
          <Flex align="center" justify="space-between">
            <Text fontWeight="700" fontSize="lg" color="accent.default">
              <RouterLink to="/">crate.social</RouterLink>
            </Text>

            <HStack gap={4}>
              {status === 'loading' && <Spinner size="sm" />}

              {status === 'authenticated' && user && (
                <>
                  <RouterLink to="/notes">
                    <Text fontSize="sm" color="fg.muted" _hover={{ color: 'accent.default' }}>
                      Notes
                    </Text>
                  </RouterLink>
                  <HStack gap={2}>
                    <Avatar.Root size="xs" colorPalette="teal">
                      {user.avatar && <Avatar.Image src={user.avatar} alt={avatarLabel} />}
                      <Avatar.Fallback name={avatarLabel} />
                    </Avatar.Root>
                    <Text fontSize="sm" color="fg.muted">
                      @{user.handle ?? user.did}
                    </Text>
                  </HStack>
                  <Button size="sm" variant="outline" onClick={onLogout}>
                    Log out
                  </Button>
                </>
              )}

              {status === 'unauthenticated' && (
                <Button size="sm" colorPalette="teal" asChild>
                  <RouterLink to="/login">Sign in</RouterLink>
                </Button>
              )}
            </HStack>
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
            crate.social — Package your ATProto records for your PDS
          </Text>
        </Container>
      </Box>
    </Flex>
  );
}
