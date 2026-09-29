import { useState, useEffect } from 'react';
import { getLeases, createLease, renewLease, getTenants, getProperties, getUnits } from '../../api';
import { Button, Input, Select, Modal, EmptyState, LoadingSpinner, Badge } from '../../components/UI';
import toast from 'react-hot-toast';

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ tenant_id: '', unit_id: '', start_date: '', end_date: '', monthly_rent: '', security_deposit: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    Promise.all([getLeases(), getTenants(), getProperties()])
      .then(([l, t, p]) => {
        setLeases(l.data);
        setTenants(t.data);
        // Flatten all units from all properties
        const allUnits = [];
        for (const prop of p.data) {
          try {
            getUnits(prop.id).then(r => setUnits(prev => [...prev, ...r.data]));
          } catch(e) {}
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLease({
        tenant_id: parseInt(form.tenant_id),
        unit_id: parseInt(form.unit_id),
        start_date: form.start_date,
        end_date: form.end_date,
        monthly_rent: parseFloat(form.monthly_rent),
        security_deposit: parseFloat(form.security_deposit || 0),
      });
      toast.success('Lease created');
      setShowCreate(false);
      setForm({ tenant_id: '', unit_id: '', start_date: '', end_date: '', monthly_rent: '', security_deposit: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create lease');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async (lease) => {
    try {
      await renewLease(lease.id);
      toast.success('Lease renewed successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to renew lease');
    }
  };

  const statusVariant = (s) => ({ active: 'success', expired: 'danger', renewed: 'info', terminated: 'default' }[s] || 'default');

  const filtered = filter === 'all' ? leases : leases.filter(l => l.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
          <p className="text-sm text-gray-500 mt-1">{leases.length} total leases</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Create Lease</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'active', 'expired', 'renewed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${leases.filter(l => l.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="▣" title="No leases found" description="Create your first lease to get started." action={<Button onClick={() => setShowCreate(true)}>+ Create Lease</Button>} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Rent</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((lease) => {
                  const daysLeft = Math.ceil((new Date(lease.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
                  return (
                    <tr key={lease.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{lease.tenant_name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{lease.unit_number}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{lease.property_name}</td>
                      <td className="px-5 py-3 text-sm text-gray-900">₹{lease.monthly_rent?.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {lease.start_date} → {lease.end_date}
                        {isExpiringSoon && <span className="ml-1 text-xs text-yellow-600">({daysLeft}d left)</span>}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant(lease.status)}>
                          {lease.status === 'active' && isExpiringSoon ? 'EXPIRING SOON' : lease.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {lease.status === 'active' && (
                          <Button size="sm" variant="secondary" onClick={() => handleRenew(lease)}>Renew</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Lease Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Lease" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tenant" required value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}>
              <option value="">Select tenant</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </Select>
            <Select label="Unit" required value={form.unit_id} onChange={(e) => {
              const unitId = parseInt(e.target.value);
              const unit = units.find(u => u.id === unitId);
              setForm({ ...form, unit_id: e.target.value, monthly_rent: unit ? unit.monthly_rent.toString() : form.monthly_rent });
            }}>
              <option value="">Select unit</option>
              {units.filter(u => u.status === 'vacant').map((u) => <option key={u.id} value={u.id}>Unit {u.unit_number} (₹{u.monthly_rent?.toLocaleString()})</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End Date" required type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monthly Rent (₹)" required type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} />
            <Input label="Security Deposit (₹)" type="number" value={form.security_deposit} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Lease'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
