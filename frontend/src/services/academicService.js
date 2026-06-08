// owner_panel/frontend/src/services/academicService.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8005/api';

export const getAcademicSessionsForSchool = async (schoolId) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    
    const response = await fetch(`${API_BASE}/academic/sessions/?school_id=${schoolId}`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error(`Error fetching sessions for ${schoolId}:`, error);
    return [];
  }
};

export const getAcademicTermsForSchool = async (schoolId) => {
  try {
    const token = localStorage.getItem('owner_access_token');
    
    const response = await fetch(`${API_BASE}/academic/terms/?school_id=${schoolId}`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error(`Error fetching terms for ${schoolId}:`, error);
    return [];
  }
};

export const academicService = {
  getAcademicSessionsForSchool,
  getAcademicTermsForSchool
};

export default academicService;