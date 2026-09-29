import { useState, useEffect } from 'react';
import { getTenants } from '../../api';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UI';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getTenants().then((r) => setTenants(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = tenants.filter(t =>
    !search || t.full_name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <p className="text-sm text-gray-500 mt-1">{tenants.length} tenants</p>
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon="⧫" title="No tenants" description="Tenants will appear here once they are assigned to units." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200">
            <input type="text" placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">{tenant.full_name.charAt(0)}</div>
                        <span className="text-sm font-medium text-gray-900">{tenant.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{tenant.email}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{tenant.phone || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{new Date(tenant.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
