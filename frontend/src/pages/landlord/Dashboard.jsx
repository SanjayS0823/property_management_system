import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboard, getMaintenanceRequests, getLeases, getPayments } from '../../api';
import { StatCard, LoadingSpinner, Badge } from '../../components/UI';

function PriorityBadge({ priority }) {
  const map = { urgent: 'danger', high: 'danger', medium: 'warning', low: 'info' };
  return <Badge variant={map[priority] || 'default'}>{priority?.toUpperCase()}</Badge>;
}

function StatusBadge({ status }) {
  const map = {
    open: 'warning', in_progress: 'primary', resolved: 'success',
    active: 'success', expired: 'danger', renewed: 'info',
    paid: 'success', pending: 'warning', failed: 'danger', overdue: 'danger',
  };
  return <Badge variant={map[status] || 'default'}>{status?.replace('_', ' ')?.toUpperCase()}</Badge>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [leases, setLeases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getMaintenanceRequests(),
      getLeases(),
      getPayments(),
    ]).then(([d, m, l, p]) => {
      setStats(d.data);
      setMaintenance(m.data.slice(0, 5));
      setLeases(l.data.filter(l => l.status === 'active'));
      setPayments(p.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {user?.full_name}</h1>
        <p className="text-gray-500 mt-1">Here's what needs your attention today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Properties"
          value={stats?.total_properties || 0}
          change={`${stats?.total_units || 0} total units`}
          icon={<span className="text-lg">⌂</span>}
          color="primary"
        />
        <StatCard
          label="Occupancy"
          value={`${stats?.occupancy_rate || 0}%`}
          change={`${stats?.occupied_units || 0} of ${stats?.total_units || 0} units`}
          icon={<span className="text-lg">◻</span>}
          color="success"
        />
        <StatCard
          label="Rent Collected"
          value={`₹${(stats?.rent_collected || 0).toLocaleString()}`}
          change={`₹${(stats?.pending_rent || 0).toLocaleString()} pending`}
          icon={<span className="text-lg">$</span>}
          color="info"
        />
        <StatCard
          label="Maintenance"
          value={stats?.open_maintenance || 0}
          change="open requests"
          icon={<span className="text-lg">⚙</span>}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Requests */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Maintenance Requests</h2>
            <Link to="/maintenance" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {maintenance.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No open maintenance requests</div>
            ) : maintenance.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                  <p className="text-xs text-gray-500">Unit {m.unit_number} • {m.tenant_name}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <PriorityBadge priority={m.priority} />
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Payments</h2>
            <Link to="/payments" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No payments yet</div>
            ) : payments.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{p.tenant_name}</p>
                  <p className="text-xs text-gray-500">Unit {p.unit_number}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">₹{p.amount?.toLocaleString()}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Leases */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Active Leases</h2>
            <Link to="/leases" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {leases.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No active leases</div>
            ) : leases.map((l) => (
              <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{l.tenant_name}</p>
                  <p className="text-xs text-gray-500">Unit {l.unit_number} • {l.property_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">₹{l.monthly_rent?.toLocaleString()}/mo</p>
                  <p className="text-xs text-gray-500">Ends {l.end_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Upcoming Lease Renewals</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {leases.filter(l => {
              const end = new Date(l.end_date);
              const now = new Date();
              const diff = (end - now) / (1000 * 60 * 60 * 24);
              return diff <= 30 && diff > 0;
            }).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No upcoming renewals in the next 30 days</div>
            ) : leases.filter(l => {
              const end = new Date(l.end_date);
              const now = new Date();
              const diff = (end - now) / (1000 * 60 * 60 * 24);
              return diff <= 30 && diff > 0;
            }).map((l) => (
              <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Unit {l.unit_number}</p>
                  <p className="text-xs text-gray-500">{l.property_name}</p>
                </div>
                <Badge variant="warning">{l.end_date}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
