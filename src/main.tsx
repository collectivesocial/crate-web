import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { ColorModeProvider } from './components/ColorModeProvider';
import { system } from './theme';
import { App } from './App';
import { HomePage } from './routes/index';
import { LoginPage } from './routes/login';
import { NotesPage } from './routes/notes/index';
import { NoteEditorPage } from './routes/notes/$rkey';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'notes', element: <NotesPage /> },
        { path: 'notes/:rkey', element: <NoteEditorPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <RouterProvider router={router} />
      </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>
);
