import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import api from '../services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: number;
  link: string;
  created_at: string;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?per_page=50');
      setNotifications(res.data.items);
      setUnread(res.data.unread);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const handleClick = (notification: Notification) => {
    if (!notification.is_read) markRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  const getTypeIcon = (type: string) => {
    const colors: Record<string, string> = {
      new_lead: 'bg-blue-100 text-blue-600',
      lead_update: 'bg-yellow-100 text-yellow-600',
      new_message: 'bg-green-100 text-green-600',
      new_booking: 'bg-purple-100 text-purple-600',
      booking_update: 'bg-orange-100 text-orange-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" /> Notifications
          {unread > 0 && <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">{unread}</span>}
        </h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <button key={n.id} onClick={() => handleClick(n)}
              className={`w-full text-left bg-white rounded-xl shadow p-4 flex items-start gap-4 hover:shadow-md transition-shadow ${
                !n.is_read ? 'border-l-4 border-blue-500' : ''
              }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeIcon(n.type)}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className={`font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                  {!n.is_read && (
                    <button onClick={e => { e.stopPropagation(); markRead(n.id); }}
                      className="p-1 hover:bg-gray-100 rounded" title="Mark as read">
                      <Check className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
