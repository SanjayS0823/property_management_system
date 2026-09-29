import { useState, useEffect } from 'react';
import { getPayments, createPayment, processPayment, getLeases } from '../../api';
import { Button, Modal, EmptyState, LoadingSpinner, Badge, Input } from '../../components/UI';
import toast from 'react-hot-toast';

export default function TenantPayments() {
  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getPayments(), getLeases()])
      .then(([p, l]) => {
        setPayments(p.data);
        setLeases(l.data);
        const active = l.data.find(l => l.status === 'active');
        if (active) {
          setSelectedLease(active);
          setAmount(active.monthly_rent.toString());
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handlePay = async (success = true) => {
    if (!selectedLease || !amount) return;
    setPaying(true);
    try {
      // Step 1: Create payment
      const payRes = await createPayment({
        lease_id: selectedLease.id,
        amount: parseFloat(amount),
      });
      // Step 2: Process through sandbox
      const result = await processPayment(payRes.data.id, success);
      setPaymentResult(result.data);
      if (success) {
        toast.success('Payment successful!');
      } else {
        toast.error('Payment failed. Please try again.');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const statusVariant = (s) => ({ paid: 'success', pending: 'warning', failed: 'danger', overdue: 'danger' }[s] || 'default');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rent & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your rent payments</p>
        </div>
        <Button onClick={() => { setPaymentResult(null); setShowPay(true); }}>Pay Rent</Button>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon="$" title="No payments yet" description="Your payment history will appear here." action={<Button onClick={() => setShowPay(true)}>Pay Rent</Button>} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">₹{pay.amount?.toLocaleString()}</td>
                    <td className="px-5 py-3"><Badge variant={statusVariant(pay.status)}>{pay.status?.toUpperCase()}</Badge></td>
                    <td className="px-5 py-3 text-xs text-gray-500 font-mono">{pay.payment_reference || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{pay.due_date ? new Date(pay.due_date).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{pay.payment_date ? new Date(pay.payment_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Rent Modal */}
      <Modal isOpen={showPay} onClose={() => { setShowPay(false); setPaymentResult(null); }} title="Pay Rent">
        {paymentResult ? (
          <div className="text-center py-4">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${paymentResult.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {paymentResult.status === 'paid' ? '✓' : '✕'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {paymentResult.status === 'paid' ? 'Payment Successful' : 'Payment Failed'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{paymentResult.gateway_response?.message}</p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-mono">{paymentResult.reference}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium">₹{paymentResult.amount?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Transaction ID</span><span className="font-mono">{paymentResult.gateway_response?.transaction_id}</span></div>
            </div>
            <Button className="mt-6" onClick={() => { setShowPay(false); setPaymentResult(null); }}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedLease && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Unit {selectedLease.unit_number} — {selectedLease.property_name}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">₹{selectedLease.monthly_rent?.toLocaleString()}/month</p>
              </div>
            )}
            <Input label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700">This is a sandbox payment. No real money will be charged. You can simulate both successful and failed payments.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowPay(false)}>Cancel</Button>
              <Button onClick={() => handlePay(true)} disabled={paying || !amount}>
                {paying ? 'Processing...' : 'Pay Now (Success)'}
              </Button>
              <Button variant="danger" onClick={() => handlePay(false)} disabled={paying || !amount}>
                {paying ? 'Processing...' : 'Simulate Failure'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
