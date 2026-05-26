import React, { useState, useEffect } from 'react';
import { schoolsApi } from '../api';
import { toast } from 'react-hot-toast';
import { RefreshCw, Users, GraduationCap, DollarSign, Activity, School, TrendingUp, TrendingDown } from 'lucide-react';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [summary, setSummary] = useState({
    total_schools: 0,
    total_users: 0,
    total_students: 0,
    total_staff: 0,
    total_revenue: 0,
    healthy_servers: 0,
    down_servers: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const statsRes = await schoolsApi.getAllStats();
      if (statsRes.data.success) {
        setSummary(statsRes.data.summary);
        setSchools(statsRes.data.schools || []);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-[#D94801] mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">System-wide analytics and insights</p>
        </div>
        <button onClick={loadAnalytics} className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <School size={16} />
            <span className="text-xs font-medium">Total Schools</span>
          </div>
          <p className="text-2xl font-bold">{summary.total_schools}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Users size={16} />
            <span className="text-xs font-medium">Total Users</span>
          </div>
          <p className="text-2xl font-bold">{summary.total_users?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <DollarSign size={16} />
            <span className="text-xs font-medium">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-600">₦{summary.total_revenue?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Activity size={16} />
            <span className="text-xs font-medium">Health Score</span>
          </div>
          <p className="text-2xl font-bold">{summary.total_schools > 0 ? Math.round((summary.healthy_servers / summary.total_schools) * 100) : 0}%</p>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">School Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500">School</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Students</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Staff</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{school.name}</p>
                    <p className="text-xs text-gray-400">{school.school_id}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{school.metrics?.total_students?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4 text-right">{school.metrics?.total_staff?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">₦{school.metrics?.total_revenue?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      school.metrics?.health_status === 'healthy' ? 'bg-green-100 text-green-700' :
                      school.metrics?.health_status === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {school.metrics?.health_status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}