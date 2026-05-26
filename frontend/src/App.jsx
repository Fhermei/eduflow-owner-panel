import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SchoolsList from './pages/SchoolsList';
import AddSchool from './pages/AddSchool';
import SchoolDetail from './pages/SchoolDetail';
import HealthMonitor from './pages/HealthMonitor';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { authApi } from './api';
import ComprehensiveAnalytics from './pages/ComprehensiveAnalytics';
import OwnerComprehensiveDashboard from './pages/OwnerComprehensiveDashboard';
import SecurityMonitor from './pages/SecurityMonitor';
import OwnerUsersList from './pages/OwnerUsersList';

// Login Component
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login(username, password);
      if (response.data.token) {
        localStorage.setItem('owner_access_token', response.data.token);
        localStorage.setItem('owner_user', JSON.stringify(response.data.user));
        toast.success('Login successful');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-[#D94801]">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">EduFlow Owner Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all schools from one dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94801] focus:border-transparent"
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94801] focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D94801] text-white py-2 rounded-xl hover:bg-[#C24000] transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('owner_access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Original Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="schools" element={<SchoolsList />} />
          <Route path="schools/add" element={<AddSchool />} />
          <Route path="schools/:id" element={<SchoolDetail />} />
          <Route path="health" element={<HealthMonitor />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Owner Routes */}
          <Route path="owner-dashboard" element={<OwnerComprehensiveDashboard />} />
          <Route path="owner-analytics" element={<OwnerComprehensiveDashboard />} />
          <Route path="owner-security" element={<SecurityMonitor />} />
          <Route path="owner-users" element={<OwnerUsersList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;