import React, { useState, useEffect } from 'react';
import { ownerApi } from '../api';
import { toast } from 'react-hot-toast';
import { 
  Users, Search, RefreshCw, UserCheck, UserX, Shield, 
  Lock, Unlock, Eye, ChevronLeft, ChevronRight,
  Mail, Phone, Calendar, Clock, AlertCircle, School
} from 'lucide-react';

const OwnerUsersList = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    loadUsers();
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const response = await ownerApi.getSchools();
      if (response.data.success) {
        setSchools(response.data.schools || []);
      }
    } catch (error) {
      console.error('Failed to load schools:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await ownerApi.getAllUsers();
      if (response.data.success) {
        setUsers(response.data.users || []);
      } else {
        toast.error(response.data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockUser = async (user) => {
    if (!window.confirm(`Unlock user "${user.full_name}" (${user.registration_number})?`)) return;
    
    try {
      const response = await ownerApi.unlockUserInSchool(user.registration_number, user.school_id);
      if (response.data.success) {
        toast.success(`User ${user.full_name} unlocked successfully`);
        loadUsers(); // Refresh the list
      } else {
        toast.error(response.data.error || 'Failed to unlock user');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      toast.error(error.response?.data?.error || 'Failed to unlock user');
    }
  };

  const filteredUsers = users.filter(user => {
    if (selectedSchool !== 'all' && user.school_id !== selectedSchool) return false;
    if (selectedRole !== 'all' && user.role !== selectedRole) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (user.full_name || '').toLowerCase().includes(search) ||
        (user.registration_number || '').toLowerCase().includes(search) ||
        (user.email || '').toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const roleColors = {
    student: 'bg-blue-100 text-blue-700',
    teacher: 'bg-green-100 text-green-700',
    parent: 'bg-purple-100 text-purple-700',
    head: 'bg-red-100 text-red-700',
    hm: 'bg-red-100 text-red-700',
    principal: 'bg-orange-100 text-orange-700',
    vice_principal: 'bg-orange-100 text-orange-700',
    admin: 'bg-orange-100 text-orange-700',
    accountant: 'bg-cyan-100 text-cyan-700',
    secretary: 'bg-pink-100 text-pink-700',
    librarian: 'bg-indigo-100 text-indigo-700',
    laboratory: 'bg-teal-100 text-teal-700',
    security: 'bg-gray-100 text-gray-700',
    cleaner: 'bg-gray-100 text-gray-700',
  };

  const getRoleColor = (role) => roleColors[role] || 'bg-gray-100 text-gray-700';
  const getRoleDisplay = (role) => {
    const roleMap = {
      head: 'Head of School',
      hm: 'Head Master',
      principal: 'Principal',
      vice_principal: 'Vice Principal',
      student: 'Student',
      teacher: 'Teacher',
      parent: 'Parent',
      accountant: 'Accountant',
      secretary: 'Secretary',
      librarian: 'Librarian',
      laboratory: 'Lab Technician',
      security: 'Security',
      cleaner: 'Cleaner',
    };
    return roleMap[role] || role || 'Unknown';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-[#D94801] mx-auto mb-4" />
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  // Get unique schools for filter
  const uniqueSchools = [...new Map(users.map(user => [user.school_id, { id: user.school_id, name: user.school_name }])).values()];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-[#D94801]" />
            All Users
          </h1>
          <p className="text-gray-500 text-sm mt-1">View all users across all schools</p>
        </div>
        <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-xs text-gray-400">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-2xl font-bold">{roleCounts.student || 0}</p>
          <p className="text-xs text-gray-400">Students</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-2xl font-bold">{(roleCounts.teacher || 0) + (roleCounts.form_teacher || 0) + (roleCounts.subject_teacher || 0)}</p>
          <p className="text-xs text-gray-400">Teachers</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-2xl font-bold">{roleCounts.parent || 0}</p>
          <p className="text-xs text-gray-400">Parents</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-2xl font-bold">{roleCounts.head || roleCounts.hm || roleCounts.principal || 0}</p>
          <p className="text-xs text-gray-400">Admins</p>
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
                placeholder="Search by name, registration number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#D94801] focus:outline-none"
              />
            </div>
          </div>
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#D94801] focus:outline-none"
          >
            <option value="all">All Schools</option>
            {uniqueSchools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#D94801] focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="parent">Parents</option>
            <option value="head">Head/Admin</option>
            <option value="accountant">Accountants</option>
            <option value="secretary">Secretaries</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">School</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Security</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((user, idx) => (
                <tr key={`${user.school_id}-${user.registration_number}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{user.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{user.registration_number}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{user.school_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleDisplay(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {user.email}</p>}
                    {user.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={10} /> {user.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          <UserCheck size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                          <UserX size={10} /> Inactive
                        </span>
                      )}
                      {user.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          <Shield size={10} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          <AlertCircle size={10} /> Unverified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {user.is_locked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                          <Lock size={10} /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          <Unlock size={10} /> Unlocked
                        </span>
                      )}
                      {user.failed_attempts > 0 && (
                        <span className="text-xs text-orange-600">{user.failed_attempts} failed attempts</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.is_locked && (
                      <button
                        onClick={() => handleUnlockUser(user)}
                        className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="Unlock User"
                      >
                        <Unlock size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No users found</p>
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
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show limited pages
                if (totalPages > 5 && pageNum > 3 && pageNum < totalPages - 1 && pageNum !== currentPage && Math.abs(currentPage - pageNum) > 1) {
                  if (pageNum === 4 && currentPage > 3) {
                    return <span key={pageNum} className="px-2 py-1 text-gray-400">...</span>;
                  }
                  return null;
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
    </div>
  );
};

export default OwnerUsersList;