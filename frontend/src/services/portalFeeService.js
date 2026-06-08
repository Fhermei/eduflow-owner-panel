// owner_panel/frontend/src/services/portalFeeService.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8005/api';

export const portalFeeService = {
  // Get dashboard overview for all schools
  getDashboard: async () => {
    try {
      const token = localStorage.getItem('owner_access_token');
      const response = await fetch(`${API_BASE}/portal-fee/dashboard/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching portal fee dashboard:', error);
      return { success: false, schools: [], summary: { total_schools: 0, total_students: 0, total_paid: 0, total_revenue: 0, collection_rate: 0 } };
    }
  },

  // Get detailed stats for a specific school
  getSchoolDetail: async (schoolId) => {
    try {
      const token = localStorage.getItem('owner_access_token');
      const response = await fetch(`${API_BASE}/portal-fee/school/${schoolId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching school detail for ${schoolId}:`, error);
      return { success: false, stats: { total_students: 0, paid_count: 0, pending_count: 0, total_revenue: 0, collection_rate: 0 } };
    }
  },

  // Update school configuration
  updateSchoolConfig: async (schoolId, config) => {
    try {
      const token = localStorage.getItem('owner_access_token');
      const response = await fetch(`${API_BASE}/portal-fee/school/${schoolId}/config/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating school config:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate invoices for a school
  generateInvoices: async (schoolId, sessionId, termId) => {
    try {
      const token = localStorage.getItem('owner_access_token');
      const response = await fetch(`${API_BASE}/portal-fee/school/${schoolId}/generate-invoices/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId, term_id: termId })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating invoices:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all invoices across all schools
  getAllInvoices: async () => {
    try {
      const token = localStorage.getItem('owner_access_token');
      const response = await fetch(`${API_BASE}/portal-fee/invoices/all/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all invoices:', error);
      return { success: true, invoices: [], count: 0 };
    }
  },

  // Get all payments across all schools
  getAllPayments: async () => {
    try {
      const token = localStorage.getItem('owner_access_token');
      const response = await fetch(`${API_BASE}/portal-fee/payments/all/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all payments:', error);
      return { success: true, payments: [], count: 0 };
    }
  },

  // Bulk generate invoices for all schools
  bulkGenerateInvoices: async (sessionId, termId) => {
    try {
      const token = localStorage.getItem('owner_access_token');
      const response = await fetch(`${API_BASE}/portal-fee/bulk-generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId, term_id: termId })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error bulk generating invoices:', error);
      return { success: false, error: error.message };
    }
  }
};

export default portalFeeService;