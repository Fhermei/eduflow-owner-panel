import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  RefreshCw, School, Users, GraduationCap, Briefcase, DollarSign,
  Activity, Server, CheckCircle, XCircle, AlertCircle, TrendingUp,
  TrendingDown, Clock, Calendar, Eye, EyeOff, Lock, Unlock,
  LogOut, UserX, UserCheck, Shield, BarChart3, PieChart,
  ArrowUp, ArrowDown, Menu, X, Filter, Search, Download,
  ChevronLeft, ChevronRight, Grid3x3, List, UserPlus, UserMinus,
  FileText, CreditCard, Building2, Globe, Wifi, WifiOff, Zap
} from 'lucide-react';
import { ownerApi } from '../api';

const OwnerComprehensiveDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolActivities, setSchoolActivities] = useState({});
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('all');

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await ownerApi.getComprehensiveDashboard();
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolActivities = async (schoolId) => {
    try {
      const response = await ownerApi.getPerSchoolActivity(schoolId);
      if (response.data.success) {
        setSchoolActivities(prev => ({
          ...prev,
          [schoolId]: response.data
        }));
        setSelectedSchool(response.data.school);
        setShowSchoolModal(true);
      }
    } catch (error) {
      toast.error('Failed to load school activities');
    }
  };

  const handleForceLogoutSchool = async (schoolId, schoolName) => {
    if (!window.confirm(`Are you sure you want to force logout ALL users from ${schoolName}?`)) return;
    
    try {
      await ownerApi.forceLogoutSchool(schoolId);
      toast.success(`All users logged out from ${schoolName}`);
      loadDashboard();
    } catch (error) {
      toast.error('Failed to force logout');
    }
  };

  const handleArchiveUser = async (schoolId, registrationNumber, userName) => {
    if (!window.confirm(`Archive user ${userName} (${registrationNumber})?`)) return;
    
    try {
      await ownerApi.manageSchoolUser(schoolId, registrationNumber, 'archive');
      toast.success(`User ${userName} archived`);
    } catch (error) {
      toast.error('Failed to archive user');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || 0;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-[#D94801] mx-auto mb-4" />
          <p className="text-gray-400">Loading comprehensive analytics...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const schools = data?.schools || [];
  const dailyTrends = data?.daily_trends || [];
  const topSchools = data?.top_schools || {};
  const activitiesBySchool = data?.activities_by_school || {};
  const systemHealth = data?.system_health || {};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'activities', label: 'Activities', icon: Clock },
    { id: 'health', label: 'System Health', icon: Server },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Owner Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Complete system overview across all schools</p>
        </div>
        <button 
          onClick={loadDashboard} 
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <School size={16} />
            <span className="text-xs font-medium">Total Schools</span>
          </div>
          <p className="text-2xl font-bold">{summary.total_schools || 0}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-green-600">✓ {summary.healthy_servers || 0} healthy</span>
            <span className="text-xs text-red-600">✗ {summary.down_servers || 0} down</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Users size={16} />
            <span className="text-xs font-medium">Total Users</span>
          </div>
          <p className="text-2xl font-bold">{formatNumber(summary.total_users)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatNumber(summary.total_students)} students</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <DollarSign size={16} />
            <span className="text-xs font-medium">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_revenue)}</p>
          <p className="text-xs text-gray-400 mt-1">Portal: {formatCurrency(summary.portal_revenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Activity size={16} />
            <span className="text-xs font-medium">Health Score</span>
          </div>
          <p className="text-2xl font-bold">{summary.health_percentage || 0}%</p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${summary.health_percentage || 0}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-[#D94801] border-b-2 border-[#D94801]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Schools Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <GraduationCap size={16} /> Top 5 by Students
              </h3>
              <div className="space-y-2">
                {topSchools.by_students?.map((school, idx) => (
                  <div key={school.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                       onClick={() => loadSchoolActivities(school.id)}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>{idx + 1}</span>
                      <span className="text-sm font-medium">{school.name}</span>
                    </div>
                    <span className="text-sm font-bold">{formatNumber(school.metrics?.total_students)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <DollarSign size={16} /> Top 5 by Revenue
              </h3>
              <div className="space-y-2">
                {topSchools.by_revenue?.map((school, idx) => (
                  <div key={school.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                       onClick={() => loadSchoolActivities(school.id)}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>{idx + 1}</span>
                      <span className="text-sm font-medium">{school.name}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(school.metrics?.total_revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard size={16} /> Top 5 by Portal Paid
              </h3>
              <div className="space-y-2">
                {topSchools.by_portal_paid?.map((school, idx) => (
                  <div key={school.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                       onClick={() => loadSchoolActivities(school.id)}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>{idx + 1}</span>
                      <span className="text-sm font-medium">{school.name}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{formatNumber(school.metrics?.portal_paid_count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Server size={16} /> System Health
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">CPU Usage</span>
                  <span className="text-xs font-medium">{systemHealth.cpu_percent || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${systemHealth.cpu_percent || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">Memory Usage</span>
                  <span className="text-xs font-medium">{systemHealth.memory_percent || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${systemHealth.memory_percent || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">Disk Usage</span>
                  <span className="text-xs font-medium">{systemHealth.disk_percent || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${systemHealth.disk_percent || 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHOOLS TAB */}
      {activeTab === 'schools' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">School</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">Students</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">Staff</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">Portal Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{school.name}</p>
                        <p className="text-xs text-gray-400">{school.school_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatNumber(school.metrics?.total_students)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(school.metrics?.total_staff)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(school.metrics?.total_revenue)}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatNumber(school.metrics?.portal_paid_count)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        school.metrics?.health_status === 'healthy' ? 'bg-green-100 text-green-700' :
                        school.metrics?.health_status === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {school.metrics?.health_status === 'healthy' && <CheckCircle size={10} />}
                        {school.metrics?.health_status === 'down' && <XCircle size={10} />}
                        {school.metrics?.health_status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => loadSchoolActivities(school.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleForceLogoutSchool(school.id, school.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Force Logout All"
                        >
                          <LogOut size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {schools.length === 0 && (
            <div className="text-center py-8">
              <School size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">No schools found</p>
            </div>
          )}
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'trends' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Daily Trends (Last 30 Days)</h3>
          <div className="space-y-3">
            {dailyTrends.slice(-10).map((day, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-24 flex-shrink-0">
                  <span className="text-xs text-gray-500">{day.date}</span>
                </div>
                <div className="flex-1">
                  <div className="flex gap-1">
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (day.total_users / (summary.total_users || 1)) * 100)}%` }} />
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (day.total_students / (summary.total_students || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-xs font-medium">{formatNumber(day.total_logins)} logins</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          {Object.entries(activitiesBySchool).map(([schoolName, activities]) => (
            <div key={schoolName} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Building2 size={16} /> {schoolName}
                  <span className="text-xs text-gray-400 ml-2">{activities.length} activities</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {activities.slice(0, 10).map((activity, idx) => (
                  <div key={idx} className="px-4 py-2 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-700">{activity.description}</p>
                        <p className="text-xs text-gray-400">{activity.time_ago}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activity.action === 'login' ? 'bg-green-100 text-green-700' :
                        activity.action === 'sync' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SYSTEM HEALTH TAB */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Resource Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">CPU Usage</span>
                  <span className="text-sm font-medium">{systemHealth.cpu_percent || 0}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${systemHealth.cpu_percent || 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="text-sm font-medium">{systemHealth.memory_percent || 0}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${systemHealth.memory_percent || 0}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {systemHealth.memory_used_gb?.toFixed(1) || 0} GB / {systemHealth.memory_total_gb?.toFixed(1) || 0} GB
                </p>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Disk Usage</span>
                  <span className="text-sm font-medium">{systemHealth.disk_percent || 0}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${systemHealth.disk_percent || 0}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {systemHealth.disk_free_gb?.toFixed(1) || 0} GB free / {systemHealth.disk_total_gb?.toFixed(1) || 0} GB total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Server Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{summary.healthy_servers || 0}</p>
                <p className="text-xs text-gray-500">Healthy Servers</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <XCircle size={24} className="mx-auto text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-600">{summary.down_servers || 0}</p>
                <p className="text-xs text-gray-500">Down Servers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* School Details Modal */}
      {showSchoolModal && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selectedSchool.name}</h2>
                <p className="text-xs text-gray-400">{selectedSchool.school_id}</p>
              </div>
              <button onClick={() => setShowSchoolModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* School Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{formatNumber(schoolActivities[selectedSchool.id]?.metrics?.total_students)}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(schoolActivities[selectedSchool.id]?.metrics?.total_revenue)}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>

              {/* Recent Activities */}
              <h3 className="font-semibold text-gray-800 mb-2">Recent Activities</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {schoolActivities[selectedSchool.id]?.activities?.slice(0, 20).map((activity, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-700">{activity.description}</p>
                      <span className="text-xs text-gray-400">{activity.time_ago}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">By: {activity.user || 'System'}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => handleForceLogoutSchool(selectedSchool.id, selectedSchool.name)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
                Force Logout All
              </button>
              <button onClick={() => setShowSchoolModal(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerComprehensiveDashboard;