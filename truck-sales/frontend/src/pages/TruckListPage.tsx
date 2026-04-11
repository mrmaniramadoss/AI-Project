import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Fuel, Weight, Calendar, MapPin, Eye } from 'lucide-react';
import api from '../services/api';

interface Truck {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuel_type: string;
  load_capacity: number;
  condition: string;
  availability: string;
  location: string;
  image_urls: string[];
  views: number;
  dealer_name: string;
  dealer_company: string;
}

export default function TruckListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    condition: searchParams.get('condition') || '',
    price_min: searchParams.get('price_min') || '',
    price_max: searchParams.get('price_max') || '',
    load_min: searchParams.get('load_min') || '',
    load_max: searchParams.get('load_max') || '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    api.get('/trucks/brands').then(res => setBrands(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTrucks();
  }, [page]);

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: '12' };
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });
      const res = await api.get('/trucks', { params });
      setTrucks(res.data.items);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params);
    fetchTrucks();
  };

  const totalPages = Math.ceil(total / 12);

  const defaultImg = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Search trucks by brand, model..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
            Search
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select value={filters.brand} onChange={e => setFilters(f => ({ ...f, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">All Brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
              <select value={filters.fuel_type} onChange={e => setFilters(f => ({ ...f, fuel_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">All</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="cng">CNG</option>
                <option value="petrol">Petrol</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select value={filters.condition} onChange={e => setFilters(f => ({ ...f, condition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">All</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="certified">Certified</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select value={filters.sort_by} onChange={e => setFilters(f => ({ ...f, sort_by: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="created_at">Newest</option>
                <option value="price">Price</option>
                <option value="year">Year</option>
                <option value="views">Popular</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price ($)</label>
              <input type="number" value={filters.price_min} onChange={e => setFilters(f => ({ ...f, price_min: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price ($)</label>
              <input type="number" value={filters.price_max} onChange={e => setFilters(f => ({ ...f, price_max: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Any" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Load (tons)</label>
              <input type="number" value={filters.load_min} onChange={e => setFilters(f => ({ ...f, load_min: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Load (tons)</label>
              <input type="number" value={filters.load_max} onChange={e => setFilters(f => ({ ...f, load_max: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Any" />
            </div>
          </div>
        )}
      </form>

      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">{total} truck{total !== 1 ? 's' : ''} found</p>
      </div>

      {/* Truck Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : trucks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No trucks found</p>
          <p className="text-gray-400 mt-2">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trucks.map(truck => (
            <Link key={truck.id} to={`/trucks/${truck.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={truck.image_urls?.[0] || defaultImg}
                  alt={`${truck.brand} ${truck.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).src = defaultImg; }}
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    truck.availability === 'available' ? 'bg-green-100 text-green-700' :
                    truck.availability === 'sold' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{truck.availability}</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{truck.condition}</span>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                  <Eye className="w-3 h-3" /> {truck.views}
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{truck.brand} {truck.model}</h3>
                    <p className="text-sm text-gray-500">{truck.dealer_company || truck.dealer_name}</p>
                  </div>
                  <span className="text-xl font-bold text-blue-600">${truck.price.toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{truck.year}</span>
                  <span className="flex items-center gap-1"><Fuel className="w-4 h-4" />{truck.fuel_type}</span>
                  <span className="flex items-center gap-1"><Weight className="w-4 h-4" />{truck.load_capacity}t</span>
                  {truck.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{truck.location}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
