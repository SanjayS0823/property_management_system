import { useState, useEffect } from 'react';
import { getMaintenanceRequests, createMaintenanceRequest, getUnits } from '../../api';
import { Button, Input, Select, Modal, EmptyState, LoadingSpinner, Badge } from '../../components/UI';
import toast from 'react-hot-toast';

export default function TenantMaintenance() {
  const [requests, setRequests] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', unit_id: '' });
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getMaintenanceRequests().then((r) => setRequests(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createMaintenanceRequest({
        ...form,
        unit_id: parseInt(form.unit_id),
      });
      toast.success('Maintenance request submitted');
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'medium', unit_id: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const statusVariant = (s) => ({ open: 'warning', in_progress: 'primary', resolved: 'success' }[s] || 'default');
  const priorityVariant = (p) => ({ urgent: 'danger', high: 'danger', medium: 'warning', low: 'info' }[p] || 'default');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-1">Submit and track maintenance requests</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Request</Button>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon="⚙"
          title="No maintenance requests"
          description="You haven't submitted any maintenance requests yet."
          action={<Button onClick={() => setShowCreate(true)}>+ New Request</Button>}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setSelected(req)}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{req.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Submitted {new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant={priorityVariant(req.priority)}>{req.priority?.toUpperCase()}</Badge>
                  <Badge variant={statusVariant(req.status)}>{req.status?.replace('_', ' ')?.toUpperCase()}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Maintenance Request" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Water leakage in bathroom" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the issue in detail..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Input label="Unit Number" required value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })} placeholder="Enter your unit ID" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || 'Request Details'}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Submitted</p>
              <p className="text-sm text-gray-600">{new Date(selected.created_at).toLocaleString()}</p>
            </div>
            {selected.status !== 'resolved' && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-yellow-700">Your request is being processed. You'll be notified when the status changes.</p>
              </div>
            )}
            {selected.status === 'resolved' && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-700">This request has been resolved. Updated {new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
