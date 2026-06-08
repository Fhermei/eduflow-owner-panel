import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Shield, AlertCircle, Lock, Unlock, UserX, UserCheck,
  Eye, EyeOff, RefreshCw, Search, Filter, ChevronLeft,
  ChevronRight, Download, Clock, Server, Activity,
  Wifi, WifiOff, Zap, BarChart3, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Loader2, Users, UserPlus, UserMinus,
  FileText, CreditCard, GraduationCap, Briefcase, Megaphone
} from 'lucide-react';
import { ownerApi, schoolsApi } from '../api';

const SecurityMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [failedLogins, setFailedLogins] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch schools list
      const schoolsRes = await schoolsApi.list();
      const schoolsData = schoolsRes.data.schools || [];
      setSchools(schoolsData);
      
      // Fetch failed logins
      const failedRes = await ownerApi.getAllFailedLogins();
      if (failedRes.data.success) {
        setFailedLogins(failedRes.data.failed_attempts || []);
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockUser = (user) => {
    // Make sure we have the correct data
    if (!user.registration_number || !user.school_id) {
      toast.error('Missing user information for unlock');
      return;
    }
    setSelectedUser(user);
    setShowUnlockModal(true);
  };


  const confirmUnlockUser = async () => {
    if (!selectedUser) return;
    
    try {
      setUnlocking(true);
      console.log('Unlocking user:', {
        registration_number: selectedUser.registration_number,
        school_id: selectedUser.school_id
      });
      
      // Use the correct API call
      const response = await ownerApi.unlockUserInSchool(
        selectedUser.registration_number, 
        selectedUser.school_id
      );
      
      if (response.data.success) {
        toast.success(response.data.message || 'User unlocked successfully');
        // Refresh the data
        await loadData();
      } else {
        toast.error(response.data.error || 'Failed to unlock user');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to unlock user';
      toast.error(errorMsg);
    } finally {
      setUnlocking(false);
      setShowUnlockModal(false);
      setSelectedUser(null);
    }
  };

  // Filter failed logins
  const filteredLogins = failedLogins.filter(login => {
    if (selectedSchool !== 'all' && login.school_id !== selectedSchool) {
      return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (login.user_name || '').toLowerCase().includes(search) ||
        (login.registration_number || '').toLowerCase().includes(search) ||
        (login.ip_address || '').toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogins.length / itemsPerPage);
  const paginatedLogins = filteredLogins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const totalFailed = failedLogins.reduce((sum, l) => sum + (l.failed_count || 1), 0);
  const uniqueUsers = new Set(failedLogins.map(l => l.registration_number)).size;
  const uniqueSchools = new Set(failedLogins.map(l => l.school_name)).size;

  if (loading && failedLogins.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-[#D94801] mx-auto mb-4" />
          <p className="text-gray-400">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield size={24} className="text-[#D94801]" />
            Security Monitor
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitor suspicious activity and failed login attempts across all schools</p>
        </div>
        <button 
          onClick={loadData} 
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalFailed}</p>
              <p className="text-xs text-gray-400">Total Failed Attempts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{uniqueUsers}</p>
              <p className="text-xs text-gray-400">Affected Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Server size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{uniqueSchools}</p>
              <p className="text-xs text-gray-400">Schools Affected</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Lock size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {failedLogins.filter(l => l.is_locked).length}
              </p>
              <p className="text-xs text-gray-400">Locked Accounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by user name, registration number, or IP..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
              />
            </div>
          </div>
          <select
            value={selectedSchool}
            onChange={(e) => {
              setSelectedSchool(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
          >
            <option value="all">All Schools</option>
            {schools.map(school => (
              <option key={school.id} value={school.school_id}>{school.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Failed Logins Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            Suspicious Login Attempts
            <span className="text-xs text-gray-400 ml-2">({filteredLogins.length} attempts)</span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">School</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Failed Attempts</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Last Attempt</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLogins.map((login, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{login.user_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{login.registration_number}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{login.school_name}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                      {login.failed_count || 1}
                    </span>
                   </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-gray-600">{login.ip_address || 'Unknown'}</span>
                   </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {login.latest_attempt ? new Date(login.latest_attempt).toLocaleString() : 'N/A'}
                    </span>
                   </td>
                  <td className="px-4 py-3 text-center">
                    {login.is_locked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        <Lock size={10} /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        <AlertCircle size={10} /> Suspicious
                      </span>
                    )}
                   </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleUnlockUser(login)}
                      className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                      title="Unlock User"
                      disabled={!login.is_locked}
                    >
                      <Unlock size={16} />
                    </button>
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
        
        {filteredLogins.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
            <p className="text-gray-400">No suspicious activity detected</p>
            <p className="text-xs text-gray-300 mt-1">All systems secure</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#D94801] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="mt-6 bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800">Security Recommendations</h4>
            <p className="text-sm text-blue-700 mt-1">
              Users with 5 or more failed login attempts are automatically locked for 24 hours.
              You can unlock them manually using the unlock button above.
              Consider implementing two-factor authentication for admin accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Unlock User Modal */}
      {showUnlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Unlock size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Unlock User Account</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to unlock <strong>{selectedUser.user_name}</strong>?
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Registration Number: {selectedUser.registration_number}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnlockModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnlockUser}
                disabled={unlocking}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {unlocking && <RefreshCw size={14} className="animate-spin" />}
                {unlocking ? 'Unlocking...' : 'Unlock User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMonitor;