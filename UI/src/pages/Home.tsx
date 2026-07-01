import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import type { Group, Tree, AnalyzeGroupResponse } from '../services/groupService';

interface GroupWithTrees extends Group {
  trees: Tree[];
}

export default function Home() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupWithTrees[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // States لتعديل اسم الجروب
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  // States لإضافة جروب جديد
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    intervalHours: 6,
  });
  const [isCreating, setIsCreating] = useState(false);

  // States لتحليل الجروب
  const [analyzingGroupId, setAnalyzingGroupId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeGroupResponse | null>(null);

  // Fetch groups and trees on mount
  useEffect(() => {
    fetchGroupsAndTrees();
  }, []);

  const fetchGroupsAndTrees = async () => {
    try {
      setLoading(true);
      setError('');
      
      const groupsData = await groupService.getGroups();
      
      // Sort groups by name
      const sortedGroups = [...groupsData].sort((a: Group, b: Group) => 
        a.group_name.localeCompare(b.group_name)
      );
      
      const groupsWithTrees = await Promise.all(
        sortedGroups.map(async (group: Group) => {
          try {
            const trees = await groupService.getTreesInGroup(group.group_uid);
            return { ...group, trees };
          } catch (err) {
            console.error(`Failed to fetch trees for group ${group.group_name}:`, err);
            return { ...group, trees: [] };
          }
        })
      );
      
      setGroups(groupsWithTrees);
    } catch (err: any) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // تحديث الـ Reading Interval
  const handleIntervalChange = async (groupId: string, hours: number) => {
    const clampedHours = Math.max(1, Math.min(24, hours));
    const minutes = clampedHours * 60;
    
    setGroups(groups.map(g => 
      g.group_uid === groupId 
        ? { ...g, reading_interval_minutes: minutes } 
        : g
    ));

    try {
      await groupService.updateGroup(groupId, { reading_interval_minutes: minutes });
    } catch (err: any) {
      console.error('Failed to update reading interval:', err);
      fetchGroupsAndTrees();
    }
  };

  // بدء تعديل اسم الجروب
  const startEditingGroup = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setNewGroupName(currentName);
  };

  // حفظ اسم الجروب الجديد
  const saveGroupName = async (groupId: string) => {
    if (newGroupName.trim()) {
      try {
        await groupService.updateGroup(groupId, { group_name: newGroupName.trim() });
        
        setGroups(groups.map(g => 
          g.group_uid === groupId ? { ...g, group_name: newGroupName.trim() } : g
        ));
        
        setEditingGroupId(null);
      } catch (err: any) {
        console.error('Failed to update group name:', err);
      }
    }
  };

  // إضافة جروب جديد
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGroupForm.name.trim()) {
      setError('Please enter a group name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const minutes = newGroupForm.intervalHours * 60;
      await groupService.createGroup(newGroupForm.name.trim(), minutes);
      
      setIsAddGroupModalOpen(false);
      setNewGroupForm({ name: '', intervalHours: 6 });
      
      await fetchGroupsAndTrees();
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setError(err.response?.data?.detail || 'Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // تحليل كل الشجر في الجروب
  const handleAnalyzeGroup = async (groupId: string) => {
    setAnalyzingGroupId(groupId);
    setAnalysisResult(null);
    setError('');
    
    try {
      const result = await groupService.analyzeGroup(groupId);
      setAnalysisResult(result);
      
      // Refresh groups to show updated tree statuses
      await fetchGroupsAndTrees();
    } catch (err: any) {
      console.error('Failed to analyze group:', err);
      setError(err.response?.data?.detail || 'Failed to analyze group. Please try again.');
    } finally {
      setAnalyzingGroupId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palm-main"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Welcome Banner */}
      <div 
        className="rounded-3xl shadow-2xl p-8 md:p-12 mb-8 text-white relative overflow-hidden"
        style={{ 
          backgroundImage: "url('/palm-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-palm-dark/90 to-palm-main/85"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Welcome to IPMS 🌴
          </h1>
          <p className="text-xl md:text-2xl text-palm-light font-medium mb-6">
            Intelligent Palm Monitoring System
          </p>
          <p className="text-lg text-white/90 max-w-3xl leading-relaxed">
            Smart Bio-Monitoring System for Early Detection of Red Palm Weevil and Internal Pests. 
            Protect your palm trees with AI-powered acoustic sensing technology.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <p className="text-red-700 font-medium">{error}</p>
          <button 
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Groups Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-palm-dark flex items-center gap-2">
            🌳 Monitoring Groups
          </h2>
          <button 
            onClick={() => setIsAddGroupModalOpen(true)}
            className="bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Group
          </button>
        </div>
        
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No groups found. Click "Add New Group" to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groups.map((group) => (
              <div 
                key={group.group_uid}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col"
              >
                {/* Group Header */}
                <div 
                  className="p-4 text-white relative overflow-hidden rounded-t-2xl"
                  style={{ 
                    backgroundImage: "url('/palm-bg.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-palm-dark/85 to-palm-main/80"></div>
                  
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    {editingGroupId === group.group_uid ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input 
                          type="text" 
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveGroupName(group.group_uid)}
                          className="flex-1 px-3 py-1.5 text-sm font-bold text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                          autoFocus
                        />
                        <button 
                          onClick={() => saveGroupName(group.group_uid)}
                          className="p-1.5 bg-white text-palm-main rounded-lg hover:bg-gray-100 transition-colors"
                          title="Save"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold drop-shadow-md">{group.group_name}</h3>
                          <p className="text-palm-light text-xs mt-1 drop-shadow-sm">
                            {group.trees.length} trees monitored
                          </p>
                        </div>
                        <button 
                          onClick={() => startEditingGroup(group.group_uid, group.group_name)}
                          className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-lg transition-all border border-white/30"
                          title="Edit group name"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Trees List */}
                <div className="p-4 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600">Tree IDs:</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-bold">
                      {group.trees.length}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 max-h-40 overflow-y-auto">
                    <div className="space-y-1.5">
                      {group.trees.length > 0 ? (
                        group.trees.map((tree) => (
                          <div 
                            key={tree.tree_uid}
                            className="flex items-center gap-2 text-sm font-mono text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-100"
                          >
                            <div className="w-2 h-2 rounded-full bg-palm-main"></div>
                            {tree.custom_name || tree.sensor_physical_id}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">No trees in this group</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reading Interval Input */}
                <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ⏱️ Reading Interval (hours)
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      max="24" 
                      value={Math.round(group.reading_interval_minutes / 60)}
                      onChange={(e) => handleIntervalChange(group.group_uid, parseInt(e.target.value) || 1)}
                      className="flex-1 px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-center font-bold text-palm-main focus:outline-none focus:ring-2 focus:ring-palm-main/30 focus:border-palm-main transition-all"
                    />
                    <span className="text-sm font-semibold text-gray-500">hrs</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-center">
                    Range: 1 - 24 hours
                  </p>
                </div>

                {/* Apply Button */}
                <div className="p-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleAnalyzeGroup(group.group_uid)}
                    disabled={analyzingGroupId === group.group_uid || group.trees.length === 0}
                    className="w-full bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-2.5 rounded-xl shadow-md shadow-green-600/30 hover:shadow-green-600/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {analyzingGroupId === group.group_uid ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Apply
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-palm-dark mb-6 flex items-center gap-2">
          ⚡ Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* View Dashboard */}
          <button 
            onClick={() => navigate('/dashboard')}
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-600/0 group-hover:from-emerald-500/10 group-hover:to-emerald-600/5 transition-all duration-300"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">View Dashboard</h3>
              <p className="text-sm text-gray-500">Monitor all groups and predictions</p>
            </div>
          </button>

          {/* Add New Tree */}
          <button 
            onClick={() => navigate('/palm-table')}
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/5 transition-all duration-300"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Tree</h3>
              <p className="text-sm text-gray-500">Register a new palm tree</p>
            </div>
          </button>

          {/* Check Alerts */}
          <button 
            onClick={() => navigate('/notifications')}
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/10 group-hover:to-amber-600/5 transition-all duration-300"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Check Alerts</h3>
              <p className="text-sm text-gray-500">View notifications and predictions</p>
            </div>
          </button>
        </div>
      </div>

      {/* Add Group Modal */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-palm-dark p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">🌳 Add New Group</h2>
              <p className="text-palm-light text-sm mt-1">Create a new monitoring group for your palm trees.</p>
            </div>
            <form onSubmit={handleAddGroup} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupForm.name}
                  onChange={(e) => setNewGroupForm({...newGroupForm, name: e.target.value})}
                  placeholder="e.g., Zone A, Farm 1, etc."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reading Interval (hours)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="24"
                  value={newGroupForm.intervalHours}
                  onChange={(e) => setNewGroupForm({...newGroupForm, intervalHours: parseInt(e.target.value) || 1})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Range: 1-24 hours</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddGroupModalOpen(false);
                    setNewGroupForm({ name: '', intervalHours: 6 });
                    setError('');
                  }}
                  disabled={isCreating}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="flex-1 bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analysis Result Modal */}
      {analysisResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-palm-dark p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📊 Analysis Results
              </h2>
              <p className="text-palm-light text-sm mt-1">
                {analysisResult.message}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {analysisResult.results.map((result, index) => {
                  let bgColor, borderColor, textColor, iconBgColor, icon;
                  
                  if (result.prediction === 'Clean') {
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-500';
                    textColor = 'text-green-700';
                    iconBgColor = 'bg-green-500';
                    icon = '✓';
                  } else if (result.prediction === 'Suspicious') {
                    bgColor = 'bg-yellow-50';
                    borderColor = 'border-yellow-500';
                    textColor = 'text-yellow-700';
                    iconBgColor = 'bg-yellow-500';
                    icon = '⚠';
                  } else if (result.prediction === 'Infested') {
                    bgColor = 'bg-red-50';
                    borderColor = 'border-red-500';
                    textColor = 'text-red-700';
                    iconBgColor = 'bg-red-500';
                    icon = '🐛';
                  } else {
                    bgColor = 'bg-gray-50';
                    borderColor = 'border-gray-500';
                    textColor = 'text-gray-700';
                    iconBgColor = 'bg-gray-500';
                    icon = '•';
                  }
                  
                  return (
                    <div key={index} className={`p-5 rounded-xl border-4 ${bgColor} ${borderColor}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white ${iconBgColor}`}>
                            {icon}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {result.custom_name || result.sensor_id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {result.sensor_id} • {result.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-2xl ${textColor}`}>
                            {result.prediction || 'N/A'}
                          </p>
                          {result.confidence !== null && result.confidence !== undefined && (
                            <p className="text-sm text-gray-600 font-semibold">
                              Confidence: {(result.confidence * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-3 font-medium">Error: {result.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button 
                onClick={() => setAnalysisResult(null)}
                className="w-full bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/30 hover:scale-[1.02] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}