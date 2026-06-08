// owner_panel/frontend/src/services/ownerActivityService.js

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8005/api';

export const getAllSchoolsActivity = async () => {
  try {
    const token = localStorage.getItem('owner_access_token');
    
    // First, get all schools
    const schoolsResponse = await fetch(`${API_BASE}/schools/`, {
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
    });
    
    if (!schoolsResponse.ok) {
      throw new Error('Failed to fetch schools');
    }
    
    const schoolsData = await schoolsResponse.json();
    const schools = schoolsData.schools || [];
    
    // For each school, call the proxy endpoint
    const schoolsWithActivity = await Promise.all(
      schools.map(async (school) => {
        try {
          // Use the proxy endpoint
          const url = `${API_BASE}/proxy/school/${school.school_id}/owner/activity/summary/`;
          
          const activityResponse = await fetch(url, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            return {
              id: school.id,
              school_id: school.school_id,
              name: school.name,
              total_activities: activityData.total_activities || 0,
              today_activities: activityData.today_activities || 0,
              week_activities: activityData.week_activities || 0,
              last_activity: activityData.last_activity,
              health_status: school.metrics?.health_status || 'healthy',
              is_active: school.is_active,
              is_archived: school.is_archived,
              by_type: activityData.by_type || {}
            };
          }
        } catch (err) {
          console.warn(`Could not fetch activity for ${school.name}:`, err);
        }
        
        return {
          id: school.id,
          school_id: school.school_id,
          name: school.name,
          total_activities: 0,
          today_activities: 0,
          week_activities: 0,
          health_status: 'unknown',
          is_active: school.is_active,
          is_archived: school.is_archived,
          by_type: {}
        };
      })
    );
    
    const totalActivities = schoolsWithActivity.reduce((sum, s) => sum + (s.total_activities || 0), 0);
    const todayActivities = schoolsWithActivity.reduce((sum, s) => sum + (s.today_activities || 0), 0);
    const weekActivities = schoolsWithActivity.reduce((sum, s) => sum + (s.week_activities || 0), 0);
    
    const aggregatedByType = {};
    schoolsWithActivity.forEach(school => {
      Object.entries(school.by_type || {}).forEach(([type, count]) => {
        aggregatedByType[type] = (aggregatedByType[type] || 0) + count;
      });
    });
    
    return {
      success: true,
      total_activities: totalActivities,
      today_activities: todayActivities,
      week_activities: weekActivities,
      by_type: aggregatedByType,
      schools: schoolsWithActivity.filter(s => !s.is_archived),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching all schools activity:', error);
    throw error;
  }
};

export const getSchoolActivity = async (schoolId, filters = {}) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    
    const queryParams = new URLSearchParams();
    if (filters.limit) queryParams.append('limit', filters.limit || 50);
    if (filters.offset) queryParams.append('offset', filters.offset || 0);
    if (filters.activity_type && filters.activity_type !== 'all') queryParams.append('activity_type', filters.activity_type);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    
    const url = `${API_BASE}/proxy/school/${schoolId}/owner/activity/list/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch activity: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      school_id: schoolId,
      total: data.total || 0,
      activities: data.activities || [],
      success: true
    };
  } catch (error) {
    console.error(`Error fetching activity:`, error);
    throw error;
  }
};

export const getOwnerActivityStatistics = async () => {
  try {
    const data = await getAllSchoolsActivity();
    return {
      success: true,
      total_schools: data.schools.length,
      total_activities: data.total_activities,
      today_activities: data.today_activities,
      week_activities: data.week_activities,
      by_type: data.by_type || {}
    };
  } catch (error) {
    return {
      success: false,
      total_schools: 0,
      total_activities: 0,
      today_activities: 0,
      week_activities: 0,
      by_type: {}
    };
  }
};

export default {
  getAllSchoolsActivity,
  getSchoolActivity,
  getOwnerActivityStatistics
};