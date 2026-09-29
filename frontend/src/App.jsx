import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Landlord/Manager pages
import Dashboard from './pages/landlord/Dashboard';
import PropertiesPage from './pages/landlord/PropertiesPage';
import PropertyDetail from './pages/landlord/PropertyDetail';
import UnitsPage from './pages/landlord/UnitsPage';
import TenantsPage from './pages/landlord/TenantsPage';
import LeasesPage from './pages/landlord/LeasesPage';
import MaintenancePage from './pages/landlord/MaintenancePage';
import PaymentsPage from './pages/landlord/PaymentsPage';
import NotificationsPage from './pages/landlord/NotificationsPage';

// Tenant pages
import TenantHome from './pages/tenant/TenantHome';
import TenantLease from './pages/tenant/TenantLease';
import TenantPayments from './pages/tenant/TenantPayments';
import TenantMaintenance from './pages/tenant/TenantMaintenance';
import TenantNotifications from './pages/tenant/TenantNotifications';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'tenant') return <Navigate to="/tenant" replace />;
  return <Layout>{children}</Layout>;
}

function TenantRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'tenant') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={user.role === 'tenant' ? '/tenant' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '14px', borderRadius: '10px', padding: '12px 16px' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

          {/* Admin routes */}
          <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/properties" element={<AdminRoute><PropertiesPage /></AdminRoute>} />
          <Route path="/properties/:id" element={<AdminRoute><PropertyDetail /></AdminRoute>} />
          <Route path="/units" element={<AdminRoute><UnitsPage /></AdminRoute>} />
          <Route path="/tenants" element={<AdminRoute><TenantsPage /></AdminRoute>} />
          <Route path="/leases" element={<AdminRoute><LeasesPage /></AdminRoute>} />
          <Route path="/maintenance" element={<AdminRoute><MaintenancePage /></AdminRoute>} />
          <Route path="/payments" element={<AdminRoute><PaymentsPage /></AdminRoute>} />
          <Route path="/notifications" element={<AdminRoute><NotificationsPage /></AdminRoute>} />

          {/* Tenant routes */}
          <Route path="/tenant" element={<TenantRoute><TenantHome /></TenantRoute>} />
          <Route path="/tenant/lease" element={<TenantRoute><TenantLease /></TenantRoute>} />
          <Route path="/tenant/payments" element={<TenantRoute><TenantPayments /></TenantRoute>} />
          <Route path="/tenant/maintenance" element={<TenantRoute><TenantMaintenance /></TenantRoute>} />
          <Route path="/tenant/notifications" element={<TenantRoute><TenantNotifications /></TenantRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
