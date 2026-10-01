import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Overview from './pages/Overview.jsx';
import Automations from './pages/Automations.jsx';
import AutomationEditor from './pages/AutomationEditor.jsx';
import InstagramSetup from './pages/InstagramSetup.jsx';
import Contacts from './pages/Contacts.jsx';
import Inbox from './pages/Inbox.jsx';
import Analytics from './pages/Analytics.jsx';
import Integrations from './pages/Integrations.jsx';
import Templates from './pages/Templates.jsx';
import AiAssistant from './pages/AiAssistant.jsx';
import Knowledge from './pages/Knowledge.jsx';
import Team from './pages/Team.jsx';
import Settings from './pages/Settings.jsx';
import NewAccount from './pages/NewAccount.jsx';
import Privacy from './pages/Privacy.jsx';

function Protected() {
  const token = localStorage.getItem('flowvik_token');
  return token ? <Layout /> : <Navigate to="/login" replace />;
}

function ProtectedPage({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard/accounts/new" element={localStorage.getItem('flowvik_token') ? <ProtectedPage><NewAccount /></ProtectedPage> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Protected />}>
          <Route index element={<ProtectedPage><Overview /></ProtectedPage>} />
          <Route path="automations" element={<ProtectedPage><Automations /></ProtectedPage>} />
          <Route path="automations/new" element={<ProtectedPage><AutomationEditor /></ProtectedPage>} />
          <Route path="automations/:id" element={<ProtectedPage><InstagramSetup editing /></ProtectedPage>} />
          <Route path="automations/:id/editor" element={<ProtectedPage><AutomationEditor /></ProtectedPage>} />
          <Route path="automations/:id/setup" element={<ProtectedPage><InstagramSetup /></ProtectedPage>} />
          <Route path="contacts" element={<ProtectedPage><Contacts /></ProtectedPage>} />
          <Route path="inbox" element={<ProtectedPage><Inbox /></ProtectedPage>} />
          <Route path="analytics" element={<ProtectedPage><Analytics /></ProtectedPage>} />
          <Route path="integrations" element={<ProtectedPage><Integrations /></ProtectedPage>} />
          <Route path="templates" element={<ProtectedPage><Templates /></ProtectedPage>} />
          <Route path="ai" element={<ProtectedPage><AiAssistant /></ProtectedPage>} />
          <Route path="knowledge" element={<ProtectedPage><Knowledge /></ProtectedPage>} />
          <Route path="team" element={<ProtectedPage><Team /></ProtectedPage>} />
          <Route path="settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
