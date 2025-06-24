import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { useAppContext } from './hooks/useAppContext';
import { useAuth } from './hooks/useAuth';

// Components
import { Sidebar } from './components/Sidebar';
import { LoadingCard } from './components/LoadingSpinner';
import { ErrorCard } from './components/ErrorMessage';
import { WorkspaceSelector } from './components/WorkspaceSelector';

// Pages
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { MagicLinkVerificationPage } from './pages/MagicLinkVerificationPage';
import { SecurityPage } from './pages/SecurityPage';
import DashboardPage from './pages/DashboardPage';
import WorkflowsPage from './pages/WorkflowsPage';
import KanbanPage from './pages/KanbanPage';
import TeamPage from './pages/TeamPage';
import ClientsPage from './pages/ClientsPage';
import MeetingsPage from './pages/MeetingsPage';

// Protected Route Component with Workspace Check
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();

  if (authLoading || workspaceLoading) {
    return <LoadingCard message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but no workspace selected, show workspace selector
  if (!currentWorkspace) {
    return <WorkspaceSelector />;
  }

  return <>{children}</>;
};

// Layout component that handles loading and error states
const AppLayout: React.FC = () => {
  const { loading, error, refresh } = useAppContext();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <LoadingCard message="Loading application data..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <ErrorCard error={error} onRetry={refresh} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          <Routes>
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="workflows" element={
              <ProtectedRoute>
                <WorkflowsPage />
              </ProtectedRoute>
            } />
            <Route path="kanban" element={
              <ProtectedRoute>
                <KanbanPage />
              </ProtectedRoute>
            } />
            <Route path="team" element={
              <ProtectedRoute>
                <TeamPage />
              </ProtectedRoute>
            } />
            <Route path="clients" element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            } />
            <Route path="meetings" element={
              <ProtectedRoute>
                <MeetingsPage />
              </ProtectedRoute>
            } />
            <Route path="/security" element={
              <ProtectedRoute>
                <SecurityPage />
              </ProtectedRoute>
            } />
            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <Routes>
            {/* Public Routes (No Sidebar) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/oauth/callback/google" element={<OAuthCallbackPage />} />
            <Route path="/oauth/callback/github" element={<OAuthCallbackPage />} />
            
            {/* Protected Routes (With Sidebar and App Context) */}
            <Route path="/app/*" element={
              <AppProvider>
                <AppLayout />
              </AppProvider>
            } />
          </Routes>
        </Router>
      </WorkspaceProvider>
      <Router>
        <Routes>
          {/* Public Routes (No Sidebar) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/verify" element={<MagicLinkVerificationPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/oauth/callback/google" element={<OAuthCallbackPage />} />
          <Route path="/oauth/callback/github" element={<OAuthCallbackPage />} />
          
          {/* Protected Routes (With Sidebar and App Context) */}
          <Route path="/*" element={
            <AppProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/*" element={<AppLayout />} />
              </Routes>
            </AppProvider>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
