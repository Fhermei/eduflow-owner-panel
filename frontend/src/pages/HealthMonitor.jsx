import React, { useState, useEffect } from 'react';
import { schoolsApi } from '../api';
import { toast } from 'react-hot-toast';
import {
  Activity, Server, Database, RefreshCw, CheckCircle, 
  XCircle, AlertCircle, Clock, HardDrive, Cpu
} from 'lucide-react';

export default function HealthMonitor() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const response = await schoolsApi.list({ status: 'active' });
      const schoolsData = response.data.schools || [];
      
      // Sync metrics for each school to get latest health
      const syncedSchools = await Promise.all(
        schoolsData.map(async (school) => {
          try {
            await schoolsApi.sync(school.id);
            const updated = await schoolsApi.get(school.id);
            return updated.data.school;
          } catch {
            return school;
          }
        })
      );
      
      setSchools(syncedSchools);
    } catch (error) {
      console.error('Failed to load health data:', error);
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHealth();
  };

  const getHealthStatus = (status) => {
    switch (status) {
      case 'healthy':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Healthy' };
      case 'unhealthy':
        return { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Unhealthy' };
      case 'down':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Down' };
      default:
        return { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Unknown' };
    }
  };

  const healthyCount = schools.filter(s => s.metrics?.health_status === 'healthy').length;
  const unhealthyCount = schools.filter(s => s.metrics?.health_status === 'unhealthy').length;
  const downCount = schools.filter(s => s.metrics?.health_status === 'down').length;
  const totalCount = schools.length;

  if (loading && schools.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-[#D94801] mx-auto mb-4" />
          <p className="text-gray-400">Loading health monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Health Monitor</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time server health and performance metrics</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh All'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Server size={20} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-500">Total Servers</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-sm font-medium text-gray-500">Healthy</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{healthyCount}</p>
          <p className="text-xs text-gray-400 mt-1">{totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0}% of total</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle size={20} className="text-yellow-500" />
            <span className="text-sm font-medium text-gray-500">Unhealthy</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{unhealthyCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <XCircle size={20} className="text-red-500" />
            <span className="text-sm font-medium text-gray-500">Down</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{downCount}</p>
        </div>
      </div>

      {/* Health Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">Overall System Health</h3>
          <span className="text-sm text-gray-500">
            {healthyCount}/{totalCount} servers operational
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-green-500" style={{ width: `${(healthyCount / totalCount) * 100}%` }} />
          <div className="h-full bg-yellow-500" style={{ width: `${(unhealthyCount / totalCount) * 100}%` }} />
          <div className="h-full bg-red-500" style={{ width: `${(downCount / totalCount) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-3 text-xs">
          <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500" /> Healthy</span>
          <span className="flex items-center gap-1"><AlertCircle size={10} className="text-yellow-500" /> Unhealthy</span>
          <span className="flex items-center gap-1"><XCircle size={10} className="text-red-500" /> Down</span>
        </div>
      </div>

      {/* Schools List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">School</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Response Time</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">DB Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Last Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schools.map((school) => {
                const health = getHealthStatus(school.metrics?.health_status);
                const HealthIcon = health.icon;
                return (
                  <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{school.name}</p>
                        <p className="text-xs text-gray-400">{school.school_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${health.bg} ${health.color}`}>
                        <HealthIcon size={12} />
                        {health.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm font-mono">
                          {school.metrics?.response_time_ms?.toFixed(0) || 'N/A'} ms
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Database size={14} className="text-gray-400" />
                        <span className="text-sm">{school.metrics?.db_status || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-500">
                        {school.metrics?.updated_at ? new Date(school.metrics.updated_at).toLocaleTimeString() : 'Never'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {schools.length === 0 && (
          <div className="text-center py-12">
            <Activity size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No schools to monitor</p>
          </div>
        )}
      </div>
    </div>
  );
}