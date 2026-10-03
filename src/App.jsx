import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import StateAnalysis from './pages/StateAnalysis';
import BudgetAnalytics from './pages/BudgetAnalytics';
import Predictions from './pages/Predictions';
import Recommendations from './pages/Recommendations';
import DocumentChat from './pages/DocumentChat';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public-Facing Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Unified Platform Application Shell */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/overview" element={<Dashboard />} />
            <Route path="/state-analysis" element={<StateAnalysis />} />
            <Route path="/budget-analytics" element={<BudgetAnalytics />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/document-chat" element={<DocumentChat />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
