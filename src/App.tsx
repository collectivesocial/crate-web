import { Avatar, Box, Button, chakra, Container, Flex, HStack, Menu, Portal, Spinner, Text } from '@chakra-ui/react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from './lib/session';

// Chakra v3's Box loses SVG-specific attributes when used with `as="svg"`.
// `chakra('svg')` makes a properly typed SVG element that still accepts
// Chakra style props like `boxSize`.
const ChakraSvg = chakra('svg');

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
            <Box fontWeight="700" fontSize="lg" color="accent.default" lineHeight="1">
              <RouterLink to="/">
                <HStack gap={2}>
                  <ChakraSvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" boxSize="5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                    <line x1="3.27" y1="17.04" x2="12" y2="12" />
                    <line x1="20.73" y1="17.04" x2="12" y2="12" />
                    <path d="m7.5 4.27 9 5.15" />
                  </ChakraSvg>
                  <Text as="span">Crate</Text>
                </HStack>
              </RouterLink>
            </Box>

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
                        <Menu.Item value="documents" asChild>
                          <RouterLink to="/documents">Documents</RouterLink>
                        </Menu.Item>
                        <Menu.Item value="content" asChild>
                          <RouterLink to="/content">Content</RouterLink>
                        </Menu.Item>
                        <Menu.Item value="events" asChild>
                          <RouterLink to="/events">Events</RouterLink>
                        </Menu.Item>
                        <Menu.Item value="feeds" asChild>
                          <RouterLink to="/feeds">Feeds</RouterLink>
                        </Menu.Item>
                        <Menu.Item value="now" asChild>
                          <RouterLink to="/now">Now</RouterLink>
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.Root positioning={{ placement: 'left-start', gutter: 4 }}>
                          <Menu.TriggerItem>Settings</Menu.TriggerItem>
                          <Portal>
                            <Menu.Positioner>
                              <Menu.Content>
                                <Menu.Item value="import-notes" asChild>
                                  <RouterLink to="/notes/import">Import notes</RouterLink>
                                </Menu.Item>
                              </Menu.Content>
                            </Menu.Positioner>
                          </Portal>
                        </Menu.Root>
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
            Crate — Package your ATProto records for your PDS
          </Text>
        </Container>
      </Box>
    </Flex>
  );
}
