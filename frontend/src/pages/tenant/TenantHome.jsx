import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTenantDashboard, getMaintenanceRequests, getPayments } from '../../api';
import { LoadingSpinner, Badge } from '../../components/UI';

export default function TenantHome() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTenantDashboard(), getMaintenanceRequests(), getPayments()])
      .then(([d, m, p]) => {
        setDashboard(d.data);
        setMaintenance(m.data.slice(0, 5));
        setPayments(p.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const statusBadge = (s) => {
    const map = { open: 'warning', in_progress: 'primary', resolved: 'success', paid: 'success', pending: 'warning', failed: 'danger' };
    return <Badge variant={map[s] || 'default'}>{s?.replace('_', ' ')?.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        {dashboard?.property_name ? (
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Property</p>
              <p className="text-sm font-medium text-gray-900">{dashboard.property_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Unit</p>
              <p className="text-sm font-medium text-gray-900">{dashboard.unit_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Monthly Rent</p>
              <p className="text-lg font-bold text-gray-900">₹{dashboard.monthly_rent?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Lease Status</p>
              {statusBadge(dashboard.current_lease_status)}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">No active lease found. Contact your property manager.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/tenant/lease" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-2xl mb-2">▣</div>
              <p className="text-sm font-medium text-gray-900">View Lease</p>
            </Link>
            <Link to="/tenant/payments" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-2xl mb-2">$</div>
              <p className="text-sm font-medium text-gray-900">Pay Rent</p>
            </Link>
            <Link to="/tenant/maintenance" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-2xl mb-2">⚙</div>
              <p className="text-sm font-medium text-gray-900">Maintenance</p>
            </Link>
            <Link to="/tenant/notifications" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-2xl mb-2">🔔</div>
              <p className="text-sm font-medium text-gray-900">Notifications</p>
            </Link>
          </div>
        </div>

        {/* Recent Maintenance */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Maintenance Requests</h2>
            <Link to="/tenant/maintenance" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {maintenance.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No maintenance requests</div>
            ) : maintenance.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{m.title}</p>
                  <p className="text-xs text-gray-500">Created {new Date(m.created_at).toLocaleDateString()}</p>
                </div>
                {statusBadge(m.status)}
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Payments</h2>
            <Link to="/tenant/payments" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No payments yet</div>
            ) : payments.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">₹{p.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'Pending'}</p>
                </div>
                {statusBadge(p.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
