import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Users, Activity, Calendar, Clock, AlertCircle,
  Lock, Unlock, LogOut, Search, Filter, ChevronLeft, ChevronRight,
  RefreshCw, Eye, TrendingUp, TrendingDown, Server,
  Wifi, WifiOff, Zap, BarChart3, List,
  CheckCircle, XCircle, Loader2, UserPlus, UserMinus,
  FileText, CreditCard, GraduationCap, Briefcase, Edit,
  Download, TrendingUp as TrendUp, TrendingDown as TrendDown,
  PieChart, LineChart as LineChartIcon, Calendar as CalendarIcon,
  Globe, Monitor
} from 'lucide-react';
import {
  getOwnerOnlineStatus,
  getOwnerLoginAnalytics,
  lockOwnerUser,
  unlockOwnerUser,
  forceLogoutAllOwnerUsers,
  forceLogoutOwnerUser,
  getOwnerCompleteActivityLog
} from '../services/ownerActivityService';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { format, subDays, subWeeks, subMonths, subYears, startOfWeek, endOfWeek } from 'date-fns';

// ============================================
// DESIGN SYSTEM COMPONENTS
// ============================================

const Text = ({ variant = 'body', children, className = '' }) => {
  const variants = {
    h1: 'text-2xl md:text-3xl font-bold',
    h2: 'text-xl md:text-2xl font-semibold',
    h3: 'text-lg md:text-xl font-semibold',
    h4: 'text-base md:text-lg font-medium',
    body: 'text-sm md:text-base',
    small: 'text-xs md:text-sm',
    caption: 'text-[10px] md:text-xs',
    tiny: 'text-[9px] md:text-[10px]',
  };
  return <div className={`${variants[variant]} text-gray-800 ${className}`}>{children}</div>;
};

const Button = ({ children, variant = 'primary', size = 'medium', icon: Icon, onClick, loading, disabled, className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease rounded-xl cursor-pointer';
  const variants = {
    primary: 'bg-[#D94801] text-white hover:bg-[#C24000]',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };
  const sizes = {
    medium: 'h-10 px-4 text-sm',
    small: 'h-8 px-3 text-xs',
    tiny: 'h-7 px-2 text-[10px]',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {Icon && !loading && <Icon size={size === 'tiny' ? 12 : 14} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

const StatCard = ({ title, value, icon: Icon, color, detail, loading, trend, trendValue }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendUp size={12} /> : <TrendDown size={12} />}
          <span>{trendValue}%</span>
        </div>
      )}
    </div>
    <div className="mt-3">
      {loading ? (
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
      ) : (
        <Text variant="h3" className="font-bold text-2xl">{value?.toLocaleString() || 0}</Text>
      )}
      <Text variant="caption" className="text-gray-400 mt-1">{title}</Text>
      {detail && <Text variant="tiny" className="text-gray-400">{detail}</Text>}
    </div>
  </Card>
);

const StatusBadge = ({ status }) => {
  const config = {
    online: { bg: 'bg-green-100', text: 'text-green-700', icon: Wifi, label: 'Online' },
    offline: { bg: 'bg-gray-100', text: 'text-gray-500', icon: WifiOff, label: 'Offline' },
    locked: { bg: 'bg-red-100', text: 'text-red-700', icon: Lock, label: 'Locked' },
  };
  const c = config[status] || config.offline;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${c.bg} ${c.text}`}>
      <Icon size={10} /> {c.label}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch { return dateString; }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Never';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch { return 'Unknown'; }
};

const getActivityColor = (type) => {
  const colors = {
    user_created: 'bg-blue-500',
    user_updated: 'bg-yellow-500',
    student_created: 'bg-purple-500',
    student_updated: 'bg-indigo-500',
    parent_created: 'bg-teal-500',
    staff_created: 'bg-orange-500',
    result_published: 'bg-green-500',
    fee_paid: 'bg-emerald-500',
    announcement: 'bg-red-500',
    system: 'bg-gray-500',
  };
  return colors[type] || 'bg-gray-500';
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <p className="text-xs text-gray-600">{p.name}: {p.value?.toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'sm' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${size === 'sm' ? 'max-w-md' : 'max-w-lg'} mx-4`}>
        <div className="flex justify-between items-center p-4 border-b">
          <Text variant="h4" className="font-semibold">{title}</Text>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT - OWNER ACTIVITY DASHBOARD
// ============================================
const OwnerActivityDashboard = () => {
  // States
  const [loading, setLoading] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(null);
  const [loginAnalytics, setLoginAnalytics] = useState(null);
  const [activityLog, setActivityLog] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showForceLogoutAllModal, setShowForceLogoutAllModal] = useState(false);
  const [activityFilters, setActivityFilters] = useState({
    limit: 50,
    offset: 0,
    activity_type: 'all',
    search: '',
    start_date: '',
    end_date: ''
  });
  
  // Date range filter for chart
  const [dateRange, setDateRange] = useState({
    preset: 'week', // day, week, month, year, custom
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    customStart: '',
    customEnd: ''
  });
  
  const [chartView, setChartView] = useState('line'); // line, area, bar
  
  // Fetch all data across all schools
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statusRes, analyticsRes, activityRes] = await Promise.all([
        getOwnerOnlineStatus(),
        getOwnerLoginAnalytics(),
        getOwnerCompleteActivityLog(activityFilters)
      ]);
      
      setOnlineStatus(statusRes);
      setLoginAnalytics(analyticsRes);
      setActivityLog(activityRes);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data. Please try again.');
      toast.error('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  }, [activityFilters]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData, activityFilters.offset, activityFilters.activity_type, activityFilters.search]);
  
  // Handle date range change
  const handleDateRangeChange = (preset) => {
    const now = new Date();
    let startDate, endDate = now;
    
    switch(preset) {
      case 'day':
        startDate = subDays(now, 1);
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
      case 'custom':
        startDate = dateRange.customStart ? new Date(dateRange.customStart) : subDays(now, 7);
        endDate = dateRange.customEnd ? new Date(dateRange.customEnd) : now;
        break;
      default:
        startDate = subDays(now, 7);
    }
    
    setDateRange({
      ...dateRange,
      preset,
      startDate,
      endDate
    });
  };
  
  // Prepare chart data from login analytics
  const getChartData = () => {
    if (!loginAnalytics?.daily_trends) return [];
    
    let data = [...loginAnalytics.daily_trends];
    
    // Filter by date range
    data = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
    
    // Aggregate based on preset
    if (dateRange.preset === 'month' || dateRange.preset === 'year') {
      const aggregated = {};
      data.forEach(item => {
        const date = new Date(item.date);
        const key = dateRange.preset === 'month' ? 
          `${date.getFullYear()}-${date.getMonth()+1}` : 
          `${date.getFullYear()}`;
        
        if (!aggregated[key]) {
          aggregated[key] = { 
            date: key, 
            total: 0, 
            successful: 0, 
            failed: 0,
            successRate: 0
          };
        }
        aggregated[key].total += item.total;
        aggregated[key].successful += item.successful;
        aggregated[key].failed += item.failed;
      });
      
      return Object.values(aggregated).map(item => ({
        ...item,
        successRate: item.total > 0 ? Math.round((item.successful / item.total) * 100) : 0
      }));
    }
    
    return data.map(item => ({
      ...item,
      successRate: item.total > 0 ? Math.round((item.successful / item.total) * 100) : 0
    }));
  };
  
  const chartData = getChartData();
  
  // Calculate statistics
  const totalLogins = chartData.reduce((sum, d) => sum + d.total, 0);
  const totalSuccessful = chartData.reduce((sum, d) => sum + d.successful, 0);
  const totalFailed = chartData.reduce((sum, d) => sum + d.failed, 0);
  const overallSuccessRate = totalLogins > 0 ? Math.round((totalSuccessful / totalLogins) * 100) : 0;
  const avgDailyLogins = chartData.length > 0 ? Math.round(totalLogins / chartData.length) : 0;
  const peakDay = chartData.reduce((max, d) => d.total > max.total ? d : max, { total: 0, date: 'N/A' });
  
  // Chart colors
  const COLORS = ['#8884d8', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'];
  
  // Handle lock/unlock user
  const handleLockUser = async () => {
    if (!selectedUser) return;
    try {
      await lockOwnerUser(selectedUser.registration_number);
      setSuccess(`User ${selectedUser.name} has been locked`);
      setShowLockModal(false);
      setSelectedUser(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to lock user');
      toast.error(err.message || 'Failed to lock user');
    }
  };
  
  const handleUnlockUser = async (registrationNumber, userName) => {
    try {
      await unlockOwnerUser(registrationNumber);
      setSuccess(`User ${userName} has been unlocked`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to unlock user');
      toast.error(err.message || 'Failed to unlock user');
    }
  };
  
  // Handle force logout
  const handleForceLogoutAll = async () => {
    try {
      setForceLogoutLoading(true);
      const result = await forceLogoutAllOwnerUsers();
      setSuccess(result.message || `Successfully logged out ${result.users_affected} users`);
      setShowForceLogoutAllModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to force logout users');
      toast.error(err.message || 'Failed to force logout users');
    } finally {
      setForceLogoutLoading(false);
    }
  };
  
  const handleForceLogoutUser = async (registrationNumber, userName) => {
    try {
      await forceLogoutOwnerUser(registrationNumber);
      setSuccess(`User ${userName} has been logged out`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to force logout user');
      toast.error(err.message || 'Failed to force logout user');
    }
  };
  
  // Export data to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Total Attempts', 'Successful Logins', 'Failed Attempts', 'Success Rate (%)'];
    const rows = chartData.map(d => [
      d.date,
      d.total,
      d.successful,
      d.failed,
      d.successRate
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-analytics-${dateRange.preset}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };
  
  if (loading && !onlineStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-[#D94801] mx-auto mb-4" />
          <Text variant="body" className="text-gray-400">Loading activity data...</Text>
        </div>
      </div>
    );
  }
  
  const renderChart = () => {
    const ChartComponent = chartView === 'line' ? LineChart : chartView === 'area' ? AreaChart : BarChart;
    const DataComponent = chartView === 'line' ? Line : chartView === 'area' ? Area : Bar;
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              if (dateRange.preset === 'year') return value;
              if (dateRange.preset === 'month') return value;
              const date = new Date(value);
              return `${date.getMonth()+1}/${date.getDate()}`;
            }}
            interval={chartData.length > 30 ? Math.floor(chartData.length / 10) : 0}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <DataComponent 
            type="monotone" 
            dataKey="successful" 
            name="Successful Logins"
            stroke="#22c55e" 
            fill="#22c55e"
            strokeWidth={2}
            dot={{ r: 3, fill: "#22c55e" }}
          />
          <DataComponent 
            type="monotone" 
            dataKey="failed" 
            name="Failed Attempts"
            stroke="#ef4444" 
            fill="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ef4444" }}
          />
          <DataComponent 
            type="monotone" 
            dataKey="total" 
            name="Total Attempts"
            stroke="#8884d8" 
            fill="#8884d8"
            strokeWidth={2}
            dot={{ r: 3, fill: "#8884d8" }}
          />
        </ChartComponent>
      </ResponsiveContainer>
    );
  };
  
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col px-3 sm:px-4 lg:px-6">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-50 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pt-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#1D2B49] rounded-xl flex items-center justify-center shadow-sm">
                <Activity size={14} className="text-white" />
              </div>
              <Text variant="h2" className="font-bold">Activity Dashboard</Text>
            </div>
            <Text variant="caption" className="text-gray-400 pl-9">
              Monitor user activity, online status, and system analytics across all schools
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="small" icon={RefreshCw} onClick={fetchData} loading={loading}>
              Refresh
            </Button>
            <Button variant="danger" size="small" icon={LogOut} onClick={() => setShowForceLogoutAllModal(true)}>
              Force Logout All
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <Text variant="tiny" className="text-red-600">{error}</Text>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <Text variant="tiny" className="text-green-600">{success}</Text>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 mb-3">
          <StatCard 
            title="Total Users" 
            value={onlineStatus?.summary?.total_users || 0} 
            icon={Users} 
            color="bg-blue-500"
            loading={loading}
          />
          <StatCard 
            title="Online Now" 
            value={onlineStatus?.summary?.total_online || 0} 
            icon={Wifi} 
            color="bg-green-500"
            detail={`${Math.round((onlineStatus?.summary?.total_online / (onlineStatus?.summary?.total_users || 1)) * 100)}% of users`}
            loading={loading}
          />
          <StatCard 
            title="Today's Logins" 
            value={loginAnalytics?.today_stats?.successful || 0} 
            icon={LogOut} 
            color="bg-orange-500"
            detail={`${loginAnalytics?.today_stats?.success_rate || 0}% success rate`}
            loading={loading}
          />
          <StatCard 
            title="Total Logins (Period)" 
            value={totalLogins} 
            icon={TrendingUp} 
            color="bg-purple-500"
            loading={loading}
          />
          <StatCard 
            title="Success Rate" 
            value={`${overallSuccessRate}%`} 
            icon={CheckCircle} 
            color="bg-green-500"
            loading={loading}
          />
          <StatCard 
            title="Avg Daily Logins" 
            value={avgDailyLogins} 
            icon={Calendar} 
            color="bg-cyan-500"
            loading={loading}
          />
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-3 overflow-x-auto">
          {['overview', 'analytics', 'online', 'suspicious', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'text-[#D94801] border-b-2 border-[#D94801]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 capitalize">
                {tab === 'analytics' ? <TrendingUp size={14} /> : 
                 tab === 'online' ? <Wifi size={14} /> :
                 tab === 'suspicious' ? <AlertCircle size={14} /> :
                 tab === 'activity' ? <List size={14} /> :
                 <BarChart3 size={14} />}
                {tab}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-4">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && onlineStatus && (
          <div className="space-y-4">
            {/* Login Trends Chart */}
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <Text variant="h4" className="font-semibold flex items-center gap-2">
                  <LineChartIcon size={18} /> Login Trends Analytics
                </Text>
                <div className="flex gap-2 flex-wrap">
                  {/* Date range presets */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {['day', 'week', 'month', 'year'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleDateRangeChange(preset)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors capitalize ${
                          dateRange.preset === preset 
                            ? 'bg-[#D94801] text-white' 
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    <button
                      onClick={() => handleDateRangeChange('custom')}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        dateRange.preset === 'custom' 
                          ? 'bg-[#D94801] text-white' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  
                  {/* Chart type selector */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {['line', 'area', 'bar'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartView(type)}
                        className={`px-2 py-1 text-xs rounded-lg capitalize ${
                          chartView === type 
                            ? 'bg-[#D94801] text-white' 
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  {/* Export button */}
                  <Button variant="outline" size="tiny" icon={Download} onClick={exportToCSV}>
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Custom date range inputs */}
              {dateRange.preset === 'custom' && (
                <div className="flex gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Text variant="tiny" className="text-gray-500">Start Date</Text>
                    <input
                      type="date"
                      value={dateRange.customStart}
                      onChange={(e) => {
                        setDateRange({ ...dateRange, customStart: e.target.value });
                        handleDateRangeChange('custom');
                      }}
                      className="mt-1 px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <Text variant="tiny" className="text-gray-500">End Date</Text>
                    <input
                      type="date"
                      value={dateRange.customEnd}
                      onChange={(e) => {
                        setDateRange({ ...dateRange, customEnd: e.target.value });
                        handleDateRangeChange('custom');
                      }}
                      className="mt-1 px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
              
              {chartData.length > 0 ? renderChart() : (
                <div className="text-center py-8">
                  <Activity size={40} className="mx-auto text-gray-200 mb-2" />
                  <Text className="text-gray-400">No data available for selected period</Text>
                </div>
              )}
              
              {/* Statistics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <Text variant="tiny" className="text-gray-400">Total Logins</Text>
                  <Text variant="h4" className="font-bold text-gray-800">{totalLogins.toLocaleString()}</Text>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <Text variant="tiny" className="text-gray-400">Successful</Text>
                  <Text variant="h4" className="font-bold text-green-600">{totalSuccessful.toLocaleString()}</Text>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <Text variant="tiny" className="text-gray-400">Failed</Text>
                  <Text variant="h4" className="font-bold text-red-600">{totalFailed.toLocaleString()}</Text>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <Text variant="tiny" className="text-gray-400">Peak Day</Text>
                  <Text variant="h4" className="font-bold text-[#D94801]">{peakDay.date}: {peakDay.total}</Text>
                </div>
              </div>
            </Card>
            
            {/* Online by Role */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <Text variant="h4" className="font-semibold mb-3 flex items-center gap-2">
                  <Users size={16} /> Online Users by Role
                </Text>
                <div className="space-y-2">
                  {onlineStatus.online_by_role && Object.entries(onlineStatus.online_by_role).map(([role, count]) => (
                    count > 0 && (
                      <div key={role} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <Text variant="tiny" className="text-gray-600">{role}</Text>
                        <span className="text-xs font-bold text-green-600">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </Card>
              
              {/* Activity Summary */}
              <Card className="p-4">
                <Text variant="h4" className="font-semibold mb-3 flex items-center gap-2">
                  <Activity size={16} /> Activity Summary
                </Text>
                <div className="grid grid-cols-2 gap-2">
                  {activityLog?.summary?.type_distribution?.slice(0, 6).map((type) => (
                    <div key={type.activity_type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <Text variant="tiny" className="text-gray-600 capitalize">
                        {type.activity_type?.replace(/_/g, ' ')}
                      </Text>
                      <span className="text-xs font-bold text-gray-700">{type.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            
            {/* Most Active Users */}
            <Card className="p-4">
              <Text variant="h4" className="font-semibold mb-3 flex items-center gap-2">
                <Zap size={16} /> Most Active Users
              </Text>
              <div className="space-y-2">
                {activityLog?.summary?.user_leaders?.slice(0, 10).map((leader, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-xs font-bold text-gray-400">#{idx + 1}</span>
                      <Text variant="tiny" className="font-medium">{leader.user__name || leader.user_name || 'Unknown'}</Text>
                    </div>
                    <span className="text-xs font-bold text-[#D94801]">{leader.activity_count} actions</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
        
        {/* ANALYTICS TAB - Advanced Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {/* Success Rate Trend */}
            <Card className="p-4">
              <Text variant="h4" className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> Login Success Rate Trend
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="successRate" 
                    name="Success Rate (%)"
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.3}
                  />
                  <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" label="50%" />
                  <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="3 3" label="75%" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4 text-center">
                <Text variant="tiny" className="text-gray-400">Total Login Attempts</Text>
                <Text variant="h3" className="font-bold text-2xl">{totalLogins.toLocaleString()}</Text>
              </Card>
              <Card className="p-4 text-center">
                <Text variant="tiny" className="text-gray-400">Overall Success Rate</Text>
                <Text variant="h3" className="font-bold text-2xl text-green-600">{overallSuccessRate}%</Text>
              </Card>
              <Card className="p-4 text-center">
                <Text variant="tiny" className="text-gray-400">Peak Daily Logins</Text>
                <Text variant="h3" className="font-bold text-2xl text-[#D94801]">{peakDay.total}</Text>
                <Text variant="tiny" className="text-gray-400">{peakDay.date}</Text>
              </Card>
              <Card className="p-4 text-center">
                <Text variant="tiny" className="text-gray-400">Avg Daily Logins</Text>
                <Text variant="h3" className="font-bold text-2xl">{avgDailyLogins}</Text>
              </Card>
            </div>
            
            {/* Period Comparison */}
            <Card className="p-4">
              <Text variant="h4" className="font-semibold mb-3 flex items-center gap-2">
                <CalendarIcon size={16} /> Period Comparison
              </Text>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <Text variant="tiny" className="text-gray-400">This Period</Text>
                  <Text variant="h4" className="font-bold">{totalLogins.toLocaleString()} logins</Text>
                  <Text variant="tiny" className="text-green-600">{overallSuccessRate}% success</Text>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <Text variant="tiny" className="text-gray-400">Daily Average</Text>
                  <Text variant="h4" className="font-bold">{avgDailyLogins} per day</Text>
                  <Text variant="tiny" className="text-gray-400">Peak: {peakDay.total} on {peakDay.date}</Text>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* ONLINE USERS TAB */}
        {activeTab === 'online' && onlineStatus && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">User</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Role</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Last Activity</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">IP Address</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {onlineStatus.online_users?.length > 0 ? (
                    onlineStatus.online_users.map((onlineUser, idx) => (
                      <tr key={`${onlineUser.id}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Text variant="small" className="font-medium">{onlineUser.name}</Text>
                          <Text variant="caption" className="text-gray-400">{onlineUser.registration_number}</Text>
                          <Text variant="tiny" className="text-gray-300">{onlineUser.school_name}</Text>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status="online" />
                          <Text variant="tiny" className="text-gray-400 mt-1">{onlineUser.role}</Text>
                        </td>
                        <td className="px-4 py-3">
                          <Text variant="caption">{formatTimeAgo(onlineUser.last_activity)}</Text>
                          <Text variant="tiny" className="text-gray-400">{formatDate(onlineUser.last_activity)}</Text>
                        </td>
                        <td className="px-4 py-3">
                          <Text variant="caption" className="font-mono">{onlineUser.last_login_ip || 'Unknown'}</Text>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleForceLogoutUser(onlineUser.registration_number, onlineUser.name)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                              <LogOut size={14} />
                            </button>
                            <button onClick={() => { setSelectedUser(onlineUser); setShowLockModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg">
                              <Lock size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="px-4 py-8 text-center"><WifiOff size={32} className="mx-auto text-gray-300 mb-2" /><Text className="text-gray-400">No users online</Text></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        
        {/* SUSPICIOUS ACTIVITY TAB */}
        {activeTab === 'suspicious' && loginAnalytics && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <Text variant="h4" className="font-semibold flex items-center gap-2">
                  <AlertCircle size={16} /> Failed Login Attempts (5+)
                </Text>
                <Text variant="tiny" className="text-gray-400">Today: {loginAnalytics.today_stats?.failed || 0} attempts</Text>
              </div>
              <div className="space-y-2">
                {loginAnalytics.suspicious_users?.length > 0 ? (
                  loginAnalytics.suspicious_users.map((user, idx) => (
                    <div key={idx} className="flex flex-wrap items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Text variant="small" className="font-medium">{user.user_name}</Text>
                          <Text variant="tiny" className="text-gray-400">({user.registration_number})</Text>
                          <Text variant="tiny" className="bg-gray-100 px-1 rounded">{user.school_name}</Text>
                          {user.is_locked && <StatusBadge status="locked" />}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <Text variant="tiny" className="text-gray-500">Failed: {user.failed_count} times</Text>
                          <Text variant="tiny" className="text-gray-500">IP: {user.ip_address}</Text>
                          <Text variant="tiny" className="text-gray-500">Last: {formatTimeAgo(user.latest_attempt)}</Text>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        {user.is_locked ? (
                          <button onClick={() => handleUnlockUser(user.registration_number, user.user_name)} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg">Unlock</button>
                        ) : (
                          <button onClick={() => { setSelectedUser(user); setShowLockModal(true); }} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg">Lock</button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6"><CheckCircle size={32} className="mx-auto text-green-300 mb-2" /><Text className="text-gray-400">No suspicious activity</Text></div>
                )}
              </div>
            </Card>
            
            <Card className="p-4">
              <Text variant="h4" className="font-semibold mb-3 flex items-center gap-2">
                <Globe size={16} /> Suspicious IP Addresses
              </Text>
              <div className="space-y-2">
                {loginAnalytics.suspicious_ips?.length > 0 ? (
                  loginAnalytics.suspicious_ips.map((ip, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <Text variant="tiny" className="font-mono">{ip.ip_address}</Text>
                      <span className="text-xs font-bold text-red-500">{ip.attempt_count} failed attempts</span>
                    </div>
                  ))
                ) : (
                  <Text className="text-gray-400 text-center py-2">No suspicious IP addresses</Text>
                )}
              </div>
            </Card>
            
            <Card className="p-4">
              <Text variant="h4" className="font-semibold mb-3 flex items-center gap-2">
                <Lock size={16} /> Locked Accounts
              </Text>
              <div className="space-y-2">
                {loginAnalytics.locked_accounts?.length > 0 ? (
                  loginAnalytics.locked_accounts.map((account, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <div>
                        <Text variant="tiny" className="font-medium">{account.name}</Text>
                        <Text variant="tiny" className="text-gray-400">{account.registration_number} • {account.role}</Text>
                      </div>
                      <button onClick={() => handleUnlockUser(account.registration_number, account.name)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg">Unlock</button>
                    </div>
                  ))
                ) : (
                  <Text className="text-gray-400 text-center py-2">No locked accounts</Text>
                )}
              </div>
            </Card>
          </div>
        )}
        
        {/* ACTIVITY LOG TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            <Card className="p-3">
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search activities..." value={activityFilters.search} onChange={(e) => setActivityFilters(prev => ({ ...prev, search: e.target.value, offset: 0 }))} className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm" />
                </div>
                <select value={activityFilters.activity_type} onChange={(e) => setActivityFilters(prev => ({ ...prev, activity_type: e.target.value, offset: 0 }))} className="px-3 py-2 border rounded-xl text-sm">
                  <option value="all">All Activities</option>
                  <option value="user_created">User Created</option>
                  <option value="student_created">Student Created</option>
                  <option value="result_published">Result Published</option>
                  <option value="fee_paid">Fee Paid</option>
                  <option value="system">System</option>
                </select>
                <input type="date" value={activityFilters.start_date} onChange={(e) => setActivityFilters(prev => ({ ...prev, start_date: e.target.value }))} className="px-3 py-2 border rounded-xl text-sm" />
                <input type="date" value={activityFilters.end_date} onChange={(e) => setActivityFilters(prev => ({ ...prev, end_date: e.target.value }))} className="px-3 py-2 border rounded-xl text-sm" />
              </div>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {activityLog?.activities?.length > 0 ? (
                  activityLog.activities.map((activity, idx) => (
                    <div key={idx} className="p-3 hover:bg-gray-50">
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.activity_type)}`}>
                          <Activity size={12} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Text variant="small" className="font-medium">{activity.user_name || 'System'}</Text>
                            <Text variant="tiny" className="text-gray-300 bg-gray-100 px-1 rounded">{activity.school_name}</Text>
                            <Text variant="caption" className="text-gray-500">{activity.action}</Text>
                          </div>
                          <Text variant="tiny" className="text-gray-400 mt-0.5">{activity.description}</Text>
                          <Text variant="tiny" className="text-gray-300 mt-1">{formatDate(activity.created_at)}</Text>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center"><Activity size={32} className="mx-auto text-gray-200 mb-2" /><Text className="text-gray-400">No activities found</Text></div>
                )}
              </div>
              
              {activityLog && activityLog.total > (activityLog.limit || 50) && (
                <div className="flex justify-between p-3 border-t">
                  <Button variant="ghost" size="tiny" onClick={() => setActivityFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))} disabled={activityFilters.offset === 0}>Previous</Button>
                  <Text variant="tiny" className="text-gray-400">Showing {activityFilters.offset + 1} to {Math.min(activityFilters.offset + (activityLog.limit || 50), activityLog.total)} of {activityLog.total}</Text>
                  <Button variant="ghost" size="tiny" onClick={() => setActivityFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))} disabled={activityFilters.offset + (activityLog.limit || 50) >= (activityLog.total || 0)}>Next</Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <Modal isOpen={showLockModal} onClose={() => { setShowLockModal(false); setSelectedUser(null); }} title="Lock User Account">
        {selectedUser && (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><Lock size={20} className="text-red-600" /></div>
            <Text variant="h4" className="font-semibold mb-2">Lock {selectedUser.name}?</Text>
            <Text variant="caption" className="text-gray-500 mb-4 block">User will be locked for 24 hours</Text>
            <div className="flex gap-2"><Button variant="outline" onClick={() => { setShowLockModal(false); setSelectedUser(null); }} className="flex-1">Cancel</Button><Button variant="danger" onClick={handleLockUser} className="flex-1">Lock</Button></div>
          </div>
        )}
      </Modal>
      
      <Modal isOpen={showForceLogoutAllModal} onClose={() => setShowForceLogoutAllModal(false)} title="Force Logout All Users">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><LogOut size={20} className="text-red-600" /></div>
          <Text variant="h4" className="font-semibold mb-2">Force Logout ALL Users?</Text>
          <Text variant="caption" className="text-gray-500 mb-4 block">All users across all schools will be logged out</Text>
          <div className="flex gap-2"><Button variant="outline" onClick={() => setShowForceLogoutAllModal(false)} className="flex-1">Cancel</Button><Button variant="danger" onClick={handleForceLogoutAll} loading={forceLogoutLoading} className="flex-1">Force Logout</Button></div>
        </div>
      </Modal>
    </div>
  );
};

export default OwnerActivityDashboard;