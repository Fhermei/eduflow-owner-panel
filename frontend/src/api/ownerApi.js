import api from '../api';

export const ownerApi = {
  // Get comprehensive dashboard with all schools data
  getComprehensiveDashboard: () => api.get('/owner/comprehensive-dashboard/'),
  
  // Get per-school activity details
  getPerSchoolActivity: (schoolId) => api.get(`/owner/per-school-activity/${schoolId}/`),
  
  // Force logout all users in a specific school
  forceLogoutSchool: (schoolId) => api.post(`/owner/force-logout-school/${schoolId}/`),
  
  // Manage user in a school (archive/restore)
  manageSchoolUser: (schoolId, registrationNumber, action, reason = '') => 
    api.post('/owner/manage-school-user/', { 
      school_id: schoolId, 
      registration_number: registrationNumber, 
      action, 
      reason 
    }),
  
  // Get all failed login attempts across all schools
  getAllFailedLogins: () => api.get('/owner/all-failed-logins/'),
  
  // Unlock a user across all schools
  unlockUserAllSchools: (registrationNumber) => 
    api.post('/owner/unlock-user-all-schools/', { registration_number: registrationNumber }),
};