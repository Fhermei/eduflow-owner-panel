import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api';
import { toast } from 'react-hot-toast';
import {
  RefreshCw, TrendingUp, TrendingDown, Eye, EyeOff, Key,
  Users, GraduationCap, Briefcase, DollarSign, CreditCard,
  Activity, Server, CheckCircle, XCircle, AlertCircle,
  BarChart3, PieChart, Calendar, Clock, UserCheck, UserX
} from 'lucide-react';

export default function ComprehensiveAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const [comprehensive, portalFee, schoolFee, userActivity, apiHealth] = await Promise.all([
        analyticsApi.getComprehensive(),
        analyticsApi.getPortalFeeAnalytics(),
        analyticsApi.getSchoolFeeAnalytics(),
        analyticsApi.getUserActivity(),
        analyticsApi.getAPIServerHealth(),
      ]);
      
      setAnalytics({
        comprehensive: comprehensive.data,
        portalFee: portalFee.data,
        schoolFee: schoolFee.data,
        userActivity: userActivity.data,
        apiHealth: apiHealth.data,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyVisibility = (key) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
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

  const current = analytics?.comprehensive?.current || {};
  const paymentBreakdown = analytics?.comprehensive?.payment_breakdown || {};
  const schoolBreakdown = analytics?.comprehensive?.school_breakdown || [];
  const portalSummary = analytics?.portalFee?.summary || {};
  const portalSchools = analytics?.portalFee?.schools || [];
  const schoolFeeSummary = analytics?.schoolFee?.summary || {};
  const schoolFeeSchools = analytics?.schoolFee?.schools || [];
  const userActivity = analytics?.userActivity?.current || {};
  const activityLogs = analytics?.comprehensive?.recent_activities || [];
  const apiHealth = analytics?.apiHealth || {};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'portal-fee', label: 'Portal Fee', icon: CreditCard },
    { id: 'school-fee', label: 'School Fee', icon: DollarSign },
    { id: 'users', label: 'User Activity', icon: Users },
    { id: 'api-health', label: 'API Health', icon: Server },
    { id: 'logs', label: 'Activity Logs', icon: Clock },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Advanced Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Complete system insights and metrics</p>
        </div>
        <button onClick={loadAnalytics} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh All
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              selectedTab === tab.id
                ? 'text-[#D94801] border-b-2 border-[#D94801]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <School size={16} />
                <span className="text-xs font-medium">Total Schools</span>
              </div>
              <p className="text-2xl font-bold">{current.total_schools || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{current.healthy_servers || 0} healthy, {current.down_servers || 0} down</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Users size={16} />
                <span className="text-xs font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{current.total_users?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{current.total_students?.toLocaleString() || 0} students</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <DollarSign size={16} />
                <span className="text-xs font-medium">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(current.total_revenue || 0)}</p>
              <p className="text-xs text-gray-400 mt-1">Portal: {formatCurrency(current.portal_revenue || 0)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Activity size={16} />
                <span className="text-xs font-medium">Health Score</span>
              </div>
              <p className="text-2xl font-bold">{current.total_schools > 0 ? Math.round((current.healthy_servers / current.total_schools) * 100) : 0}%</p>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${current.total_schools > 0 ? (current.healthy_servers / current.total_schools) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={18} /> School Fee Payments
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Successful</span>
                  <span className="text-sm font-medium text-green-600">{paymentBreakdown.school_fee?.total_success?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-medium text-yellow-600">{paymentBreakdown.school_fee?.total_pending?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="text-sm font-medium text-red-600">{paymentBreakdown.school_fee?.total_failed?.toLocaleString() || 0}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(paymentBreakdown.school_fee?.total_revenue || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard size={18} /> Portal Fee Payments
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Successful</span>
                  <span className="text-sm font-medium text-green-600">{paymentBreakdown.portal_fee?.total_success?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-medium text-yellow-600">{paymentBreakdown.portal_fee?.total_pending?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="text-sm font-medium text-red-600">{paymentBreakdown.portal_fee?.total_failed?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paid Students</span>
                  <span className="text-sm font-medium text-blue-600">{paymentBreakdown.portal_fee?.paid_count?.toLocaleString() || 0}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(paymentBreakdown.portal_fee?.total_revenue || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Schools */}
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">🏆 Top Performing Schools</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500">School</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Students</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Staff</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">School Fee</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Portal Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schoolBreakdown.slice(0, 10).map((school, idx) => (
                    <tr key={school.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-600' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{school.name}</p>
                            <p className="text-xs text-gray-400">{school.school_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{school.total_students?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right">{school.total_staff?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(school.school_fee_revenue || 0)}</td>
                      <td className="px-6 py-4 text-right text-blue-600">{formatCurrency(school.portal_revenue || 0)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          school.health_status === 'healthy' ? 'bg-green-100 text-green-700' :
                          school.health_status === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {school.health_status === 'healthy' && <CheckCircle size={10} />}
                          {school.health_status === 'down' && <XCircle size={10} />}
                          {school.health_status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Portal Fee Tab */}
      {selectedTab === 'portal-fee' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(portalSummary.total_portal_revenue || 0)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Successful Payments</p>
              <p className="text-2xl font-bold text-green-600">{portalSummary.total_portal_success?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">{portalSummary.total_portal_pending?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-blue-600">{portalSummary.average_conversion || 0}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Portal Fee per School</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500">School</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Success</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Pending</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Failed</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Paid/Total</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {portalSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-xs text-gray-400">{school.school_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-green-600">{school.portal_success?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right text-yellow-600">{school.portal_pending?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right text-red-600">{school.portal_failed?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(school.portal_revenue || 0)}</td>
                      <td className="px-6 py-4 text-right">{school.portal_paid_count?.toLocaleString() || 0} / {school.total_users?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          school.conversion_rate >= 70 ? 'bg-green-100 text-green-700' :
                          school.conversion_rate >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {school.conversion_rate || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* School Fee Tab */}
      {selectedTab === 'school-fee' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(schoolFeeSummary.total_revenue || 0)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Successful Payments</p>
              <p className="text-2xl font-bold text-green-600">{schoolFeeSummary.total_success?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{schoolFeeSummary.total_pending?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">{schoolFeeSummary.success_rate || 0}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">School Fee per School</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500">School</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Success</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Pending</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Failed</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500">Avg/Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schoolFeeSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-xs text-gray-400">{school.school_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-green-600">{school.success?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right text-yellow-600">{school.pending?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right text-red-600">{school.failed?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(school.revenue || 0)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(school.avg_per_student || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Tab */}
      {selectedTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users size={16} />
                <span className="text-xs font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{userActivity.total_users?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <UserCheck size={16} />
                <span className="text-xs font-medium">Online (est.)</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{userActivity.online_estimate?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <UserX size={16} />
                <span className="text-xs font-medium">Offline (est.)</span>
              </div>
              <p className="text-2xl font-bold">{userActivity.offline_estimate?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <GraduationCap size={16} />
                <span className="text-xs font-medium">Students</span>
              </div>
              <p className="text-2xl font-bold">{userActivity.total_students?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Login Activity (Last 30 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-2xl font-bold text-blue-600">{analytics?.userActivity?.activity?.today_logins?.toLocaleString() || 0}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">This Week</p>
                <p className="text-2xl font-bold text-green-600">{analytics?.userActivity?.activity?.weekly_logins?.toLocaleString() || 0}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-purple-600">{analytics?.userActivity?.activity?.monthly_logins?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Health Tab */}
      {selectedTab === 'api-health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Server size={18} /> System Resources
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CPU Usage</span>
                  <span className="text-sm font-medium">{apiHealth.resources?.cpu_percent || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${apiHealth.resources?.cpu_percent || 0}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="text-sm font-medium">{apiHealth.resources?.memory_percent || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${apiHealth.resources?.memory_percent || 0}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Disk Usage</span>
                  <span className="text-sm font-medium">{apiHealth.resources?.disk_percent || 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${apiHealth.resources?.disk_percent || 0}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Database size={18} /> Database Status
              </h3>
              <div className="space-y-2">
                {Object.entries(apiHealth.database_status || {}).map(([db, status]) => (
                  <div key={db} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-mono">{db}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={18} /> System Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Platform</p>
                <p className="text-sm font-medium">{apiHealth.system?.platform || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Python Version</p>
                <p className="text-sm font-medium">{apiHealth.system?.python_version || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hostname</p>
                <p className="text-sm font-medium">{apiHealth.system?.hostname || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {selectedTab === 'logs' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Activity Logs</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activityLogs.map((log, idx) => (
              <div key={idx} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-1">School: {log.school || 'System'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.action === 'login' ? 'bg-green-100 text-green-700' :
                      log.action === 'sync' ? 'bg-blue-100 text-blue-700' :
                      log.action === 'archive' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.action}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{log.time_ago}</p>
                  </div>
                </div>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <div className="text-center py-12">
                <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">No activity logs found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}