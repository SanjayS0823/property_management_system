import { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api';
import { Button, EmptyState, LoadingSpinner, Badge } from '../../components/UI';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getNotifications().then((r) => setNotifications(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All marked as read');
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const typeIcon = (t) => ({ warning: '⚠', error: '✕', success: '✓', info: 'ℹ' }[t] || 'ℹ');
  const typeColor = (t) => ({ warning: 'text-yellow-500', error: 'text-red-500', success: 'text-green-500', info: 'text-blue-500' }[t] || 'text-gray-500');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={handleMarkAll}>Mark all as read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`px-5 py-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50/50 ${!notif.is_read ? 'bg-primary-50/30' : ''}`}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
            >
              <span className={`text-lg mt-0.5 ${typeColor(notif.type)}`}>{typeIcon(notif.type)}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
              {!notif.is_read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
