import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProperty, getUnits, createUnit, updateUnit, assignTenant, getTenants } from '../../api';
import { Button, Input, Select, Modal, EmptyState, LoadingSpinner, Badge } from '../../components/UI';
import toast from 'react-hot-toast';

const UNIT_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: '1bed', label: '1 Bedroom' },
  { value: '2bed', label: '2 Bedrooms' },
  { value: '3bed', label: '3 Bedrooms' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'commercial', label: 'Commercial' },
];

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAssign, setShowAssign] = useState(null);
  const [unitForm, setUnitForm] = useState({ unit_number: '', unit_type: '1bed', monthly_rent: '' });
  const [editingUnit, setEditingUnit] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      getProperty(id),
      getUnits(id),
      getTenants(),
    ]).then(([p, u, t]) => {
      setProperty(p.data);
      setUnits(u.data);
      setTenants(t.data);
    }).catch(() => navigate('/properties'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, { ...unitForm, monthly_rent: parseFloat(unitForm.monthly_rent) });
        toast.success('Unit updated');
      } else {
        await createUnit(id, { ...unitForm, monthly_rent: parseFloat(unitForm.monthly_rent) });
        toast.success('Unit added');
      }
      setShowAddUnit(false);
      setEditingUnit(null);
      setUnitForm({ unit_number: '', unit_type: '1bed', monthly_rent: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (tenantId) => {
    try {
      await assignTenant(showAssign.id, parseInt(tenantId));
      toast.success('Tenant assigned');
      setShowAssign(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const openEdit = (unit) => {
    setEditingUnit(unit);
    setUnitForm({ unit_number: unit.unit_number, unit_type: unit.unit_type, monthly_rent: unit.monthly_rent.toString() });
    setShowAddUnit(true);
  };

  if (loading) return <LoadingSpinner />;
  if (!property) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/properties')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-sm text-gray-500">{property.address}, {property.city}, {property.state} {property.postal_code}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[{ l: 'Total Units', v: property.total_units }, { l: 'Occupied', v: property.occupied_units, c: 'text-green-600' }, { l: 'Vacant', v: property.vacant_units, c: 'text-gray-400' }, { l: 'Occupancy', v: `${property.total_units ? Math.round(property.occupied_units / property.total_units * 100) : 0}%` }].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.c || 'text-gray-900'}`}>{s.v}</p>
            <p className="text-xs text-gray-500 mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Units */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Units</h2>
          <Button size="sm" onClick={() => { setEditingUnit(null); setUnitForm({ unit_number: '', unit_type: '1bed', monthly_rent: '' }); setShowAddUnit(true); }}>+ Add Unit</Button>
        </div>
        {units.length === 0 ? (
          <EmptyState icon="◻" title="No units yet" description="Add units to this property." action={<Button size="sm" onClick={() => setShowAddUnit(true)}>+ Add Unit</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Monthly Rent</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{unit.unit_number}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 capitalize">{unit.unit_type?.replace('_', ' ')}</td>
                    <td className="px-5 py-3 text-sm text-gray-900">₹{unit.monthly_rent?.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <Badge variant={unit.status === 'occupied' ? 'success' : unit.status === 'maintenance' ? 'warning' : 'default'}>
                        {unit.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{unit.tenant_name || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(unit)} className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
                        {unit.status !== 'occupied' && (
                          <button onClick={() => setShowAssign(unit)} className="text-sm text-primary-600 hover:text-primary-700">Assign</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Unit Modal */}
      <Modal isOpen={showAddUnit} onClose={() => { setShowAddUnit(false); setEditingUnit(null); }} title={editingUnit ? 'Edit Unit' : 'Add Unit'}>
        <form onSubmit={handleAddUnit} className="space-y-4">
          <Input label="Unit Number" required value={unitForm.unit_number} onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })} placeholder="101" />
          <Select label="Unit Type" value={unitForm.unit_type} onChange={(e) => setUnitForm({ ...unitForm, unit_type: e.target.value })}>
            {UNIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input label="Monthly Rent (₹)" required type="number" value={unitForm.monthly_rent} onChange={(e) => setUnitForm({ ...unitForm, monthly_rent: e.target.value })} placeholder="18000" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowAddUnit(false); setEditingUnit(null); }}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editingUnit ? 'Save Changes' : 'Add Unit'}</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Tenant Modal */}
      <Modal isOpen={!!showAssign} onClose={() => setShowAssign(null)} title="Assign Tenant to Unit" size="md">
        <p className="text-sm text-gray-500 mb-4">Assign a tenant to Unit {showAssign?.unit_number}</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tenants.filter(t => !units.some(u => u.tenant_id === t.id && u.status === 'occupied')).map((tenant) => (
            <button key={tenant.id} onClick={() => handleAssign(tenant.id)} className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">{tenant.full_name.charAt(0)}</div>
              <div>
                <p className="text-sm font-medium text-gray-900">{tenant.full_name}</p>
                <p className="text-xs text-gray-500">{tenant.email}</p>
              </div>
            </button>
          ))}
          {tenants.filter(t => !units.some(u => u.tenant_id === t.id && u.status === 'occupied')).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No unassigned tenants available</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
