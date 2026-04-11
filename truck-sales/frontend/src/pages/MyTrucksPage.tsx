import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import api from '../services/api';

interface Truck {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  availability: string;
  views: number;
  image_urls: string[];
  created_at: string;
}

export default function MyTrucksPage() {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    try {
      const res = await api.get('/trucks?per_page=50');
      setTrucks(res.data.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/trucks/${id}`);
      setTrucks(trucks.filter(t => t.id !== id));
    } catch {
      alert('Failed to delete truck');
    }
  };

  const defaultImg = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=200&h=150&fit=crop';

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Truck Listings</h1>
        <Link to="/my-trucks/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add New Truck
        </Link>
      </div>

      {trucks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <p className="text-gray-500 text-lg mb-4">No truck listings yet</p>
          <Link to="/my-trucks/new" className="text-blue-600 hover:underline">Add your first truck</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {trucks.map(truck => (
            <div key={truck.id} className="bg-white rounded-xl shadow p-4 flex gap-4 items-center">
              <img src={truck.image_urls?.[0] || defaultImg} alt="" className="w-24 h-18 rounded-lg object-cover flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = defaultImg; }} />
              <div className="flex-1 min-w-0">
                <Link to={`/trucks/${truck.id}`} className="font-bold text-lg hover:text-blue-600">{truck.brand} {truck.model}</Link>
                <div className="flex gap-4 text-sm text-gray-500 mt-1">
                  <span>{truck.year}</span>
                  <span className="font-medium text-blue-600">${truck.price.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    truck.availability === 'available' ? 'bg-green-100 text-green-700' :
                    truck.availability === 'sold' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{truck.availability}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{truck.views}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => navigate(`/my-trucks/edit/${truck.id}`)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(truck.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
