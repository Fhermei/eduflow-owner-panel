import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Activity, Users, Eye, RefreshCw, Calendar, Clock, AlertCircle,
  Shield, Lock, Unlock, LogOut, Search, Filter, ChevronLeft, ChevronRight,
  Download, Server, Wifi, WifiOff, Zap, BarChart3, School,
  CheckCircle, XCircle, Loader2, FileText, CreditCard, GraduationCap,
  Briefcase, UserPlus, UserMinus, Edit, Trash2, TrendingUp, TrendingDown
} from 'lucide-react';
import { getAllSchoolsActivity, getSchoolActivity, getOwnerActivityStatistics } from '../services/ownerActivityService';

// ============================================
// DESIGN SYSTEM COMPONENTS
// ============================================

const Text = ({ variant = 'body', children, className = '' }) => {
  const variants = {
    h1: 'text-xl sm:text-2xl font-bold',
    h2: 'text-lg sm:text-xl font-semibold',
    h3: 'text-base sm:text-lg font-semibold',
    h4: 'text-sm sm:text-base font-medium',
    body: 'text-xs sm:text-sm',
    small: 'text-[11px] sm:text-xs',
    caption: 'text-[10px] sm:text-[10px]',
    tiny: 'text-[9px] sm:text-[9px]',
  };
  return <div className={`${variants[variant]} text-gray-700 ${className}`}>{children}</div>;
};

const Button = ({ children, variant = 'outline', size = 'small', icon: Icon, onClick, loading, disabled, className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200 rounded-lg cursor-pointer';
  const variants = {
    primary: 'bg-[#D94801] text-white hover:bg-[#C24000]',
    secondary: 'bg-[#1D2B49] text-white hover:bg-[#24385C]',
    outline: 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
    ghost: 'text-gray-500 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-amber-600 text-white hover:bg-amber-700',
  };
  const sizes = {
    medium: 'h-8 px-3 text-xs',
    small: 'h-7 px-2.5 text-[10px]',
    tiny: 'h-6 px-2 text-[9px]',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      {loading && <Loader2 size={12} className="animate-spin" />}
      {Icon && !loading && <Icon size={size === 'tiny' ? 10 : 12} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, bgColor, textColor, loading }) => (
  <Card className="p-2 text-center">
    <div className="flex flex-col items-center">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgColor} mb-1`}>
        <Icon size={12} className={textColor} />
      </div>
      {loading ? (
        <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mt-1" />
      ) : (
        <Text variant="h4" className="font-bold text-gray-800">{value}</Text>
      )}
      <Text variant="tiny" className="text-gray-400">{title}</Text>
    </div>
  </Card>
);

const StatusBadge = ({ status }) => {
  const config = {
    online: { bg: 'bg-green-100', text: 'text-green-700', icon: Wifi, label: 'Online' },
    offline: { bg: 'bg-gray-100', text: 'text-gray-500', icon: WifiOff, label: 'Offline' },
    locked: { bg: 'bg-red-100', text: 'text-red-700', icon: Lock, label: 'Locked' },
    healthy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Healthy' },
    down: { bg: 'bg-red-100', text: 'text-red-700', label: 'Down' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Warning' },
  };
  const c = config[status] || config.offline;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

const ActivityIcon = ({ type }) => {
  const icons = {
    user_created: UserPlus,
    user_updated: Edit,
    user_deleted: UserMinus,
    student_created: GraduationCap,
    student_updated: Edit,
    parent_created: Users,
    staff_created: Briefcase,
    result_published: FileText,
    fee_paid: CreditCard,
    announcement: Activity,
    system: Server,
  };
  const Icon = icons[type] || Activity;
  return <Icon size={12} />;
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-gray-100">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 text-[9px] border rounded-lg disabled:opacity-40">Prev</button>
      <Text variant="tiny" className="text-gray-500">Page {currentPage} of {totalPages}</Text>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 text-[9px] border rounded-lg disabled:opacity-40">Next</button>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
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
  } catch {
    return 'Unknown';
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
const OwnerActivityDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [schoolsActivity, setSchoolsActivity] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    limit: 50,
    offset: 0,
    activity_type: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsData, activityData] = await Promise.all([
        getOwnerActivityStatistics(),
        getAllSchoolsActivity()
      ]);
      
      setStats(statsData);
      setSchoolsActivity(activityData.schools || []);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data. Please try again.');
      toast.error('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSchoolDetails = useCallback(async (schoolId) => {
    try {
      setLoading(true);
      const data = await getSchoolActivity(schoolId, {
        limit: filters.limit,
        offset: filters.offset,
        activity_type: filters.activity_type === 'all' ? '' : filters.activity_type,
        search: filters.search
      });
      setSchoolDetails(data);
    } catch (err) {
      console.error('Error fetching school details:', err);
      toast.error('Failed to load school details');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (selectedSchool) {
      fetchSchoolDetails(selectedSchool.school_id);
    }
  }, [selectedSchool, fetchSchoolDetails, filters.offset, filters.activity_type, filters.search]);

  const handleSchoolClick = (school) => {
    setSelectedSchool(school);
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, offset: 0 }));
  };

  const handleBack = () => {
    setSelectedSchool(null);
    setSchoolDetails(null);
  };

  const getActivityColor = (type) => {
    const colors = {
      user_created: 'text-blue-500 bg-blue-50',
      user_updated: 'text-yellow-500 bg-yellow-50',
      student_created: 'text-purple-500 bg-purple-50',
      student_updated: 'text-indigo-500 bg-indigo-50',
      parent_created: 'text-teal-500 bg-teal-50',
      staff_created: 'text-orange-500 bg-orange-50',
      result_published: 'text-green-500 bg-green-50',
      fee_paid: 'text-emerald-500 bg-emerald-50',
      announcement: 'text-red-500 bg-red-50',
      system: 'text-gray-500 bg-gray-50',
    };
    return colors[type] || 'text-gray-500 bg-gray-50';
  };

  // Calculate pagination for activities
  const activities = schoolDetails?.activities || [];
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const paginatedActivities = activities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#D94801] mx-auto mb-3" />
          <Text variant="tiny" className="text-gray-400">Loading activity dashboard...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1D2B49] rounded-lg flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <Text variant="small" className="font-bold">
              {selectedSchool ? `Activity: ${selectedSchool.name}` : 'Activity Dashboard'}
            </Text>
          </div>
          <Text variant="tiny" className="text-gray-400 mt-0.5">
            {selectedSchool 
              ? `Monitor user activity for ${selectedSchool.name}`
              : 'Monitor user activity across all schools'}
          </Text>
        </div>
        <div className="flex gap-1.5">
          {selectedSchool && (
            <Button variant="outline" size="tiny" icon={ChevronLeft} onClick={handleBack}>
              Back to All Schools
            </Button>
          )}
          <Button variant="outline" size="tiny" icon={RefreshCw} onClick={selectedSchool ? () => fetchSchoolDetails(selectedSchool.school_id) : fetchAllData} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
          <Text variant="tiny" className="text-red-600">{error}</Text>
        </div>
      )}

      {/* Stats Cards - Only show when not in school detail */}
      {!selectedSchool && stats && (
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <StatCard title="Total Schools" value={stats.total_schools || 0} icon={School} bgColor="bg-blue-100" textColor="text-blue-600" loading={loading} />
          <StatCard title="Total Activities" value={stats.total_activities || 0} icon={Activity} bgColor="bg-purple-100" textColor="text-purple-600" loading={loading} />
          <StatCard title="Today's Activities" value={stats.today_activities || 0} icon={Calendar} bgColor="bg-green-100" textColor="text-green-600" loading={loading} />
          <StatCard title="Weekly Activities" value={stats.week_activities || 0} icon={TrendingUp} bgColor="bg-orange-100" textColor="text-orange-600" loading={loading} />
        </div>
      )}

      {/* School List View */}
      {!selectedSchool && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">School</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">School ID</th>
                  <th className="px-3 py-2 text-center text-[9px] font-semibold text-gray-500 uppercase">Activities</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Last Activity</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-center text-[9px] font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {schoolsActivity.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleSchoolClick(school)}>
                    <td className="px-3 py-2">
                      <Text variant="tiny" className="font-medium">{school.name}</Text>
                    </td>
                    <td className="px-3 py-2">
                      <Text variant="tiny" className="font-mono text-gray-400">{school.school_id}</Text>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Text variant="tiny" className="font-bold text-blue-600">{school.total_activities || 0}</Text>
                    </td>
                    <td className="px-3 py-2">
                      <Text variant="tiny" className="text-gray-500">{formatTimeAgo(school.last_activity)}</Text>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={school.health_status || 'healthy'} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button size="tiny" variant="ghost" icon={Eye} onClick={(e) => { e.stopPropagation(); handleSchoolClick(school); }}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
                {schoolsActivity.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center">
                      <Activity size={28} className="mx-auto text-gray-200 mb-2" />
                      <Text variant="tiny" className="text-gray-400">No activity data available</Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* School Detail View */}
      {selectedSchool && schoolDetails && (
        <div className="space-y-3">
          {/* School Info Header */}
          <Card className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <Text variant="small" className="font-bold">{selectedSchool.name}</Text>
                <Text variant="tiny" className="text-gray-400">ID: {selectedSchool.school_id}</Text>
                <div className="flex gap-3 mt-1">
                  <Text variant="tiny" className="text-gray-500">Total Activities: {schoolDetails.total_activities || 0}</Text>
                  <Text variant="tiny" className="text-gray-500">Last Sync: {formatTimeAgo(schoolDetails.last_sync)}</Text>
                </div>
              </div>
              <StatusBadge status={schoolDetails.health_status || 'healthy'} />
            </div>
          </Card>

          {/* Filters */}
          <Card className="p-2">
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[150px]">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, offset: 0 }))}
                    className="w-full pl-7 pr-2 py-1.5 border rounded-lg text-xs"
                  />
                </div>
              </div>
              <select
                value={filters.activity_type}
                onChange={(e) => setFilters(prev => ({ ...prev, activity_type: e.target.value, offset: 0 }))}
                className="px-2 py-1.5 text-[10px] border rounded-lg"
              >
                <option value="all">All Activities</option>
                <option value="user_created">User Created</option>
                <option value="student_created">Student Created</option>
                <option value="parent_created">Parent Created</option>
                <option value="staff_created">Staff Created</option>
                <option value="result_published">Result Published</option>
                <option value="fee_paid">Fee Paid</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
          </Card>

          {/* Activity List */}
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {paginatedActivities.length > 0 ? (
                paginatedActivities.map((activity) => (
                  <div key={activity.id} className="p-2 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.activity_type)}`}>
                        <ActivityIcon type={activity.activity_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <Text variant="tiny" className="font-medium text-gray-800">
                            {activity.user_name || 'System'}
                          </Text>
                          <Text variant="tiny" className="text-gray-400">•</Text>
                          <Text variant="tiny" className="text-gray-500">{activity.action}</Text>
                        </div>
                        <Text variant="tiny" className="text-gray-400">{activity.description}</Text>
                        <div className="flex flex-wrap gap-2 mt-0.5">
                          <Text variant="tiny" className="text-gray-300">{formatDate(activity.created_at)}</Text>
                          {activity.target_name && (
                            <Text variant="tiny" className="text-gray-300">Target: {activity.target_name}</Text>
                          )}
                          {activity.ip_address && (
                            <Text variant="tiny" className="text-gray-300 font-mono">IP: {activity.ip_address}</Text>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Activity size={24} className="mx-auto text-gray-200 mb-2" />
                  <Text variant="tiny" className="text-gray-400">No activities found</Text>
                </div>
              )}
            </div>
            
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default OwnerActivityDashboard;