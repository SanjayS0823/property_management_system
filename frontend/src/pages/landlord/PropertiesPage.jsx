import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProperties, createProperty, updateProperty } from '../../api';
import { Button, Input, Modal, EmptyState, LoadingSpinner, Badge } from '../../components/UI';
import toast from 'react-hot-toast';

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', postal_code: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getProperties().then((r) => setProperties(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateProperty(editing.id, form);
        toast.success('Property updated');
      } else {
        await createProperty(form);
        toast.success('Property created');
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ name: '', address: '', city: '', state: '', postal_code: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (prop) => {
    setEditing(prop);
    setForm({ name: prop.name, address: prop.address, city: prop.city, state: prop.state, postal_code: prop.postal_code });
    setShowCreate(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">{properties.length} properties</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', address: '', city: '', state: '', postal_code: '' }); setShowCreate(true); }}>
          + Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon="⌂"
          title="No properties yet"
          description="Create your first property to get started."
          action={<Button onClick={() => setShowCreate(true)}>+ Add Property</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{prop.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{prop.address}</p>
                  <p className="text-sm text-gray-500">{prop.city}, {prop.state} {prop.postal_code}</p>
                </div>
                <Badge variant={prop.status === 'active' ? 'success' : 'default'}>{prop.status}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{prop.total_units}</p>
                  <p className="text-xs text-gray-500">Units</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{prop.occupied_units}</p>
                  <p className="text-xs text-gray-500">Occupied</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-400">{prop.vacant_units}</p>
                  <p className="text-xs text-gray-500">Vacant</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" variant="secondary" onClick={() => openEdit(prop)}>Edit</Button>
                <Button size="sm" onClick={() => navigate(`/properties/${prop.id}`)}>View Details</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Property' : 'Add Property'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Property Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sunrise Apartments" />
          <Input label="Address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Bangalore" />
            <Input label="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Karnataka" />
            <Input label="Postal Code" required value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} placeholder="560001" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Property'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
