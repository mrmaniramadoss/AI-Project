import { Link } from 'react-router-dom';
import { Truck, Search, Shield, MessageSquare, BarChart3, Zap, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect <span className="text-yellow-400">Truck</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            The leading platform for buying and selling commercial trucks. Connect with trusted dealers, get real-time updates, and find the best deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/trucks"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors">
              <Search className="w-5 h-5" /> Browse Trucks
            </Link>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-yellow-400 text-blue-900 px-8 py-3 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose TruckSales?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: 'Advanced Search', desc: 'Filter by brand, price, fuel type, load capacity, and more to find exactly what you need.' },
              { icon: Zap, title: 'Real-Time Updates', desc: 'Get instant notifications when new trucks match your criteria or when inventory changes.' },
              { icon: MessageSquare, title: 'Live Chat', desc: 'Connect directly with dealers through our built-in messaging system.' },
              { icon: Shield, title: 'Trusted Dealers', desc: 'All dealers are verified. View ratings, reviews, and company information.' },
              { icon: BarChart3, title: 'Market Analytics', desc: 'Access sales trends, pricing data, and market insights to make informed decisions.' },
              { icon: Truck, title: 'AI Recommendations', desc: 'Our smart system learns your preferences and suggests trucks you\'ll love.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join thousands of buyers and dealers on the most trusted truck marketplace.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?role=customer"
              className="bg-white text-blue-700 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
              I'm a Buyer
            </Link>
            <Link to="/register?role=dealer"
              className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-xl font-bold hover:bg-yellow-300 transition-colors">
              I'm a Dealer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Truck className="w-6 h-6" /> TruckSales
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} TruckSales. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
