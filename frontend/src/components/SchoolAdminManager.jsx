// // owner_panel/frontend/src/components/SchoolAdminManager.jsx
// import React, { useState, useEffect } from 'react';
// import { X, UserPlus, UserCheck, UserX, Shield, Mail, Phone, Calendar, Eye, EyeOff, RefreshCw } from 'lucide-react';
// import { toast } from 'react-hot-toast';
// import api from '../api';

// const SchoolAdminManager = ({ school, onClose, onAdminUpdate }) => {
//   const [admins, setAdmins] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     phone_number: '',
//     password: '',
//     confirm_password: '',
//     role: 'head',
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     fetchAdmins();
//   }, [school.id]);

//   const fetchAdmins = async () => {
//     setLoading(true);
//     try {
//       const response = await api.get(`/schools/${school.id}/admins/`);
//       setAdmins(response.data.admins || []);
//     } catch (error) {
//       console.error('Error fetching admins:', error);
//       toast.error('Failed to load admin users');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddAdmin = async (e) => {
//     e.preventDefault();
    
//     if (formData.password !== formData.confirm_password) {
//       toast.error('Passwords do not match');
//       return;
//     }
    
//     if (formData.password.length < 5) {
//       toast.error('Password must be at least 5 characters');
//       return;
//     }
    
//     setSubmitting(true);
//     try {
//       const response = await api.post(`/schools/${school.id}/admins/add/`, {
//         first_name: formData.first_name,
//         last_name: formData.last_name,
//         email: formData.email,
//         phone_number: formData.phone_number,
//         password: formData.password,
//         role: formData.role,
//       });
      
//       toast.success(response.data.message);
//       setShowAddForm(false);
//       setFormData({
//         first_name: '',
//         last_name: '',
//         email: '',
//         phone_number: '',
//         password: '',
//         confirm_password: '',
//         role: 'head',
//       });
//       fetchAdmins();
//       if (onAdminUpdate) onAdminUpdate();
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Failed to add admin');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDisableAdmin = async (adminId) => {
//     if (!window.confirm('Disable this admin user? They will not be able to login.')) return;
    
//     try {
//       const response = await api.post(`/schools/${school.id}/admins/${adminId}/disable/`);
//       toast.success(response.data.message);
//       fetchAdmins();
//       if (onAdminUpdate) onAdminUpdate();
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Failed to disable admin');
//     }
//   };

//   const handleRestoreAdmin = async (adminId) => {
//     try {
//       const response = await api.post(`/schools/${school.id}/admins/${adminId}/restore/`);
//       toast.success(response.data.message);
//       fetchAdmins();
//       if (onAdminUpdate) onAdminUpdate();
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Failed to restore admin');
//     }
//   };

//   const getRoleBadge = (role) => {
//     const badges = {
//       head: 'bg-purple-100 text-purple-700',
//       hm: 'bg-indigo-100 text-indigo-700',
//       principal: 'bg-blue-100 text-blue-700',
//       vice_principal: 'bg-cyan-100 text-cyan-700',
//     };
//     const displayNames = {
//       head: 'Head of School',
//       hm: 'Head Master',
//       principal: 'Principal',
//       vice_principal: 'Vice Principal',
//     };
//     return {
//       color: badges[role] || 'bg-gray-100 text-gray-700',
//       name: displayNames[role] || role
//     };
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between p-5 border-b border-gray-100">
//           <div>
//             <h2 className="text-lg font-bold text-gray-800">Admin Users - {school.name}</h2>
//             <p className="text-xs text-gray-400 mt-1">
//               Registration Prefix: <span className="font-mono font-bold text-[#D94801]">{school.registration_prefix}</span>
//             </p>
//           </div>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
//             <X size={20} className="text-gray-500" />
//           </button>
//         </div>

//         {/* Add Admin Button */}
//         <div className="p-4 border-b border-gray-100 flex justify-between items-center">
//           <p className="text-sm text-gray-500">
//             {admins.length} admin user{admins.length !== 1 ? 's' : ''} found
//           </p>
//           <button
//             onClick={() => setShowAddForm(!showAddForm)}
//             className="flex items-center gap-2 px-4 py-2 bg-[#D94801] text-white rounded-xl text-sm font-medium hover:bg-[#C24000] transition-colors"
//           >
//             <UserPlus size={16} /> Add Admin
//           </button>
//         </div>

//         {/* Add Admin Form */}
//         {showAddForm && (
//           <div className="p-5 bg-gray-50 border-b border-gray-100">
//             <h3 className="font-semibold text-gray-800 mb-4">Add New School Admin</h3>
//             <form onSubmit={handleAddAdmin} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
//                   <input
//                     type="text"
//                     value={formData.first_name}
//                     onChange={(e) => setFormData({...formData, first_name: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
//                   <input
//                     type="text"
//                     value={formData.last_name}
//                     onChange={(e) => setFormData({...formData, last_name: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
//                   <input
//                     type="email"
//                     value={formData.email}
//                     onChange={(e) => setFormData({...formData, email: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
//                   <input
//                     type="tel"
//                     value={formData.phone_number}
//                     onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
//                   <select
//                     value={formData.role}
//                     onChange={(e) => setFormData({...formData, role: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                   >
//                     <option value="head">Head of School</option>
//                     <option value="hm">Head Master</option>
//                     <option value="principal">Principal</option>
//                     <option value="vice_principal">Vice Principal</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
//                   <div className="relative">
//                     <input
//                       type={showPassword ? 'text' : 'password'}
//                       value={formData.password}
//                       onChange={(e) => setFormData({...formData, password: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801] pr-10"
//                       required
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//                     >
//                       {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
//                     </button>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password *</label>
//                   <input
//                     type="password"
//                     value={formData.confirm_password}
//                     onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end gap-3 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => setShowAddForm(false)}
//                   className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className="px-4 py-2 bg-[#D94801] text-white text-sm rounded-lg hover:bg-[#C24000] disabled:opacity-50"
//                 >
//                   {submitting ? 'Creating...' : 'Create Admin'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         )}

//         {/* Admins List */}
//         <div className="flex-1 overflow-y-auto p-4">
//           {loading ? (
//             <div className="flex justify-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D94801]" />
//             </div>
//           ) : admins.length === 0 ? (
//             <div className="text-center py-12">
//               <Shield size={48} className="mx-auto text-gray-300 mb-3" />
//               <p className="text-gray-400">No admin users found</p>
//               <p className="text-xs text-gray-400 mt-1">Click "Add Admin" to create the first admin</p>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {admins.map((admin) => {
//                 const roleBadge = getRoleBadge(admin.role);
//                 return (
//                   <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
//                     <div className="flex items-center gap-4">
//                       <div className="w-10 h-10 bg-[#D94801]/10 rounded-full flex items-center justify-center">
//                         <Shield size={20} className="text-[#D94801]" />
//                       </div>
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <p className="font-medium text-gray-800">
//                             {admin.first_name} {admin.last_name}
//                           </p>
//                           <span className={`text-[9px] px-2 py-0.5 rounded-full ${roleBadge.color}`}>
//                             {roleBadge.name}
//                           </span>
//                           {!admin.is_active && (
//                             <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">
//                               Disabled
//                             </span>
//                           )}
//                         </div>
//                         <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
//                           <span className="font-mono text-[10px]">{admin.registration_number}</span>
//                           {admin.email && (
//                             <span className="flex items-center gap-1">
//                               <Mail size={10} /> {admin.email}
//                             </span>
//                           )}
//                           {admin.phone_number && (
//                             <span className="flex items-center gap-1">
//                               <Phone size={10} /> {admin.phone_number}
//                             </span>
//                           )}
//                           <span className="flex items-center gap-1">
//                             <Calendar size={10} /> {new Date(admin.created_at).toLocaleDateString()}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       {admin.is_active ? (
//                         <button
//                           onClick={() => handleDisableAdmin(admin.id)}
//                           className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                           title="Disable Admin"
//                         >
//                           <UserX size={16} />
//                         </button>
//                       ) : (
//                         <button
//                           onClick={() => handleRestoreAdmin(admin.id)}
//                           className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
//                           title="Restore Admin"
//                         >
//                           <UserCheck size={16} />
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="p-4 border-t border-gray-100 flex justify-between items-center">
//           <button
//             onClick={fetchAdmins}
//             className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
//           >
//             <RefreshCw size={14} /> Refresh
//           </button>
//           <p className="text-xs text-gray-400">
//             Registration number format: {school.registration_prefix}_XXXX
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SchoolAdminManager;



// owner_panel/frontend/src/components/SchoolAdminManager.jsx
import React, { useState, useEffect } from 'react';
import {
  X, UserPlus, UserCheck, UserX, Shield,
  Mail, Phone, Calendar, Eye, EyeOff, RefreshCw,
  AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { schoolsApi } from '../api'; // ← use schoolsApi not bare api

const SchoolAdminManager = ({ school, onClose, onAdminUpdate }) => {
  const [admins, setAdmins]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [disablingId, setDisablingId] = useState(null); // track which button is loading
  const [restoringId, setRestoringId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');   // page-level error banner

  const [formData, setFormData] = useState({
    first_name:       '',
    last_name:        '',
    email:            '',
    phone_number:     '',
    password:         '',
    confirm_password: '',
    role:             'head',
  });

  useEffect(() => {
    fetchAdmins();
  }, [school.id]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await schoolsApi.getAdmins(school.id);
      if (response.data.success) {
        setAdmins(response.data.admins || []);
      } else {
        const msg = response.data.error || 'Failed to load admins';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load admin users';
      setError(msg);
      toast.error(msg);
      console.error('fetchAdmins error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Add Admin ────────────────────────────────────────────────────────────
  const handleAddAdmin = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 5) {
      toast.error('Password must be at least 5 characters');
      return;
    }

    setSubmitting(true);
    try {
      const response = await schoolsApi.addAdmin(school.id, {
        first_name:   formData.first_name,
        last_name:    formData.last_name,
        email:        formData.email,
        phone_number: formData.phone_number,
        password:     formData.password,
        role:         formData.role,
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Admin created successfully');
        setShowAddForm(false);
        setFormData({
          first_name: '', last_name: '', email: '',
          phone_number: '', password: '', confirm_password: '', role: 'head',
        });
        fetchAdmins();
        if (onAdminUpdate) onAdminUpdate();
      } else {
        const msg = response.data.error || 'Failed to create admin';
        toast.error(msg);
        console.error('addAdmin backend error:', response.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error
               || err.response?.data?.detail
               || err.message
               || 'Failed to add admin';
      toast.error(msg);
      console.error('addAdmin exception:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Disable ──────────────────────────────────────────────────────────────
  const handleDisableAdmin = async (admin) => {
    if (!window.confirm(
      `Disable ${admin.first_name} ${admin.last_name}?\n` +
      `They will NOT be able to login until restored.`
    )) return;

    setDisablingId(admin.id);
    try {
      const response = await schoolsApi.disableAdmin(school.id, admin.id, 'Disabled by owner');

      if (response.data.success) {
        toast.success(
          response.data.message || `${admin.first_name} ${admin.last_name} disabled`
        );
        // optimistic local update — avoids full refetch flicker
        setAdmins(prev =>
          prev.map(a => a.id === admin.id ? { ...a, is_active: false } : a)
        );
        if (onAdminUpdate) onAdminUpdate();
      } else {
        const msg = response.data.error || 'Failed to disable admin';
        toast.error(msg);
        console.error('disableAdmin backend error:', response.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error
               || err.response?.data?.detail
               || err.message
               || 'Failed to disable admin';
      toast.error(msg);
      console.error('disableAdmin exception:', err.response?.data || err);
    } finally {
      setDisablingId(null);
    }
  };

  // ─── Restore ──────────────────────────────────────────────────────────────
  const handleRestoreAdmin = async (admin) => {
    if (!window.confirm(
      `Restore ${admin.first_name} ${admin.last_name}?\n` +
      `They will be able to login again.`
    )) return;

    setRestoringId(admin.id);
    try {
      const response = await schoolsApi.restoreAdmin(school.id, admin.id);

      if (response.data.success) {
        toast.success(
          response.data.message || `${admin.first_name} ${admin.last_name} restored`
        );
        // optimistic local update
        setAdmins(prev =>
          prev.map(a => a.id === admin.id ? { ...a, is_active: true } : a)
        );
        if (onAdminUpdate) onAdminUpdate();
      } else {
        const msg = response.data.error || 'Failed to restore admin';
        toast.error(msg);
        console.error('restoreAdmin backend error:', response.data);
      }
    } catch (err) {
      const msg = err.response?.data?.error
               || err.response?.data?.detail
               || err.message
               || 'Failed to restore admin';
      toast.error(msg);
      console.error('restoreAdmin exception:', err.response?.data || err);
    } finally {
      setRestoringId(null);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getRoleBadge = (role) => {
    const map = {
      head:          { color: 'bg-purple-100 text-purple-700', name: 'Head of School' },
      hm:            { color: 'bg-indigo-100 text-indigo-700', name: 'Head Master'    },
      principal:     { color: 'bg-blue-100 text-blue-700',     name: 'Principal'      },
      vice_principal:{ color: 'bg-cyan-100 text-cyan-700',     name: 'Vice Principal' },
    };
    return map[role] || { color: 'bg-gray-100 text-gray-700', name: role };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleDateString(); }
    catch { return dateStr; }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Admin Users — {school.name}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Registration Prefix:{' '}
              <span className="font-mono font-bold text-[#D94801]">
                {school.registration_prefix || 'EDU'}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${admins.length} admin${admins.length !== 1 ? 's' : ''} found`}
          </p>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D94801] text-white rounded-xl text-sm font-medium hover:bg-[#C24000] transition-colors"
          >
            <UserPlus size={16} />
            {showAddForm ? 'Cancel' : 'Add Admin'}
          </button>
        </div>

        {/* ── Add Admin Form ── */}
        {showAddForm && (
          <div className="p-5 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">New School Admin</h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                  >
                    <option value="head">Head of School</option>
                    <option value="hm">Head Master</option>
                    <option value="principal">Principal</option>
                    <option value="vice_principal">Vice Principal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirm_password}
                    onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                    required
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D94801] text-white text-sm rounded-lg hover:bg-[#C24000] disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Creating…' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Admins List ── */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={32} className="animate-spin text-[#D94801]" />
              <p className="text-sm text-gray-400">Loading admin users…</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12">
              <Shield size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">No admin users found</p>
              <p className="text-xs text-gray-400 mt-1">Click "Add Admin" to create the first admin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => {
                const badge         = getRoleBadge(admin.role);
                const isDisabling   = disablingId === admin.id;
                const isRestoring   = restoringId === admin.id;
                const isBusy        = isDisabling || isRestoring;

                return (
                  <div
                    key={admin.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      admin.is_active
                        ? 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                        : 'bg-red-50 border-red-100'
                    }`}
                  >
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        admin.is_active ? 'bg-[#D94801]/10' : 'bg-red-100'
                      }`}>
                        <Shield size={20} className={admin.is_active ? 'text-[#D94801]' : 'text-red-400'} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-800">
                            {admin.first_name} {admin.last_name}
                          </p>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                            {badge.name}
                          </span>
                          {!admin.is_active && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                              Disabled
                            </span>
                          )}
                          {admin.is_active && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                          <span className="font-mono text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">
                            {admin.registration_number}
                          </span>
                          {admin.email && (
                            <span className="flex items-center gap-1">
                              <Mail size={10} /> {admin.email}
                            </span>
                          )}
                          {admin.phone_number && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} /> {admin.phone_number}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> {formatDate(admin.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: action button */}
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      {admin.is_active ? (
                        <button
                          onClick={() => handleDisableAdmin(admin)}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Disable this admin"
                        >
                          {isDisabling
                            ? <Loader2 size={12} className="animate-spin" />
                            : <UserX size={12} />
                          }
                          {isDisabling ? 'Disabling…' : 'Disable'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreAdmin(admin)}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Restore this admin"
                        >
                          {isRestoring
                            ? <Loader2 size={12} className="animate-spin" />
                            : <UserCheck size={12} />
                          }
                          {isRestoring ? 'Restoring…' : 'Restore'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={fetchAdmins}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <p className="text-xs text-gray-400">
            New admins get format: {school.registration_prefix || 'EDU'}_XXXX
          </p>
        </div>

      </div>
    </div>
  );
};

export default SchoolAdminManager;