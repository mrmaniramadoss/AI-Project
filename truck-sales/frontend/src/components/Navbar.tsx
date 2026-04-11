import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Truck, Bell, MessageSquare, LogOut, User, LayoutDashboard, Search, FileText, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/notifications?unread_only=true&per_page=1').then(res => {
        setUnreadCount(res.data.unread || 0);
      }).catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = () => {
    const links = [
      { to: '/trucks', label: 'Browse Trucks', icon: Search, show: true },
    ];

    if (isAuthenticated && user) {
      links.push({ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true });

      if (user.role === 'dealer' || user.role === 'admin') {
        links.push({ to: '/my-trucks', label: 'My Listings', icon: Truck, show: true });
      }

      links.push(
        { to: '/leads', label: 'Inquiries', icon: FileText, show: true },
        { to: '/bookings', label: 'Bookings', icon: ShoppingCart, show: true },
        { to: '/chat', label: 'Chat', icon: MessageSquare, show: true },
      );
    }
    return links;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Truck className="w-7 h-7" />
            <span className="hidden sm:inline">TruckSales</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks().filter(l => l.show).map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to) ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative p-2 hover:bg-white/10 rounded-lg">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user?.full_name || user?.username}</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{user?.role}</span>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-white/10 text-sm font-medium">Login</Link>
                <Link to="/register" className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/20 mt-2 pt-2">
            {navLinks().filter(l => l.show).map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  isActive(link.to) ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/notifications" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10">
                  <Bell className="w-4 h-4" />
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10 w-full text-left">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
