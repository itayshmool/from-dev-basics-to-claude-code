import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { fetchAndApplyTheme } from './utils/theme';
import { HomeScreen } from './components/home/HomeScreen';
import { LessonView } from './components/lesson/LessonView';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { AdminGuard } from './components/admin/AdminGuard';
import { AdminLoginScreen } from './components/admin/AdminLoginScreen';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminStudentList } from './components/admin/AdminStudentList';
import { AdminLevelList } from './components/admin/AdminLevelList';
import { AdminLessonList } from './components/admin/AdminLessonList';
import { AdminLessonEditor } from './components/admin/AdminLessonEditor';
import { AdminStudentDetail } from './components/admin/AdminStudentDetail';
import { AdminLessonPreview } from './components/admin/AdminLessonPreview';
import { AdminThemeEditor } from './components/admin/AdminThemeEditor';
import { AdminContentValidator } from './components/admin/AdminContentValidator';
import { AdminAnalytics } from './components/admin/AdminAnalytics';
import { DashboardGuard } from './components/dashboard/DashboardGuard';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { DashboardProfile } from './components/dashboard/DashboardProfile';
import { DashboardSettings } from './components/dashboard/DashboardSettings';
import { DashboardStats } from './components/dashboard/DashboardStats';
import { DashboardAchievements } from './components/dashboard/DashboardAchievements';
import { AchievementProvider } from './contexts/AchievementContext';

function App() {
  useEffect(() => {
    fetchAndApplyTheme();
  }, []);

  return (
    <AchievementProvider>
    <div className="h-full bg-bg-primary">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/lesson/:lessonId" element={<LessonView />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/dashboard" element={<DashboardGuard />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="stats" element={<DashboardStats />} />
            <Route path="achievements" element={<DashboardAchievements />} />
            <Route path="profile" element={<DashboardProfile />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>
        </Route>
        <Route path="/admin/login" element={<AdminLoginScreen />} />
        <Route path="/admin" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudentList />} />
            <Route path="students/:id" element={<AdminStudentDetail />} />
            <Route path="levels" element={<AdminLevelList />} />
            <Route path="lessons" element={<AdminLessonList />} />
            <Route path="lessons/:id" element={<AdminLessonEditor />} />
            <Route path="lessons/:id/preview" element={<AdminLessonPreview />} />
            <Route path="theme" element={<AdminThemeEditor />} />
            <Route path="validate" element={<AdminContentValidator />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>
      </Routes>
    </div>
    </AchievementProvider>
  );
}

export default App;
