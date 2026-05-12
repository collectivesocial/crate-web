import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

// IBM Plex font subsets — self-hosted so we have no third-party request, no
// FOUT after the first load, and the workshop typography is always available.
// Sans: 400 (body), 500 (label/medium emphasis), 600 (headings/titles).
// Mono: 400 (editor body, slugs, timestamps, raw record data).
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';

import { ColorModeProvider } from './components/ColorModeProvider';
import { system } from './theme';
import { App } from './App';
import { HomePage } from './routes/index';
import { LoginPage } from './routes/login';
import { NotesPage } from './routes/notes/index';
import { NoteEditorPage } from './routes/notes/$rkey';
import { NotesImportPage } from './routes/notes/import';
import { DocumentsPage } from './routes/documents/index';
import { DocumentEditorPage } from './routes/documents/$rkey';
import { ContentPage } from './routes/content/index';
import { ContentEditorPage } from './routes/content/$rkey';
import { NowPage } from './routes/now/index';
import { NowEditorPage } from './routes/now/edit';
import { NowSettingsPage } from './routes/now/settings';
import { EventsPage } from './routes/events/index';
import { EventEditorPage } from './routes/events/$rkey';
import { FeedsPage } from './routes/feeds/index';
import { FeedEditorPage } from './routes/feeds/$rkey';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'notes', element: <NotesPage /> },
        { path: 'notes/import', element: <NotesImportPage /> },
        { path: 'notes/:rkey', element: <NoteEditorPage /> },
        { path: 'documents', element: <DocumentsPage /> },
        { path: 'documents/:rkey', element: <DocumentEditorPage /> },
        { path: 'content', element: <ContentPage /> },
        { path: 'content/:rkey', element: <ContentEditorPage /> },
        { path: 'now', element: <NowPage /> },
        { path: 'now/edit', element: <NowEditorPage /> },
        { path: 'now/settings', element: <NowSettingsPage /> },
        { path: 'events', element: <EventsPage /> },
        { path: 'events/:rkey', element: <EventEditorPage /> },
        { path: 'feeds', element: <FeedsPage /> },
        { path: 'feeds/:rkey', element: <FeedEditorPage /> },
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
