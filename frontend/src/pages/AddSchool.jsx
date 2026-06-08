import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolsApi } from '../api';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Key, 
  CreditCard, 
  Shield, 
  DollarSign, 
  Link, 
  Database,
  RefreshCw,
  Loader2,  
  Trash2,   
  Edit,     
  Eye,
  Plus      
} from 'lucide-react';

export default function AddSchool() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    school_id: '',
    name: '',
    db_name: '',
    api_url: 'http://localhost:8001',
    registration_prefix: 'EDU',
    paystack_public_key: '',
    paystack_secret_key: '',
    portal_fee_public_key: '',
    portal_fee_secret_key: '',
    portal_fee_amount: 1000,
    contact_email: '',
    contact_phone: '',
    address: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.school_id) {
      toast.error('School ID is required');
      return;
    }
    if (!formData.name) {
      toast.error('School name is required');
      return;
    }
    
    // Auto-generate db_name if not provided
    if (!formData.db_name) {
      formData.db_name = `${formData.school_id}_db`;
    }
    
    setLoading(true);
    try {
      const response = await schoolsApi.create(formData);
      toast.success(`School "${response.data.school.name}" created successfully!`);
      navigate(`/schools/${response.data.school.id}`);
    } catch (error) {
      console.error('Creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/schools')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New School</h1>
          <p className="text-gray-500 text-sm mt-1">Register a new school in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Basic Information */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">School ID *</label>
                <input
                  type="text"
                  name="school_id"
                  value={formData.school_id}
                  onChange={handleChange}
                  placeholder="e.g., school_d"
                  className="input font-mono"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and underscores only</p>
              </div>
              <div>
                <label className="label">School Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., New Academy Lagos"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Database Name</label>
                <input
                  type="text"
                  name="db_name"
                  value={formData.db_name}
                  onChange={handleChange}
                  placeholder="Auto-generated from school_id"
                  className="input font-mono"
                />
              </div>
              <div>
                <label className="label">API URL</label>
                <input
                  type="text"
                  name="api_url"
                  value={formData.api_url}
                  onChange={handleChange}
                  placeholder="http://localhost:8001"
                  className="input"
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Prefix
            </label>
            <input
                type="text"
                value={formData.registration_prefix}
                onChange={(e) => setFormData({...formData, registration_prefix: e.target.value.toUpperCase()})}
                placeholder="e.g., EDU, PRIME, GF"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                maxLength="10"
            />
            <p className="text-xs text-gray-400 mt-1">
                Prefix for student/staff registration numbers (min 2 letters, max 10). Default: EDU
            </p>
        </div>


          {/* Contact Information */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact Email</label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="admin@school.com"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Contact Phone</label>
                <input
                  type="text"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+234 800 000 0000"
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="School address"
                  className="input"
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Key size={18} /> Payment Configuration
            </h2>
            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700">School fees use per-school Paystack keys. Portal fees use shared keys.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Paystack Public Key (School Fees)</label>
                <input
                  type="text"
                  name="paystack_public_key"
                  value={formData.paystack_public_key}
                  onChange={handleChange}
                  placeholder="pk_test_..."
                  className="input font-mono text-sm"
                />
              </div>
              <div>
                <label className="label">Paystack Secret Key (School Fees)</label>
                <input
                  type="password"
                  name="paystack_secret_key"
                  value={formData.paystack_secret_key}
                  onChange={handleChange}
                  placeholder="sk_test_..."
                  className="input font-mono text-sm"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CreditCard size={16} /> Portal Fee Configuration (Shared)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Portal Fee Amount (₦)</label>
                  <input
                    type="number"
                    name="portal_fee_amount"
                    value={formData.portal_fee_amount}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Portal Fee Public Key</label>
                  <input
                    type="text"
                    name="portal_fee_public_key"
                    value={formData.portal_fee_public_key}
                    onChange={handleChange}
                    placeholder="pk_test_..."
                    className="input font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="label">Portal Fee Secret Key</label>
                  <input
                    type="password"
                    name="portal_fee_secret_key"
                    value={formData.portal_fee_secret_key}
                    onChange={handleChange}
                    placeholder="sk_test_..."
                    className="input font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/schools')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <><RefreshCw size={16} className="animate-spin" /> Creating...</>
              ) : (
                <><Plus size={16} /> Create School</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}