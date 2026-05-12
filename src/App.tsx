import { Avatar, Box, Button, Container, Flex, HStack, Menu, Portal, Spinner, Text } from '@chakra-ui/react';
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
                <Menu.Root positioning={{ placement: 'bottom-end' }}>
                  <Menu.Trigger
                    rounded="full"
                    focusRing="outside"
                    cursor="pointer"
                    bg="transparent"
                    aria-label="Account menu"
                  >
                    <Avatar.Root size="sm" colorPalette="teal">
                      {user.avatar && <Avatar.Image src={user.avatar} alt={avatarLabel} />}
                      <Avatar.Fallback name={avatarLabel} />
                    </Avatar.Root>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Box px={3} py={2}>
                          <Text fontWeight="bold" fontSize="sm">
                            {user.displayName || user.handle}
                          </Text>
                          <Text color="fg.muted" fontSize="xs">
                            @{user.handle ?? user.did}
                          </Text>
                        </Box>
                        <Menu.Separator />
                        <Menu.Item value="notes" asChild>
                          <RouterLink to="/notes">Notes</RouterLink>
                        </Menu.Item>
                        <Menu.Item value="import-notes" asChild>
                          <RouterLink to="/notes/import">Import notes</RouterLink>
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.Item
                          value="logout"
                          onClick={onLogout}
                          color="fg.error"
                          _hover={{ bg: 'bg.error', color: 'fg.error' }}
                        >
                          Log out
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
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
