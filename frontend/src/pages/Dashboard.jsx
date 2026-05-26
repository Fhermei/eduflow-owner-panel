import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolsApi, analyticsApi } from '../api';
import { toast } from 'react-hot-toast';

// Simple SVG icons (no external dependencies)
const IconSchool = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_schools: 0,
    total_users: 0,
    total_students: 0,
    total_staff: 0,
    total_parents: 0,
    total_admins: 0,
    total_revenue: 0,
    portal_fee_revenue: 0,
    healthy_servers: 0,
    down_servers: 0,
    server_health_percentage: 0,
  });
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const statsRes = await schoolsApi.getAllStats();
      
      if (statsRes.data.success) {
        const summary = statsRes.data.summary;
        setStats({
          total_schools: summary.total_schools || 0,
          total_users: summary.total_users || 0,
          total_students: summary.total_students || 0,
          total_staff: summary.total_staff || 0,
          total_parents: summary.total_parents || 0,
          total_admins: summary.total_admins || 0,
          total_revenue: summary.total_revenue || 0,
          portal_fee_revenue: summary.portal_fee_revenue || 0,
          healthy_servers: summary.healthy_servers || 0,
          down_servers: summary.down_servers || 0,
          server_health_percentage: summary.total_schools > 0 
            ? Math.round((summary.healthy_servers / summary.total_schools) * 100) 
            : 0,
        });
        setSchools(statsRes.data.schools || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value }) => (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
      <p className="text-2xl font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D94801] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const healthPercentage = stats.total_schools > 0 ? Math.round((stats.healthy_servers / stats.total_schools) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Owner Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all schools in the system</p>
        </div>
        <button onClick={loadDashboard} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
          <IconRefresh /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Schools" value={stats.total_schools} />
        <StatCard title="Total Students" value={stats.total_students} />
        <StatCard title="Total Staff" value={stats.total_staff} />
        <StatCard title="Total Revenue" value={`₦${stats.total_revenue.toLocaleString()}`} />
      </div>

      {/* Server Health Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">Server Health Overview</h3>
          <Link to="/health" className="text-sm text-[#D94801] hover:underline">View Details →</Link>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${healthPercentage}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>✅ {stats.healthy_servers} Healthy</span>
          <span>❌ {stats.down_servers} Down</span>
          <span>🏫 {stats.total_schools} Total</span>
        </div>
      </div>

      {/* Recent Schools */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Schools</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {schools.slice(0, 5).map((school) => (
            <Link key={school.id} to={`/schools/${school.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{school.name}</p>
                  <p className="text-xs text-gray-400">{school.school_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{school.metrics?.total_students?.toLocaleString() || 0} students</p>
                  <p className="text-xs text-green-600">₦{school.metrics?.total_revenue?.toLocaleString() || 0}</p>
                </div>
              </div>
            </Link>
          ))}
          {schools.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No schools added yet</p>
              <Link to="/schools/add" className="inline-block mt-3 text-[#D94801] text-sm hover:underline">Add your first school →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}