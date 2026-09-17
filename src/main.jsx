import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import './index.css';
import AppShell from './components/AppShell';
import Browse from './pages/Browse';
import Home from './pages/Home';
import NotFound, { RouteError } from './pages/NotFound';
import Person from './pages/Person';
import Search from './pages/Search';
import Title from './pages/Title';
import Universe from './pages/Universe';
import Universes from './pages/Universes';
import Vault from './pages/Vault';

const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'search', element: <Search /> },
      { path: 'movie/:id', element: <Title type="movie" /> },
      { path: 'tv/:id', element: <Title type="tv" /> },
      { path: 'person/:id', element: <Person /> },
      { path: 'company/:id', element: <Browse kind="company" /> },
      { path: 'network/:id', element: <Browse kind="network" /> },
      { path: 'keyword/:id', element: <Browse kind="keyword" /> },
      { path: 'vault', element: <Vault /> },
      { path: 'watchlist', element: <Navigate to="/vault" replace /> },
      { path: 'universes', element: <Universes /> },
      { path: 'universe/:slug', element: <Universe /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
