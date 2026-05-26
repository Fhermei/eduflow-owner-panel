import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolsApi } from '../api';
import { toast } from 'react-hot-toast';

// All icons defined as components
const IconSchool = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconArchive = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>
  </svg>
);

const IconRotateCcw = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10"/><path d="M3.51 15A9 9 0 0 0 18.36 18.36L23 14"/>
  </svg>
);

export default function SchoolsList() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchools();
  }, [statusFilter]);

  const loadSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { status: statusFilter };
      if (searchTerm) params.search = searchTerm;
      
      const response = await schoolsApi.list(params);
      setSchools(response.data.schools || []);
    } catch (error) {
      console.error('Failed to load schools:', error);
      setError(error.message || 'Failed to load schools');
      toast.error('Failed to load schools. Make sure the backend is running on port 8005');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id, name) => {
    if (confirm(`Archive "${name}"? This will deactivate the school.`)) {
      try {
        await schoolsApi.archive(id, 'Archived by admin');
        toast.success(`School "${name}" archived`);
        loadSchools();
      } catch (error) {
        toast.error('Failed to archive school');
      }
    }
  };

  const handleRestore = async (id, name) => {
    try {
      await schoolsApi.restore(id);
      toast.success(`School "${name}" restored`);
      loadSchools();
    } catch (error) {
      toast.error('Failed to restore school');
    }
  };

  const getStatusBadge = (school) => {
    if (school.is_archived) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Archived</span>;
    if (school.is_active) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Inactive</span>;
  };

  const filteredSchools = schools.filter(school => 
    school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.school_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show connection error if backend is not running
  if (error && error.includes('ERR_CONNECTION_REFUSED')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Backend Not Running</h3>
          <p className="text-gray-500 mb-4">Cannot connect to the owner panel backend. Please make sure the Django server is running on port 8005.</p>
          <button onClick={loadSchools} className="bg-[#D94801] text-white px-5 py-2 rounded-xl hover:bg-[#C24000] transition-colors">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading && schools.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D94801] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Schools</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all registered schools in the system</p>
        </div>
        <Link to="/schools/add" className="bg-[#D94801] text-white px-4 py-2 rounded-xl hover:bg-[#C24000] transition-colors flex items-center gap-2 text-sm">
          <IconPlus /> Add New School
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Search by school name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94801] text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94801] text-sm w-full sm:w-48"
        >
          <option value="all">All Schools</option>
          <option value="active">Active Only</option>
          <option value="archived">Archived Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <button onClick={loadSchools} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm">
          <IconRefresh /> Refresh
        </button>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">School</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">School ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Students</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{school.name}</p>
                    <p className="text-xs text-gray-400">{school.api_url}</p>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{school.school_id}</code>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(school)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium">{school.metrics?.total_students?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-green-600">₦{school.metrics?.total_revenue?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`/schools/${school.id}`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                        <IconEye />
                      </Link>
                      {!school.is_archived ? (
                        <button onClick={() => handleArchive(school.id, school.name)} className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Archive">
                          <IconArchive />
                        </button>
                      ) : (
                        <button onClick={() => handleRestore(school.id, school.name)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Restore">
                          <IconRotateCcw />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSchools.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconSchool />
            </div>
            <p className="text-gray-400">No schools found</p>
            <Link to="/schools/add" className="inline-block mt-4 bg-[#D94801] text-white px-4 py-2 rounded-xl hover:bg-[#C24000] transition-colors text-sm">
              Add Your First School
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}