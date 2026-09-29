import { useState, useEffect } from 'react';
import { getPayments } from '../../api';
import { LoadingSpinner, EmptyState, Badge } from '../../components/UI';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getPayments().then((r) => setPayments(r.data)).finally(() => setLoading(false));
  }, []);

  const statusVariant = (s) => ({ paid: 'success', pending: 'warning', failed: 'danger', overdue: 'danger' }[s] || 'default');

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Payment history and tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">₹{totalOverdue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'paid', 'pending', 'failed', 'overdue'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="$" title="No payments found" description="Payment records will appear here." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{pay.tenant_name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{pay.unit_number}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{pay.property_name}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">₹{pay.amount?.toLocaleString()}</td>
                    <td className="px-5 py-3"><Badge variant={statusVariant(pay.status)}>{pay.status?.toUpperCase()}</Badge></td>
                    <td className="px-5 py-3 text-xs text-gray-500 font-mono">{pay.payment_reference || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{pay.payment_date ? new Date(pay.payment_date).toLocaleDateString() : '—'}</td>
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
