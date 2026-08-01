import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackButton } from './components/BackButton';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import MissingPersonsPage from './pages/MissingPersonsPage';
import FoundPersonsPage from './pages/FoundPersonsPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import FamilyDashboard from './pages/family/FamilyDashboard';
import ReportMissingPage from './pages/family/ReportMissingPage';
import FamilyMatchesPage from './pages/family/FamilyMatchesPage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportFoundPage from './pages/citizen/ReportFoundPage';
import SearchMissingPage from './pages/citizen/SearchMissingPage';
import PoliceDashboard from './pages/police/PoliceDashboard';
import PolicePendingPage from './pages/police/PolicePendingPage';
import PoliceCasesPage from './pages/police/PoliceCasesPage';
import PoliceFoundPage from './pages/police/PoliceFoundPage';
import PoliceUploadFoundPage from './pages/police/PoliceUploadFoundPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApprovalsPage from './pages/admin/AdminApprovalsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <BackButton />
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            <Route path="/missing" element={<Layout><MissingPersonsPage /></Layout>} />
            <Route path="/found" element={<Layout><FoundPersonsPage /></Layout>} />
            <Route path="/auth" element={<Layout><AuthPage /></Layout>} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Family */}
            <Route path="/family" element={<ProtectedRoute roles={['family']}><Layout><FamilyDashboard /></Layout></ProtectedRoute>} />
            <Route path="/family/report" element={<ProtectedRoute roles={['family']}><Layout><ReportMissingPage /></Layout></ProtectedRoute>} />
            <Route path="/family/matches" element={<ProtectedRoute roles={['family']}><Layout><FamilyMatchesPage /></Layout></ProtectedRoute>} />

            {/* Citizen */}
            <Route path="/citizen" element={<ProtectedRoute roles={['citizen']}><Layout><CitizenDashboard /></Layout></ProtectedRoute>} />
            <Route path="/citizen/report-found" element={<ProtectedRoute roles={['citizen']}><Layout><ReportFoundPage /></Layout></ProtectedRoute>} />
            <Route path="/citizen/search" element={<ProtectedRoute roles={['citizen']}><Layout><SearchMissingPage /></Layout></ProtectedRoute>} />

            {/* Police */}
            <Route path="/police/pending" element={<ProtectedRoute roles={['police']}><Layout><PolicePendingPage /></Layout></ProtectedRoute>} />
            <Route path="/police" element={<ProtectedRoute roles={['police']}><Layout><PoliceDashboard /></Layout></ProtectedRoute>} />
            <Route path="/police/cases" element={<ProtectedRoute roles={['police']}><Layout><PoliceCasesPage /></Layout></ProtectedRoute>} />
            <Route path="/police/found" element={<ProtectedRoute roles={['police']}><Layout><PoliceFoundPage /></Layout></ProtectedRoute>} />
            <Route path="/police/upload-found" element={<ProtectedRoute roles={['police']}><Layout><PoliceUploadFoundPage /></Layout></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute roles={['admin']}><Layout><AdminApprovalsPage /></Layout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><Layout><AdminUsersPage /></Layout></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><Layout><AdminAnalyticsPage /></Layout></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Layout><AdminReportsPage /></Layout></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><Layout><AdminAuditPage /></Layout></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Layout><NotificationsPage /></Layout></ProtectedRoute>} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
