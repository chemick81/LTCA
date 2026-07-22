import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { RequireAuth } from '@/routes/RequireAuth';
import { RequireAdmin } from '@/routes/RequireAdmin';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AcademyPage } from '@/features/academy/pages/AcademyPage';
import { CourseDetailPage } from '@/features/academy/pages/CourseDetailPage';
import { LessonPage } from '@/features/lesson/pages/LessonPage';
import { GlossaryPage } from '@/features/glossary/pages/GlossaryPage';
import { ProgressPage } from '@/features/progress/pages/ProgressPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { AdminCoursesPage } from '@/features/admin/pages/AdminCoursesPage';
import { AdminAnnouncementsPage } from '@/features/admin/pages/AdminAnnouncementsPage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/academy', element: <AcademyPage /> },
          { path: '/academy/course/:courseId', element: <CourseDetailPage /> },
          { path: '/academy/lesson/:lessonId', element: <LessonPage /> },
          { path: '/glossary', element: <GlossaryPage /> },
          { path: '/progress', element: <ProgressPage /> },
          { path: '/profile', element: <ProfilePage /> },
          {
            element: <RequireAdmin />,
            children: [
              {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                  { index: true, element: <AdminCoursesPage /> },
                  { path: 'announcements', element: <AdminAnnouncementsPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
