import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../services/dashboardService';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palm-main"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-gray-700 font-medium">No data available</p>
        </div>
      </div>
    );
  }

  // Normalize status names 
  const normalizeStatus = (status: string) => {
    switch (status) {
      case 'Healthy': return 'Clean';
      case 'Warning': return 'Suspicious';
      default: return status;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'Clean':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Suspicious':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Infested':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get prediction color
  const getPredictionColor = (value: number) => {
    if (value > 50) return 'text-emerald-600';
    if (value > 25) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-palm-dark flex items-center gap-3">
          🏠 Dashboard Overview
        </h1>
        <p className="text-gray-500 mt-1 text-base">Monitor your palm tree groups and predictions in real-time.</p>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.zones.map((zone) => (
          <div 
            key={zone.group_uid} 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
          >
            {/* Group Header */}
            <div className="bg-gradient-to-r from-palm-dark/5 to-palm-main/5 p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="text-lg font-bold text-palm-dark flex-1">{zone.group_name}</h3>
                </div>
              </div>
            </div>

            {/* Prediction Section */}
            <div className="p-4 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-600">Health Prediction:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-extrabold ${getPredictionColor(zone.prediction)}`}>
                    {zone.prediction}%
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    zone.prediction > 50 ? 'bg-emerald-500' : 
                    zone.prediction > 25 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${zone.prediction}%` }}
                ></div>
              </div>
            </div>

            {/* Trees List */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-600">Trees in Group:</span>
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                  {zone.trees.length}
                </span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {zone.trees.map((tree) => (
                  <div 
                    key={tree.tree_uid} 
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-palm-light/50 flex items-center justify-center text-palm-main">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-6m0 0c0-3.5 2.5-6 6-6m-6 6c0-3.5-2.5-6-6-6m12 0c0 2.5-1.5 4.5-3.5 5.5M6 9c0 2.5 1.5 4.5 3.5 5.5M12 15a3 3 0 100-6 3 3 0 000 6z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{tree.custom_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{tree.sensor_physical_id}</p>
                      </div>
                    </div>
                    {/* Display normalized status  */}
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${getStatusColor(tree.status)}`}>
                      {normalizeStatus(tree.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Clean Status</p>
              <p className="text-3xl font-extrabold mt-1">{stats.healthy_trees}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Suspicious Status</p>
              <p className="text-3xl font-extrabold mt-1">{stats.warning_trees}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Infested Status</p>
              <p className="text-3xl font-extrabold mt-1">{stats.infested_trees}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}