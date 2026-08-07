import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { ToolPage } from '@/pages/ToolPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorBoundaryPage } from '@/pages/ErrorBoundaryPage';

/**
 * The route table is fixed and tiny on purpose: `/tools/:toolId` covers every
 * tool that exists or ever will. Adding a tool adds a URL without touching this
 * file — the registry resolves the slug.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tools', element: <CatalogPage /> },
      { path: 'tools/:toolId', element: <ToolPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
