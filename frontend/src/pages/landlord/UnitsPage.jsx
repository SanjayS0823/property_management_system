import { useState, useEffect } from 'react';
import { getProperties } from '../../api';
import { LoadingSpinner, Badge } from '../../components/UI';
import { Link } from 'react-router-dom';

export default function UnitsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getProperties().then((r) => setProperties(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const allUnits = properties.flatMap(p => (p.units || []).map(u => ({ ...u, property_name: p.name, property_id: p.id })));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Units</h1>
        <p className="text-sm text-gray-500 mt-1">Manage units across all properties</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-200">
          <input type="text" placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Rent</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allUnits.filter(u => !search || u.unit_number?.toLowerCase().includes(search.toLowerCase()) || u.property_name?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-500">No units found</td></tr>
              ) : allUnits.filter(u => !search || u.unit_number?.toLowerCase().includes(search.toLowerCase()) || u.property_name?.toLowerCase().includes(search.toLowerCase())).map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm text-gray-600">
                    <Link to={`/properties/${unit.property_id}`} className="text-primary-600 hover:underline">{unit.property_name}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{unit.unit_number}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 capitalize">{unit.unit_type?.replace('_', ' ')}</td>
                  <td className="px-5 py-3 text-sm text-gray-900">₹{unit.monthly_rent?.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <Badge variant={unit.status === 'occupied' ? 'success' : unit.status === 'maintenance' ? 'warning' : 'default'}>{unit.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{unit.tenant_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
