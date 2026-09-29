import { useState, useEffect } from 'react';
import { getMaintenanceRequests, updateMaintenanceStatus } from '../../api';
import { Button, Select, Modal, EmptyState, LoadingSpinner, Badge } from '../../components/UI';
import toast from 'react-hot-toast';

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    getMaintenanceRequests().then((r) => setRequests(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusUpdate = async (status) => {
    setUpdating(true);
    try {
      await updateMaintenanceStatus(selected.id, { status });
      toast.success('Status updated');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    } finally {
      setUpdating(false);
    }
  };

  const priorityVariant = (p) => ({ urgent: 'danger', high: 'danger', medium: 'warning', low: 'info' }[p] || 'default');
  const statusVariant = (s) => ({ open: 'warning', in_progress: 'primary', resolved: 'success' }[s] || 'default');

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        <p className="text-sm text-gray-500 mt-1">{requests.length} total requests</p>
      </div>

      <div className="flex gap-2">
        {['all', 'open', 'in_progress', 'resolved'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)} ({requests.filter(r => f === 'all' || r.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="⚙" title="No maintenance requests" description="Requests from tenants will appear here." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Request</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelected(req)}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{req.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{req.description}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{req.tenant_name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{req.unit_number}</td>
                    <td className="px-5 py-3"><Badge variant={priorityVariant(req.priority)}>{req.priority?.toUpperCase()}</Badge></td>
                    <td className="px-5 py-3"><Badge variant={statusVariant(req.status)}>{req.status?.replace('_', ' ')?.toUpperCase()}</Badge></td>
                    <td className="px-5 py-3 text-sm text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      {req.status !== 'resolved' && (
                        <button className="text-sm text-primary-600 hover:text-primary-700" onClick={(e) => { e.stopPropagation(); setSelected(req); }}>Manage</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail/Update Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || 'Request Details'}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Tenant</p>
                <p className="text-sm text-gray-900">{selected.tenant_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Unit</p>
                <p className="text-sm text-gray-900">{selected.unit_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Priority</p>
                <Badge variant={priorityVariant(selected.priority)}>{selected.priority?.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                <Badge variant={statusVariant(selected.status)}>{selected.status?.replace('_', ' ')?.toUpperCase()}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Description</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.description}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Created</p>
              <p className="text-sm text-gray-600">{new Date(selected.created_at).toLocaleString()}</p>
            </div>
            {selected.status !== 'resolved' && (
              <div className="flex gap-3 pt-2 border-t border-gray-200">
                {selected.status === 'open' && (
                  <Button onClick={() => handleStatusUpdate('in_progress')} disabled={updating}>Mark In Progress</Button>
                )}
                {selected.status === 'in_progress' && (
                  <Button onClick={() => handleStatusUpdate('resolved')} variant="success" disabled={updating}>Mark Resolved</Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
