// owner_panel/frontend/src/services/ownerActivityService.js

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8005/api';

// ============================================
// AGGREGATED ENDPOINTS (All Schools Combined)
// ============================================

// Get aggregated online status across ALL schools
export const getOwnerOnlineStatus = async () => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/owner/activity/online-status/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch online status');
    return await response.json();
  } catch (error) {
    console.error('Error fetching online status:', error);
    return {
      success: true,
      summary: { total_users: 0, total_online: 0, total_offline: 0 },
      online_by_role: {},
      online_users: [],
      timestamp: new Date().toISOString()
    };
  }
};

// Get aggregated login analytics across ALL schools
export const getOwnerLoginAnalytics = async () => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/owner/activity/login-analytics/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch login analytics');
    return await response.json();
  } catch (error) {
    console.error('Error fetching login analytics:', error);
    return {
      success: true,
      today_stats: { total_attempts: 0, successful: 0, failed: 0, success_rate: 0 },
      daily_trends: [],
      suspicious_users: [],
      suspicious_ips: [],
      locked_accounts: [],
      timestamp: new Date().toISOString()
    };
  }
};

// Get aggregated activity log across ALL schools
export const getOwnerCompleteActivityLog = async (filters = {}) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.activity_type && filters.activity_type !== 'all') params.append('activity_type', filters.activity_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await fetch(`${API_BASE}/owner/activity/activity-log/?${params}`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch activity log');
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return {
      success: true,
      activities: [],
      total: 0,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
      summary: { type_distribution: [], user_leaders: [] },
      timestamp: new Date().toISOString()
    };
  }
};

// Lock a user across ALL schools
export const lockOwnerUser = async (registrationNumber) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/owner/activity/lock-user/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Token ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ registration_number: registrationNumber })
    });
    if (!response.ok) throw new Error('Failed to lock user');
    return await response.json();
  } catch (error) {
    console.error('Error locking user:', error);
    throw error;
  }
};

// Unlock a user across ALL schools
export const unlockOwnerUser = async (registrationNumber) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/owner/activity/unlock-user/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Token ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ registration_number: registrationNumber })
    });
    if (!response.ok) throw new Error('Failed to unlock user');
    return await response.json();
  } catch (error) {
    console.error('Error unlocking user:', error);
    throw error;
  }
};

// Force logout ALL users across ALL schools
export const forceLogoutAllOwnerUsers = async () => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/owner/activity/force-logout-all/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Token ${token}`, 
        'Content-Type': 'application/json' 
      }
    });
    if (!response.ok) throw new Error('Failed to force logout users');
    return await response.json();
  } catch (error) {
    console.error('Error force logging out users:', error);
    throw error;
  }
};

// Force logout a specific user across ALL schools
export const forceLogoutOwnerUser = async (registrationNumber) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/owner/activity/force-logout-user/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Token ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ registration_number: registrationNumber })
    });
    if (!response.ok) throw new Error('Failed to force logout user');
    return await response.json();
  } catch (error) {
    console.error('Error force logging out user:', error);
    throw error;
  }
};

// ============================================
// PER-SCHOOL ENDPOINTS (For detailed view if needed)
// ============================================

// Get all schools
export const getAllSchoolsData = async () => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/schools/stats/all/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch schools');
    const data = await response.json();
    return { schools: data.schools || [] };
  } catch (error) {
    console.error('Error fetching schools:', error);
    return { schools: [] };
  }
};

// Get online status for a specific school
export const getSchoolOnlineStatus = async (schoolId) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/proxy/school/${schoolId}/admin/online-status/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch online status');
    return await response.json();
  } catch (error) {
    console.error('Error fetching online status:', error);
    return { 
      summary: { total_users: 0, total_online: 0, total_offline: 0 }, 
      online_by_role: {}, 
      online_users: [] 
    };
  }
};

// Get login analytics for a specific school
export const getSchoolLoginAnalytics = async (schoolId) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const response = await fetch(`${API_BASE}/proxy/school/${schoolId}/admin/login-analytics/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch login analytics');
    return await response.json();
  } catch (error) {
    console.error('Error fetching login analytics:', error);
    return { 
      today_stats: { successful: 0, failed: 0, success_rate: 0 }, 
      suspicious_users: [], 
      daily_trends: [], 
      locked_accounts: [],
      suspicious_ips: []
    };
  }
};

// Get activity log for a specific school
export const getSchoolActivityLog = async (schoolId, filters = {}) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.activity_type && filters.activity_type !== 'all') params.append('activity_type', filters.activity_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await fetch(`${API_BASE}/proxy/school/${schoolId}/admin/activity-log/?${params}`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch activity log');
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return { activities: [], total: 0, summary: { type_distribution: [], user_leaders: [] } };
  }
};

// Lock a user in a specific school
export const lockSchoolUser = async (schoolId, registrationNumber) => {
  const token = localStorage.getItem('owner_access_token');
  const response = await fetch(`${API_BASE}/proxy/school/${schoolId}/admin/lock-user/${registrationNumber}/`, {
    method: 'POST',
    headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to lock user');
  return await response.json();
};

// Unlock a user in a specific school
export const unlockSchoolUser = async (schoolId, registrationNumber) => {
  const token = localStorage.getItem('owner_access_token');
  const response = await fetch(`${API_BASE}/proxy/school/${schoolId}/admin/unlock-user/${registrationNumber}/`, {
    method: 'POST',
    headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to unlock user');
  return await response.json();
};

// Force logout all users in a specific school
export const forceLogoutSchoolUsers = async (schoolId) => {
  const token = localStorage.getItem('owner_access_token');
  const response = await fetch(`${API_BASE}/proxy/school/${schoolId}/admin/force-logout-all/`, {
    method: 'POST',
    headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to force logout users');
  return await response.json();
};

// Force logout a specific user in a school
export const forceLogoutSchoolUser = async (schoolId, registrationNumber) => {
  const token = localStorage.getItem('owner_access_token');
  const response = await fetch(`${API_BASE}/proxy/school/${schoolId}/admin/force-logout-user/${registrationNumber}/`, {
    method: 'POST',
    headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to force logout user');
  return await response.json();
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Aggregated endpoints
  getOwnerOnlineStatus,
  getOwnerLoginAnalytics,
  getOwnerCompleteActivityLog,
  lockOwnerUser,
  unlockOwnerUser,
  forceLogoutAllOwnerUsers,
  forceLogoutOwnerUser,
  
  // Per-school endpoints
  getAllSchoolsData,
  getSchoolOnlineStatus,
  getSchoolLoginAnalytics,
  getSchoolActivityLog,
  lockSchoolUser,
  unlockSchoolUser,
  forceLogoutSchoolUsers,
  forceLogoutSchoolUser
};