import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Booking {
  id: number;
  truck_id: number;
  brand: string;
  model: string;
  truck_price: number;
  amount: number;
  status: string;
  payment_method: string;
  customer_name: string;
  dealer_name: string;
  dealer_company: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings?per_page=50').then(res => {
      setBookings(res.data.items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (bookingId: number, status: string) => {
    try {
      await api.put(`/bookings/${bookingId}`, { status });
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch {
      alert('Failed to update booking');
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <ShoppingCart className="w-6 h-6" /> Bookings
      </h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No bookings yet</p>
          <Link to="/trucks" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Browse trucks</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/trucks/${booking.truck_id}`} className="font-bold text-lg hover:text-blue-600">
                    {booking.brand} {booking.model}
                  </Link>
                  <p className="text-2xl font-bold text-blue-600 mt-1">${booking.amount.toLocaleString()}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    {user?.role === 'dealer' || user?.role === 'admin' ? (
                      <p>Customer: <span className="font-medium">{booking.customer_name}</span></p>
                    ) : (
                      <p>Dealer: <span className="font-medium">{booking.dealer_company || booking.dealer_name}</span></p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{new Date(booking.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[booking.status] || 'bg-gray-100'}`}>
                    {booking.status}
                  </span>
                  {(user?.role === 'dealer' || user?.role === 'admin') && booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(booking.id, 'confirmed')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                        Confirm
                      </button>
                      <button onClick={() => updateStatus(booking.id, 'cancelled')}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                        Cancel
                      </button>
                    </div>
                  )}
                  {(user?.role === 'dealer' || user?.role === 'admin') && booking.status === 'confirmed' && (
                    <button onClick={() => updateStatus(booking.id, 'completed')}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      Mark Completed
                    </button>
                  )}
                  {user?.role === 'customer' && booking.status === 'pending' && (
                    <button onClick={() => updateStatus(booking.id, 'cancelled')}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
