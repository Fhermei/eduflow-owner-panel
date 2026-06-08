// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { schoolsApi } from '../api';
// import SchoolAdminManager from '../components/SchoolAdminManager';
// import { toast } from 'react-hot-toast';
// import { ArrowLeft, Edit2, Save, X, RefreshCw, Archive, RotateCcw, Shield } from 'lucide-react';

// export default function SchoolDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [school, setSchool] = useState(null);
//   const [metrics, setMetrics] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(false);
//   const [editForm, setEditForm] = useState({});
//   const [syncing, setSyncing] = useState(false);
//   const [showAdminManager, setShowAdminManager] = useState(false);

//   useEffect(() => {
//     loadSchool();
//   }, [id]);

//   const loadSchool = async () => {
//     setLoading(true);
//     try {
//       const schoolRes = await schoolsApi.get(id);
//       setSchool(schoolRes.data.school);
//       setMetrics(schoolRes.data.school.metrics);
//       setEditForm(schoolRes.data.school);
//     } catch (error) {
//       console.error('Failed to load school:', error);
//       toast.error('School not found');
//       navigate('/schools');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSync = async () => {
//     setSyncing(true);
//     toast.loading('Syncing school data...', { id: 'sync' });
//     try {
//       const response = await schoolsApi.sync(id);
//       setSchool(response.data.school);
//       setMetrics(response.data.school.metrics);
//       toast.success('School data synced', { id: 'sync' });
//     } catch (error) {
//       toast.error('Failed to sync', { id: 'sync' });
//     } finally {
//       setSyncing(false);
//     }
//   };

//   const handleUpdate = async () => {
//     toast.loading('Updating school...', { id: 'update' });
//     try {
//       const response = await schoolsApi.update(id, editForm);
//       setSchool(response.data.school);
//       setMetrics(response.data.school.metrics);
//       setEditing(false);
//       toast.success('School updated', { id: 'update' });
//     } catch (error) {
//       toast.error('Failed to update', { id: 'update' });
//     }
//   };

//   const handleArchive = async () => {
//     if (confirm(`Archive "${school?.name}"?`)) {
//       try {
//         await schoolsApi.archive(id, 'Archived by owner');
//         toast.success('School archived');
//         loadSchool();
//       } catch (error) {
//         toast.error('Failed to archive');
//       }
//     }
//   };

//   const handleRestore = async () => {
//     try {
//       await schoolsApi.restore(id);
//       toast.success('School restored');
//       loadSchool();
//     } catch (error) {
//       toast.error('Failed to restore');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="text-center">
//           <RefreshCw className="animate-spin h-8 w-8 text-[#D94801] mx-auto mb-4" />
//           <p className="text-gray-400">Loading school details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!school) return null;

//   const StatBox = ({ title, value }) => (
//     <div className="bg-white rounded-xl p-4 border border-gray-100">
//       <p className="text-2xl font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
//       <p className="text-sm text-gray-500 mt-1">{title}</p>
//     </div>
//   );

//   return (
//     <div>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-3">
//           <button onClick={() => navigate('/schools')} className="p-2 hover:bg-gray-100 rounded-lg">
//             <ArrowLeft size={20} />
//           </button>
//           <div>
//             <h1 className="text-2xl font-bold text-gray-800">{school.name}</h1>
//             <p className="text-sm text-gray-500">{school.school_id}</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           {!editing ? (
//             <>
//               <button 
//                 onClick={() => setEditing(true)} 
//                 className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
//               >
//                 <Edit2 size={16} className="inline mr-1" /> Edit
//               </button>
//               <button
//                 onClick={() => setShowAdminManager(true)}
//                 className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
//               >
//                 <Shield size={16} /> Manage Admins
//               </button>
//               <button 
//                 onClick={handleSync} 
//                 disabled={syncing} 
//                 className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
//               >
//                 <RefreshCw size={16} className={`inline mr-1 ${syncing ? 'animate-spin' : ''}`} /> Sync
//               </button>
//               {!school.is_archived ? (
//                 <button 
//                   onClick={handleArchive} 
//                   className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
//                 >
//                   <Archive size={16} className="inline mr-1" /> Archive
//                 </button>
//               ) : (
//                 <button 
//                   onClick={handleRestore} 
//                   className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
//                 >
//                   <RotateCcw size={16} className="inline mr-1" /> Restore
//                 </button>
//               )}
//             </>
//           ) : (
//             <>
//               <button 
//                 onClick={handleUpdate} 
//                 className="px-4 py-2 bg-[#D94801] text-white rounded-lg hover:bg-[#C24000] transition-colors"
//               >
//                 <Save size={16} className="inline mr-1" /> Save
//               </button>
//               <button 
//                 onClick={() => setEditing(false)} 
//                 className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
//               >
//                 <X size={16} className="inline mr-1" /> Cancel
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <StatBox title="Total Users" value={metrics?.total_users || 0} />
//         <StatBox title="Students" value={metrics?.total_students || 0} />
//         <StatBox title="Staff" value={metrics?.total_staff || 0} />
//         <StatBox title="Revenue" value={`₦${(metrics?.total_revenue || 0).toLocaleString()}`} />
//       </div>

//       {/* Two Column Layout */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* School Information */}
//         <div className="bg-white rounded-2xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold text-gray-800 mb-4">School Information</h2>
          
//           {editing ? (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
//                 <input
//                   type="text"
//                   value={editForm.name || ''}
//                   onChange={(e) => setEditForm({...editForm, name: e.target.value})}
//                   className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
//                 <input
//                   type="text"
//                   value={editForm.api_url || ''}
//                   onChange={(e) => setEditForm({...editForm, api_url: e.target.value})}
//                   className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                 />
//               </div>
              
//               {/* Registration Prefix Field */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Registration Prefix
//                 </label>
//                 <input
//                   type="text"
//                   value={editForm.registration_prefix || 'CTS'}
//                   onChange={(e) => setEditForm({...editForm, registration_prefix: e.target.value.toUpperCase()})}
//                   className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                   maxLength="10"
//                   placeholder="e.g., CTS, PRIME, GF"
//                 />
//                 <p className="text-xs text-gray-400 mt-1">
//                   Prefix for student/staff registration numbers. <strong>Changes affect new users only.</strong> (Min 2 letters, max 10)
//                 </p>
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
//                 <input
//                   type="email"
//                   value={editForm.contact_email || ''}
//                   onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})}
//                   className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
//                 <input
//                   type="text"
//                   value={editForm.contact_phone || ''}
//                   onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})}
//                   className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                 <select
//                   value={editForm.is_active ? 'active' : 'inactive'}
//                   onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'active'})}
//                   className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
//                 >
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                 </select>
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               <p><span className="text-gray-500">API Endpoint:</span> {school.api_url}</p>
//               <p><span className="text-gray-500">Registration Prefix:</span> 
//                 <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-sm font-mono">
//                   {school.registration_prefix || 'CTS'}
//                 </span>
//                 <span className="text-xs text-gray-400 ml-2">(Used for new student/staff registrations)</span>
//               </p>
//               {school.contact_email && <p><span className="text-gray-500">Email:</span> {school.contact_email}</p>}
//               {school.contact_phone && <p><span className="text-gray-500">Phone:</span> {school.contact_phone}</p>}
//               <p><span className="text-gray-500">Status:</span> 
//                 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
//                   school.is_archived ? 'bg-gray-100 text-gray-600' : 
//                   school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                 }`}>
//                   {school.is_archived ? 'Archived' : school.is_active ? 'Active' : 'Inactive'}
//                 </span>
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Payment Configuration */}
//         <div className="bg-white rounded-2xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Configuration</h2>
          
//           {editing ? (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Paystack Public Key</label>
//                 <input
//                   type="text"
//                   value={editForm.paystack_public_key || ''}
//                   onChange={(e) => setEditForm({...editForm, paystack_public_key: e.target.value})}
//                   className="w-full px-3 py-2 border rounded-lg"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Paystack Secret Key</label>
//                 <input
//                   type="password"
//                   value={editForm.paystack_secret_key || ''}
//                   onChange={(e) => setEditForm({...editForm, paystack_secret_key: e.target.value})}
//                   className="w-full px-3 py-2 border rounded-lg"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Portal Fee Amount (₦)</label>
//                 <input
//                   type="number"
//                   value={editForm.portal_fee_amount || 1000}
//                   onChange={(e) => setEditForm({...editForm, portal_fee_amount: parseFloat(e.target.value)})}
//                   className="w-full px-3 py-2 border rounded-lg"
//                 />
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               <p><span className="text-gray-500">Paystack Key:</span> {school.paystack_public_key ? `${school.paystack_public_key.substring(0, 20)}...` : 'Not configured'}</p>
//               <p><span className="text-gray-500">Portal Fee Amount:</span> ₦{school.portal_fee_amount || 1000}</p>
//             </div>
//           )}
//         </div>

//         {/* System Health */}
//         <div className="bg-white rounded-2xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold text-gray-800 mb-4">System Health</h2>
//           <div className="space-y-3">
//             <p><span className="text-gray-500">Server Status:</span> 
//               <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
//                 metrics?.health_status === 'healthy' ? 'bg-green-100 text-green-700' :
//                 metrics?.health_status === 'unhealthy' ? 'bg-yellow-100 text-yellow-700' :
//                 metrics?.health_status === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
//               }`}>
//                 {metrics?.health_status || 'Unknown'}
//               </span>
//             </p>
//             <p><span className="text-gray-500">Response Time:</span> {Math.round(metrics?.response_time_ms || 0)} ms</p>
//             <p><span className="text-gray-500">Last Sync:</span> {school.last_sync_at ? new Date(school.last_sync_at).toLocaleString() : 'Never'}</p>
//             <button 
//               onClick={handleSync} 
//               disabled={syncing}
//               className="mt-2 text-sm text-[#D94801] hover:underline disabled:opacity-50"
//             >
//               {syncing ? 'Syncing...' : 'Sync Now'}
//             </button>
//           </div>
//         </div>

//         {/* Role Distribution */}
//         <div className="bg-white rounded-2xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold text-gray-800 mb-4">Role Distribution</h2>
//           <div className="space-y-2">
//             {metrics?.role_breakdown && Object.entries(metrics.role_breakdown).length > 0 ? (
//               Object.entries(metrics.role_breakdown).map(([role, count]) => (
//                 <div key={role} className="flex justify-between items-center py-1 border-b border-gray-50">
//                   <span className="text-gray-600 capitalize">{role.replace(/_/g, ' ')}</span>
//                   <span className="font-medium">{count.toLocaleString()}</span>
//                 </div>
//               ))
//             ) : (
//               <p className="text-gray-400 text-center py-4">No role data available</p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Admin Manager Modal */}
//       {showAdminManager && (
//         <SchoolAdminManager
//           school={school}
//           onClose={() => setShowAdminManager(false)}
//           onAdminUpdate={loadSchool}
//         />
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schoolsApi } from '../api';
import SchoolAdminManager from '../components/SchoolAdminManager';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Edit2, Save, X, RefreshCw, Archive, RotateCcw, Shield, Database } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8005/api';

export default function SchoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [populating, setPopulating] = useState(false);

  useEffect(() => {
    loadSchool();
  }, [id]);

  const loadSchool = async () => {
    setLoading(true);
    try {
      const schoolRes = await schoolsApi.get(id);
      setSchool(schoolRes.data.school);
      setMetrics(schoolRes.data.school.metrics);
      setEditForm(schoolRes.data.school);
    } catch (error) {
      console.error('Failed to load school:', error);
      toast.error('School not found');
      navigate('/schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    toast.loading('Syncing school data...', { id: 'sync' });
    try {
      const response = await schoolsApi.sync(id);
      setSchool(response.data.school);
      setMetrics(response.data.school.metrics);
      toast.success('School data synced', { id: 'sync' });
    } catch (error) {
      toast.error('Failed to sync', { id: 'sync' });
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdate = async () => {
    toast.loading('Updating school...', { id: 'update' });
    try {
      const response = await schoolsApi.update(id, editForm);
      setSchool(response.data.school);
      setMetrics(response.data.school.metrics);
      setEditing(false);
      toast.success('School updated', { id: 'update' });
    } catch (error) {
      toast.error('Failed to update', { id: 'update' });
    }
  };

  const handleArchive = async () => {
    if (confirm(`Archive "${school?.name}"?`)) {
      try {
        await schoolsApi.archive(id, 'Archived by owner');
        toast.success('School archived');
        loadSchool();
      } catch (error) {
        toast.error('Failed to archive');
      }
    }
  };

  const handleRestore = async () => {
    try {
      await schoolsApi.restore(id);
      toast.success('School restored');
      loadSchool();
    } catch (error) {
      toast.error('Failed to restore');
    }
  };

  const handlePopulateAcademic = async (force = false) => {
    if (!school) return;

    setPopulating(true);
    const toastId = 'populate-academic';
    toast.loading(
      force
        ? `Re-populating academic data for ${school.name}...`
        : `Populating academic data for ${school.name}...`,
      { id: toastId }
    );

    try {
      const token = localStorage.getItem('owner_access_token');

      // Use the correct endpoint - note the school_id in the URL
      const response = await fetch(
        `${API_BASE}/schools/${school.school_id}/populate-academic/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
          body: JSON.stringify({ force }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.already_existed && !force) {
          toast.success(
            `${school.name}: Data already exists — ${data.programs} programs, ${data.class_levels} class levels, ${data.subjects} subjects. Use Force to re-populate.`,
            { id: toastId, duration: 6000 }
          );
        } else {
          toast.success(
            `${school.name}: Populated ${data.programs} programs, ${data.class_levels} class levels, ${data.subjects} subjects.`,
            { id: toastId, duration: 6000 }
          );
        }
        // Refresh school data to show updated metrics
        loadSchool();
      } else {
        toast.error(data.error || 'Population failed', { id: toastId });
      }
    } catch (error) {
      console.error('Populate error:', error);
      toast.error('Could not reach school backend. Make sure the Django server is running on port 8000.', { id: toastId });
    } finally {
      setPopulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-[#D94801] mx-auto mb-4" />
          <p className="text-gray-400">Loading school details...</p>
        </div>
      </div>
    );
  }

  if (!school) return null;

  const StatBox = ({ title, value }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <p className="text-2xl font-bold text-gray-800">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/schools')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{school.name}</h1>
            <p className="text-sm text-gray-500">{school.school_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit2 size={16} className="inline mr-1" /> Edit
              </button>
              <button
                onClick={() => setShowAdminManager(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                <Shield size={16} /> Manage Admins
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={`inline mr-1 ${syncing ? 'animate-spin' : ''}`} /> Sync
              </button>
              {!school.is_archived ? (
                <button
                  onClick={handleArchive}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <Archive size={16} className="inline mr-1" /> Archive
                </button>
              ) : (
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <RotateCcw size={16} className="inline mr-1" /> Restore
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-[#D94801] text-white rounded-lg hover:bg-[#C24000] transition-colors"
              >
                <Save size={16} className="inline mr-1" /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="inline mr-1" /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox title="Total Users" value={metrics?.total_users || 0} />
        <StatBox title="Students" value={metrics?.total_students || 0} />
        <StatBox title="Staff" value={metrics?.total_staff || 0} />
        <StatBox title="Revenue" value={`₦${(metrics?.total_revenue || 0).toLocaleString()}`} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Information */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">School Information</h2>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                <input
                  type="text"
                  value={editForm.api_url || ''}
                  onChange={(e) => setEditForm({ ...editForm, api_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Prefix
                </label>
                <input
                  type="text"
                  value={editForm.registration_prefix || 'CTS'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, registration_prefix: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                  maxLength="10"
                  placeholder="e.g., CTS, PRIME, GF"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Prefix for student/staff registration numbers.{' '}
                  <strong>Changes affect new users only.</strong> (Min 2 letters, max 10)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editForm.contact_email || ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editForm.contact_phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.is_active ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_active: e.target.value === 'active' })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                <span className="text-gray-500">API Endpoint:</span> {school.api_url}
              </p>
              <p>
                <span className="text-gray-500">Registration Prefix:</span>
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-sm font-mono">
                  {school.registration_prefix || 'CTS'}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  (Used for new student/staff registrations)
                </span>
              </p>
              {school.contact_email && (
                <p>
                  <span className="text-gray-500">Email:</span> {school.contact_email}
                </p>
              )}
              {school.contact_phone && (
                <p>
                  <span className="text-gray-500">Phone:</span> {school.contact_phone}
                </p>
              )}
              <p>
                <span className="text-gray-500">Status:</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    school.is_archived
                      ? 'bg-gray-100 text-gray-600'
                      : school.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {school.is_archived ? 'Archived' : school.is_active ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Payment Configuration */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Configuration</h2>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paystack Public Key
                </label>
                <input
                  type="text"
                  value={editForm.paystack_public_key || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, paystack_public_key: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paystack Secret Key
                </label>
                <input
                  type="password"
                  value={editForm.paystack_secret_key || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, paystack_secret_key: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portal Fee Amount (₦)
                </label>
                <input
                  type="number"
                  value={editForm.portal_fee_amount || 1000}
                  onChange={(e) =>
                    setEditForm({ ...editForm, portal_fee_amount: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                <span className="text-gray-500">Paystack Key:</span>{' '}
                {school.paystack_public_key
                  ? `${school.paystack_public_key.substring(0, 20)}...`
                  : 'Not configured'}
              </p>
              <p>
                <span className="text-gray-500">Portal Fee Amount:</span> ₦
                {school.portal_fee_amount || 1000}
              </p>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Health</h2>
          <div className="space-y-3">
            <p>
              <span className="text-gray-500">Server Status:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  metrics?.health_status === 'healthy'
                    ? 'bg-green-100 text-green-700'
                    : metrics?.health_status === 'unhealthy'
                    ? 'bg-yellow-100 text-yellow-700'
                    : metrics?.health_status === 'down'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {metrics?.health_status || 'Unknown'}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Response Time:</span>{' '}
              {Math.round(metrics?.response_time_ms || 0)} ms
            </p>
            <p>
              <span className="text-gray-500">Last Sync:</span>{' '}
              {school.last_sync_at ? new Date(school.last_sync_at).toLocaleString() : 'Never'}
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="mt-2 text-sm text-[#D94801] hover:underline disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Role Distribution</h2>
          <div className="space-y-2">
            {metrics?.role_breakdown && Object.entries(metrics.role_breakdown).length > 0 ? (
              Object.entries(metrics.role_breakdown).map(([role, count]) => (
                <div
                  key={role}
                  className="flex justify-between items-center py-1 border-b border-gray-50"
                >
                  <span className="text-gray-600 capitalize">{role.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{count.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No role data available</p>
            )}
          </div>
        </div>

        {/* Academic Data Population */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Academic Data</h2>
          <p className="text-sm text-gray-500 mb-4">
            Populate this school's database with all Nigerian government-approved programs, class
            levels, and subjects. This is safe to run — it will not overwrite existing data unless
            you use Force.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handlePopulateAcademic(false)}
              disabled={populating}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
            >
              <Database size={16} />
              {populating ? 'Populating...' : 'Populate Nigerian Academic Data'}
            </button>

            <button
              onClick={() => handlePopulateAcademic(true)}
              disabled={populating}
              title="Re-run even if data already exists"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 font-medium"
            >
              <RefreshCw size={16} />
              Force Re-populate
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Populates: Programs (6) — Class Levels (17) — Subjects (55+). Only affects this school's
            database. School admins can edit the data after population.
          </p>
        </div>
      </div>

      {/* Admin Manager Modal */}
      {showAdminManager && (
        <SchoolAdminManager
          school={school}
          onClose={() => setShowAdminManager(false)}
          onAdminUpdate={loadSchool}
        />
      )}
    </div>
  );
}