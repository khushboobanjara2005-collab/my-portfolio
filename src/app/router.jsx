import { createBrowserRouter, Navigate } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import PublicLayout from '../components/layout/PublicLayout'
import HomePage from '../pages/public/HomePage'
import WorkPage from '../pages/public/WorkPage'
import WorkProjectPage from '../pages/public/WorkProjectPage'
import AdminHomePage from '../pages/admin/AdminHomePage'
import LoginPage from '../pages/admin/LoginPage'
import NewProjectPage from '../pages/admin/NewProjectPage'
import ProjectsPage from '../pages/admin/ProjectsPage'
import SettingsPage from '../pages/admin/SettingsPage'
import NotFoundPage from '../pages/NotFoundPage'
import RequireAdmin from '../features/auth/RequireAdmin'
import { AuthProvider } from '../features/auth/AuthProvider'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/work', element: <WorkPage /> },
      { path: '/work/:slug', element: <WorkProjectPage /> },
      { path: '/about', element: <Navigate to="/#about" replace /> },
      { path: '/contact', element: <Navigate to="/#contact" replace /> },
    ],
  },
  {
    path: '/admin/login',
    element: (
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    ),
  },
  {
    path: '/admin',
    element: (
      <AuthProvider>
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      </AuthProvider>
    ),
    children: [
      { index: true, element: <AdminHomePage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/new', element: <NewProjectPage /> },
      { path: 'projects/:projectId/edit', element: <NewProjectPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
], {
  basename: import.meta.env.BASE_URL,
})
