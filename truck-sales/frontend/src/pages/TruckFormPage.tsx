import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../services/api';

export default function TruckFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    brand: '', model: '', year: new Date().getFullYear(), price: 0,
    description: '', fuel_type: 'diesel', load_capacity: 0, mileage: 0,
    engine_power: '', transmission: 'manual', body_type: '', color: '',
    condition: 'new', availability: 'available', location: '', image_urls: [''],
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/trucks/${id}`).then(res => {
        const t = res.data;
        setForm({
          brand: t.brand, model: t.model, year: t.year, price: t.price,
          description: t.description || '', fuel_type: t.fuel_type, load_capacity: t.load_capacity,
          mileage: t.mileage, engine_power: t.engine_power || '', transmission: t.transmission,
          body_type: t.body_type || '', color: t.color || '', condition: t.condition,
          availability: t.availability, location: t.location || '',
          image_urls: t.image_urls?.length ? t.image_urls : [''],
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const update = (field: string, value: string | number | string[]) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, image_urls: form.image_urls.filter(u => u.trim()) };
      if (isEdit) {
        await api.put(`/trucks/${id}`, payload);
      } else {
        await api.post('/trucks', payload);
      }
      navigate('/my-trucks');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="animate-pulse h-96 bg-gray-200 rounded-xl" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Truck' : 'Add New Truck'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
            <input type="text" value={form.brand} onChange={e => update('brand', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
            <input type="text" value={form.model} onChange={e => update('model', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
            <input type="number" value={form.year} onChange={e => update('year', Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required min={1990} max={2030} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
            <input type="number" value={form.price} onChange={e => update('price', Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required min={1} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Load Capacity (tons)</label>
            <input type="number" value={form.load_capacity} onChange={e => update('load_capacity', Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" min={0} step={0.1} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <select value={form.fuel_type} onChange={e => update('fuel_type', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="cng">CNG</option>
              <option value="petrol">Petrol</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
            <select value={form.transmission} onChange={e => update('transmission', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select value={form.condition} onChange={e => update('condition', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="certified">Certified</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Engine Power</label>
            <input type="text" value={form.engine_power} onChange={e => update('engine_power', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 500hp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input type="text" value={form.color} onChange={e => update('color', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={form.location} onChange={e => update('location', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
          <input type="number" value={form.mileage} onChange={e => update('mileage', Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" min={0} />
        </div>

        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select value={form.availability} onChange={e => update('availability', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URLs</label>
          {form.image_urls.map((url, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="url" value={url}
                onChange={e => {
                  const urls = [...form.image_urls];
                  urls[i] = e.target.value;
                  update('image_urls', urls);
                }}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
              {form.image_urls.length > 1 && (
                <button type="button" onClick={() => update('image_urls', form.image_urls.filter((_, j) => j !== i))}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">Remove</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => update('image_urls', [...form.image_urls, ''])}
            className="text-blue-600 text-sm hover:underline">+ Add another image</button>
        </div>

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          <Save className="w-5 h-5" /> {saving ? 'Saving...' : isEdit ? 'Update Truck' : 'Add Truck'}
        </button>
      </form>
    </div>
  );
}
