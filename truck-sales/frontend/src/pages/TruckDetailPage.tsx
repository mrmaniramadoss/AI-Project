import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Fuel, Weight, Calendar, MapPin, Gauge, Settings, Phone, Mail, MessageSquare, Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TruckDetail {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  description: string;
  fuel_type: string;
  load_capacity: number;
  mileage: number;
  engine_power: string;
  transmission: string;
  body_type: string;
  color: string;
  condition: string;
  availability: string;
  location: string;
  image_urls: string[];
  views: number;
  dealer_id: number;
  dealer_name: string;
  dealer_company: string;
  dealer_phone: string;
  dealer_email: string;
  created_at: string;
}

export default function TruckDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [truck, setTruck] = useState<TruckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => {
    api.get(`/trucks/${id}`).then(res => {
      setTruck(res.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  const handleInquiry = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setInquiryError('');
    try {
      await api.post('/leads', { truck_id: Number(id), message: inquiryMsg });
      setInquirySent(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setInquiryError(error.response?.data?.detail || 'Failed to send inquiry');
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!truck) return;
    try {
      await api.post('/bookings', { truck_id: truck.id });
      alert('Booking created! Check your bookings page.');
      navigate('/bookings');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || 'Booking failed');
    }
  };

  const defaultImg = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop';

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-96 bg-gray-200 rounded-xl" />
        <div className="h-6 bg-gray-200 rounded w-64" />
      </div>
    </div>
  );

  if (!truck) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 text-lg">Truck not found</p>
      <button onClick={() => navigate('/trucks')} className="mt-4 text-blue-600 hover:underline">Browse trucks</button>
    </div>
  );

  const images = truck.image_urls?.length ? truck.image_urls : [defaultImg];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <img
              src={images[selectedImg]}
              alt={`${truck.brand} ${truck.model}`}
              className="w-full h-80 md:h-96 object-cover"
              onError={e => { (e.target as HTMLImageElement).src = defaultImg; }}
            />
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)}
                    className={`w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${selectedImg === i ? 'border-blue-500' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = defaultImg; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{truck.brand} {truck.model}</h1>
                <p className="text-gray-500 mt-1">{truck.dealer_company || truck.dealer_name} &bull; {truck.location}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">${truck.price.toLocaleString()}</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  truck.availability === 'available' ? 'bg-green-100 text-green-700' :
                  truck.availability === 'sold' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{truck.availability}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Calendar, label: 'Year', value: truck.year },
                { icon: Fuel, label: 'Fuel', value: truck.fuel_type },
                { icon: Weight, label: 'Load Capacity', value: `${truck.load_capacity} tons` },
                { icon: Gauge, label: 'Mileage', value: `${truck.mileage} km` },
                { icon: Settings, label: 'Transmission', value: truck.transmission },
                { icon: Settings, label: 'Engine', value: truck.engine_power },
                { icon: MapPin, label: 'Location', value: truck.location || 'N/A' },
                { icon: Settings, label: 'Condition', value: truck.condition },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <item.icon className="w-4 h-4" /> {item.label}
                  </div>
                  <p className="font-medium capitalize">{item.value}</p>
                </div>
              ))}
            </div>

            {truck.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{truck.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dealer Info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Dealer Information</h3>
            <div className="space-y-3">
              <p className="font-medium text-gray-900">{truck.dealer_company || truck.dealer_name}</p>
              {truck.dealer_phone && (
                <a href={`tel:${truck.dealer_phone}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                  <Phone className="w-4 h-4" /> {truck.dealer_phone}
                </a>
              )}
              <a href={`mailto:${truck.dealer_email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                <Mail className="w-4 h-4" /> {truck.dealer_email}
              </a>
              {isAuthenticated && user?.role !== 'dealer' && (
                <button onClick={() => navigate(`/chat?user=${truck.dealer_id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                  <MessageSquare className="w-4 h-4" /> Chat with Dealer
                </button>
              )}
            </div>
          </div>

          {/* Inquiry Form */}
          {truck.availability === 'available' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-lg mb-4">Interested?</h3>
              {inquirySent ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
                  Inquiry sent! The dealer will contact you soon.
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={inquiryMsg}
                    onChange={e => setInquiryMsg(e.target.value)}
                    placeholder="I'm interested in this truck..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                  />
                  {inquiryError && <p className="text-red-600 text-sm">{inquiryError}</p>}
                  <button onClick={handleInquiry}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">
                    <Send className="w-4 h-4" /> Send Inquiry
                  </button>
                  <button onClick={handleBook}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium">
                    Book Now — ${truck.price.toLocaleString()}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
