import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TaskDetailPage from './pages/TaskDetailPage';

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
      <Route path="/login"       element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
      <Route path="/signup"      element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />
      <Route path="/dashboard"   element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/tasks/:id"   element={<PrivateRoute><TaskDetailPage /></PrivateRoute>} />
      <Route path="*"            element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
