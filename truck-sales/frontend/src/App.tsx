import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TruckListPage from './pages/TruckListPage';
import TruckDetailPage from './pages/TruckDetailPage';
import DashboardPage from './pages/DashboardPage';
import MyTrucksPage from './pages/MyTrucksPage';
import TruckFormPage from './pages/TruckFormPage';
import LeadsPage from './pages/LeadsPage';
import BookingsPage from './pages/BookingsPage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<><Navbar /><HomePage /></>} />
            <Route path="/trucks" element={<><Navbar /><TruckListPage /></>} />
            <Route path="/trucks/:id" element={<><Navbar /><TruckDetailPage /></>} />
            <Route path="/dashboard" element={<><Navbar /><ProtectedRoute><DashboardPage /></ProtectedRoute></>} />
            <Route path="/my-trucks" element={<><Navbar /><ProtectedRoute roles={['dealer', 'admin']}><MyTrucksPage /></ProtectedRoute></>} />
            <Route path="/my-trucks/new" element={<><Navbar /><ProtectedRoute roles={['dealer', 'admin']}><TruckFormPage /></ProtectedRoute></>} />
            <Route path="/my-trucks/edit/:id" element={<><Navbar /><ProtectedRoute roles={['dealer', 'admin']}><TruckFormPage /></ProtectedRoute></>} />
            <Route path="/leads" element={<><Navbar /><ProtectedRoute><LeadsPage /></ProtectedRoute></>} />
            <Route path="/bookings" element={<><Navbar /><ProtectedRoute><BookingsPage /></ProtectedRoute></>} />
            <Route path="/chat" element={<><Navbar /><ProtectedRoute><ChatPage /></ProtectedRoute></>} />
            <Route path="/notifications" element={<><Navbar /><ProtectedRoute><NotificationsPage /></ProtectedRoute></>} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
