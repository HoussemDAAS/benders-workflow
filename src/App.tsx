import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { useAppContext } from './hooks/useAppContext';

// Components
import { Sidebar } from './components/Sidebar';
import { LoadingCard } from './components/LoadingSpinner';
import { ErrorCard } from './components/ErrorMessage';

// Pages
import { LoginPage } from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkflowsPage from './pages/WorkflowsPage';
import KanbanPage from './pages/KanbanPage';
import TeamPage from './pages/TeamPage';
import ClientsPage from './pages/ClientsPage';
import MeetingsPage from './pages/MeetingsPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // For now, we'll allow access (until backend is ready)
  // Later this will check authentication properly
  
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
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/workflows" element={
              <ProtectedRoute>
                <WorkflowsPage />
              </ProtectedRoute>
            } />
            <Route path="/kanban" element={
              <ProtectedRoute>
                <KanbanPage />
              </ProtectedRoute>
            } />
            <Route path="/team" element={
              <ProtectedRoute>
                <TeamPage />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            } />
            <Route path="/meetings" element={
              <ProtectedRoute>
                <MeetingsPage />
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
      <Router>
        <Routes>
          {/* Public Routes (No Sidebar) */}
          <Route path="/login" element={<LoginPage />} />
          
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
