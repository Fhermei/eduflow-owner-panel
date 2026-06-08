// owner_panel/frontend/src/pages/SchoolsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolsApi } from '../api';
import { toast } from 'react-hot-toast';
import { Plus, Search, RefreshCw, Eye, Edit, Archive, RotateCcw, Database, Loader2 } from 'lucide-react';

export default function SchoolsList() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const response = await schoolsApi.list();
      setSchools(response.data.schools || []);
    } catch (error) {
      console.error('Failed to load schools:', error);
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSchool = async (schoolId) => {
    setSyncing(schoolId);
    toast.loading(`Syncing school...`, { id: `sync-${schoolId}` });
    try {
      const response = await schoolsApi.sync(schoolId);
      // Update the school in the list
      setSchools(prev => prev.map(school => 
        school.id === schoolId 
          ? { ...school, ...response.data.school, metrics: response.data.school.metrics }
          : school
      ));
      toast.success(`School synced successfully`, { id: `sync-${schoolId}` });
    } catch (error) {
      toast.error('Failed to sync school', { id: `sync-${schoolId}` });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAllSchools = async () => {
    setSyncingAll(true);
    toast.loading('Syncing all schools...', { id: 'sync-all' });
    try {
      const response = await schoolsApi.syncAll();
      
      // Update all schools with new data
      if (response.data.schools) {
        setSchools(response.data.schools);
      }
      
      toast.success(response.data.message || 'All schools synced successfully', { id: 'sync-all' });
      
      // Also refresh the dashboard stats if needed
      window.dispatchEvent(new Event('schoolsSynced'));
      
    } catch (error) {
      console.error('Sync all failed:', error);
      toast.error('Failed to sync all schools', { id: 'sync-all' });
    } finally {
      setSyncingAll(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(search.toLowerCase()) ||
    school.school_id.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = schools.reduce((sum, s) => sum + (s.metrics?.total_students || 0), 0);
  const totalRevenue = schools.reduce((sum, s) => sum + (s.metrics?.total_revenue || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Schools</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all registered schools in the system
          </p>
        </div>
        <Link
          to="/schools/add"
          className="flex items-center gap-2 px-4 py-2 bg-[#D94801] text-white rounded-xl hover:bg-[#C24000] transition-colors"
        >
          <Plus size={16} /> Add New School
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-800">{schools.length}</p>
          <p className="text-sm text-gray-500">Total Schools</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-800">{totalStudents.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-800">{schools.reduce((sum, s) => sum + (s.metrics?.total_staff || 0), 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Staff</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-800">₦{totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by school name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
          />
        </div>
        
        {/* Sync All Schools Button */}
        <button
          onClick={handleSyncAllSchools}
          disabled={syncingAll}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {syncingAll ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Database size={16} />
          )}
          {syncingAll ? 'Syncing...' : 'Sync All Schools'}
        </button>
        
        <button
          onClick={loadSchools}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D94801]" />
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No schools found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">School</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">School ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Students</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{school.name}</p>
                        <p className="text-xs text-gray-400">{school.api_url}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{school.school_id}</code>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        school.is_archived ? 'bg-gray-100 text-gray-600' :
                        school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {school.is_archived ? 'Archived' : school.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {school.metrics?.total_students?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-green-600">
                      ₦{school.metrics?.total_revenue?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/schools/${school.id}`}
                          className="p-1.5 text-gray-500 hover:text-[#D94801] hover:bg-orange-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleSyncSchool(school.id)}
                          disabled={syncing === school.id}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Sync Data"
                        >
                          {syncing === school.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                        </button>
                        {!school.is_archived ? (
                          <button
                            onClick={() => {/* Handle archive */}}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Archive"
                          >
                            <Archive size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {/* Handle restore */}}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Restore"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}