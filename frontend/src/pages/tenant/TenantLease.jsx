import { useState, useEffect } from 'react';
import { getLeases } from '../../api';
import { LoadingSpinner, Badge, Card } from '../../components/UI';

export default function TenantLease() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeases().then((r) => setLeases(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const activeLease = leases.find(l => l.status === 'active');
  const pastLeases = leases.filter(l => l.status !== 'active');

  const statusVariant = (s) => ({ active: 'success', expired: 'danger', renewed: 'info', terminated: 'default' }[s] || 'default');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Lease</h1>

      {activeLease ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Current Lease</h2>
            <Badge variant="success">ACTIVE</Badge>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Property</p>
              <p className="text-sm font-medium text-gray-900">{activeLease.property_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Unit</p>
              <p className="text-sm font-medium text-gray-900">{activeLease.unit_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Monthly Rent</p>
              <p className="text-lg font-bold text-gray-900">₹{activeLease.monthly_rent?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Security Deposit</p>
              <p className="text-sm font-medium text-gray-900">₹{activeLease.security_deposit?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Start Date</p>
              <p className="text-sm text-gray-900">{activeLease.start_date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">End Date</p>
              <p className="text-sm text-gray-900">{activeLease.end_date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Lease ID</p>
              <p className="text-sm text-gray-500 font-mono">#{activeLease.id}</p>
            </div>
            {activeLease.lease_document_path && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Document</p>
                <p className="text-sm text-primary-600 hover:underline cursor-pointer">View Document</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No active lease found. Contact your property manager.</p>
        </div>
      )}

      {pastLeases.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Leases</h2>
          <div className="space-y-3">
            {pastLeases.map((lease) => (
              <Card key={lease.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Unit {lease.unit_number} — {lease.property_name}</p>
                      <p className="text-xs text-gray-500">{lease.start_date} → {lease.end_date}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant(lease.status)}>{lease.status?.toUpperCase()}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
