import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Lead {
  id: number;
  truck_id: number;
  brand: string;
  model: string;
  truck_price: number;
  status: string;
  message: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  dealer_name: string;
  dealer_company: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  negotiating: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: '50' };
      if (filter) params.status = filter;
      const res = await api.get('/leads', { params });
      setLeads(res.data.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (leadId: number, status: string) => {
    try {
      await api.put(`/leads/${leadId}`, { status });
      fetchLeads();
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          {user?.role === 'customer' ? 'My Inquiries' : 'Lead Management'}
        </h1>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="negotiating">Negotiating</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No inquiries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/trucks/${lead.truck_id}`} className="font-bold text-lg hover:text-blue-600">
                    {lead.brand} {lead.model}
                  </Link>
                  <p className="text-blue-600 font-medium">${lead.truck_price?.toLocaleString()}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    {user?.role === 'dealer' || user?.role === 'admin' ? (
                      <p>Customer: <span className="font-medium">{lead.customer_name}</span> ({lead.customer_email})</p>
                    ) : (
                      <p>Dealer: <span className="font-medium">{lead.dealer_company || lead.dealer_name}</span></p>
                    )}
                  </div>
                  {lead.message && <p className="mt-2 text-sm text-gray-500 italic">"{lead.message}"</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[lead.status] || 'bg-gray-100'}`}>
                    {lead.status}
                  </span>
                  {(user?.role === 'dealer' || user?.role === 'admin') && (
                    <div className="relative group">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg hidden group-hover:block z-10 min-w-[140px]">
                        {['new', 'contacted', 'negotiating', 'converted', 'lost'].map(s => (
                          <button key={s} onClick={() => updateStatus(lead.id, s)}
                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 capitalize">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
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
