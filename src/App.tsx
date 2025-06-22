import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { AppProvider } from './context/AppContext';
import { useAppContext } from './hooks/useAppContext';

// Components
import { Sidebar } from './components/Sidebar';
import { LoadingCard } from './components/LoadingSpinner';
import { ErrorCard } from './components/ErrorMessage';

// Pages
import DashboardPage from './pages/DashboardPage';
import WorkflowsPage from './pages/WorkflowsPage';
import KanbanPage from './pages/KanbanPage';
import TeamPage from './pages/TeamPage';
import ClientsPage from './pages/ClientsPage';
import MeetingsPage from './pages/MeetingsPage';

// Styles
import './styles/app.css';

// Layout component that handles loading and error states
const AppLayout: React.FC = () => {
  const { loading, error, refresh } = useAppContext();

  if (loading) {
    return (
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <LoadingCard message="Loading application data..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <ErrorCard error={error} onRetry={refresh} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </Router>
  );
}
