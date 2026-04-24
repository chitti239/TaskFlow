import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { GamificationProvider } from './context/GamificationContext';
import AppLayout from './components/AppLayout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TodayPage from './pages/TodayPage';
import AllTasksPage from './pages/AllTasksPage';
import SubjectsPage from './pages/SubjectsPage';
import CompletedPage from './pages/CompletedPage';
import PomodoroPage from './pages/PomodoroPage';
import TemplatePage from './pages/TemplatePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import TaskDetailPage from './pages/TaskDetailPage';
import BrainBreakPage from './pages/BrainBreakPage';
import AchievementsPage from './pages/AchievementsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import GamificationPage from './pages/GamificationPage';
import FlashcardsPage from './pages/FlashcardsPage';
import CalendarSyncPage from './pages/CalendarSyncPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"  element={<PublicRoute><AuthPage mode="login"  /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="today"         element={<TodayPage />} />
        <Route path="all-tasks"     element={<AllTasksPage />} />
        <Route path="subjects"      element={<SubjectsPage />} />
        <Route path="completed"     element={<CompletedPage />} />
        <Route path="analytics"     element={<AnalyticsPage />} />
        <Route path="achievements"  element={<AchievementsPage />} />
        <Route path="gamification"  element={<GamificationPage />} />
        <Route path="flashcards"    element={<FlashcardsPage />} />
        <Route path="calendar-sync" element={<CalendarSyncPage />} />
        <Route path="pomodoro"      element={<PomodoroPage />} />
        <Route path="templates"     element={<TemplatePage />} />
        <Route path="brain-break"   element={<BrainBreakPage />} />
        <Route path="profile"       element={<ProfilePage />} />
        <Route path="settings"      element={<SettingsPage />} />
        <Route path="tasks/:id"     element={<TaskDetailPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GamificationProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </BrowserRouter>
        </GamificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
