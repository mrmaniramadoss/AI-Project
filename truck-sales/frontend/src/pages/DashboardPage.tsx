import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Users, DollarSign, TrendingUp, Eye, FileText, ShoppingCart, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Overview {
  trucks: { total: number; available: number; sold: number };
  leads: { total: number; new: number; converted: number };
  revenue: number;
  users: { total: number; dealers: number; customers: number };
}

interface LeadStats {
  by_status: { status: string; count: number }[];
  monthly: { month: string; count: number }[];
}

interface TopTruck {
  id: number;
  brand: string;
  model: string;
  price: number;
  views: number;
  lead_count: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [topTrucks, setTopTrucks] = useState<TopTruck[]>([]);
  const [recommendations, setRecommendations] = useState<{ items: { id: number; brand: string; model: string; price: number; image_urls: string[] }[] }>({ items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin' || user?.role === 'dealer') {
          const [overviewRes, leadRes, topRes] = await Promise.all([
            api.get('/analytics/overview'),
            api.get('/analytics/lead-stats'),
            api.get('/analytics/top-trucks'),
          ]);
          setOverview(overviewRes.data);
          setLeadStats(leadRes.data);
          setTopTrucks(topRes.data);
        }
        if (user?.role === 'customer') {
          const recRes = await api.get('/recommendations?limit=4');
          setRecommendations(recRes.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  // Customer dashboard
  if (user?.role === 'customer') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Welcome, {user.full_name || user.username}!</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/trucks" className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <Truck className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold">Browse Trucks</h3>
            <p className="text-sm text-gray-500 mt-1">Find your perfect truck</p>
          </Link>
          <Link to="/leads" className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <FileText className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold">My Inquiries</h3>
            <p className="text-sm text-gray-500 mt-1">Track your truck inquiries</p>
          </Link>
          <Link to="/bookings" className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <ShoppingCart className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold">My Bookings</h3>
            <p className="text-sm text-gray-500 mt-1">View your bookings</p>
          </Link>
        </div>

        {recommendations.items.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.items.map(truck => (
                <Link key={truck.id} to={`/trucks/${truck.id}`}
                  className="bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden">
                  <img src={truck.image_urls?.[0] || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400'} alt=""
                    className="w-full h-36 object-cover" />
                  <div className="p-3">
                    <h3 className="font-semibold">{truck.brand} {truck.model}</h3>
                    <p className="text-blue-600 font-bold">${truck.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin/Dealer dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {user?.role === 'dealer' && (
          <Link to="/my-trucks/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Truck
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Trucks</p>
                <p className="text-2xl font-bold">{overview.trucks.total}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="text-green-600">{overview.trucks.available} available</span>
              <span className="text-red-600">{overview.trucks.sold} sold</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold">{overview.leads.total}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="text-blue-600">{overview.leads.new} new</span>
              <span className="text-green-600">{overview.leads.converted} converted</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">${overview.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          {user?.role === 'admin' && (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Users</p>
                  <p className="text-2xl font-bold">{overview.users.total}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="text-blue-600">{overview.users.dealers} dealers</span>
                <span className="text-green-600">{overview.users.customers} customers</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Lead Stats by Status */}
        {leadStats && leadStats.by_status.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Leads by Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={leadStats.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%"
                  outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                  {leadStats.by_status.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Leads */}
        {leadStats && leadStats.monthly.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Monthly Leads</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[...leadStats.monthly].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Trucks */}
      {topTrucks.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Top Performing Trucks
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-gray-500">Truck</th>
                  <th className="pb-3 font-medium text-gray-500">Price</th>
                  <th className="pb-3 font-medium text-gray-500 flex items-center gap-1"><Eye className="w-4 h-4" /> Views</th>
                  <th className="pb-3 font-medium text-gray-500">Leads</th>
                </tr>
              </thead>
              <tbody>
                {topTrucks.map(t => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link to={`/trucks/${t.id}`} className="text-blue-600 hover:underline font-medium">{t.brand} {t.model}</Link>
                    </td>
                    <td className="py-3">${t.price.toLocaleString()}</td>
                    <td className="py-3">{t.views}</td>
                    <td className="py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{t.lead_count}</span></td>
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
