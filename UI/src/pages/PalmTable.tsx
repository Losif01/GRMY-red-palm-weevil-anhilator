import { useState, useEffect } from 'react';
import { treeService } from '../services/treeService';
import { groupService } from '../services/groupService';
import api from '../services/api';
import type { Tree } from '../services/treeService';
import type { Group } from '../services/groupService';

export default function PalmTable() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [editingTreeUid, setEditingTreeUid] = useState<string | null>(null);
  const [deletingTree, setDeletingTree] = useState<Tree | null>(null);
  const [uploadingTree, setUploadingTree] = useState<Tree | null>(null);
  
  // Form states
  const [newTree, setNewTree] = useState({
    sensor_physical_id: '',
    custom_name: '',
    group_id: '',
  });
  const [editTree, setEditTree] = useState({
    sensor_physical_id: '',
    custom_name: '',
    group_id: '',
    battery_status: 'OK',
  });
  
  // Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All Groups');
  const [selectedHealth, setSelectedHealth] = useState('All Health');

  // Fetch groups and trees on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const groupsData = await groupService.getGroups();
      setGroups(groupsData);

      const allTrees: Tree[] = [];
      for (const group of groupsData) {
        try {
          const groupTrees = await treeService.getTreesInGroup(group.group_uid);
          allTrees.push(...groupTrees);
        } catch (err) {
          console.error(`Failed to fetch trees for group ${group.group_name}:`, err);
        }
      }
      
      setTrees(allTrees);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add Tree Function
  const handleAddTree = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTree.sensor_physical_id.trim()) {
      setError('Please enter a Sensor ID');
      return;
    }

    try {
      setError('');
      const treeData: any = {
        sensor_physical_id: newTree.sensor_physical_id.trim(),
        custom_name: newTree.custom_name.trim() || undefined,
      };

      if (newTree.group_id) {
        treeData.group_id = newTree.group_id;
      }

      await treeService.createTree(treeData);
      
      setNewTree({ sensor_physical_id: '', custom_name: '', group_id: '' });
      setIsAddModalOpen(false);
      
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to create tree:', err);
      setError(err.response?.data?.detail || 'Failed to add tree. Please try again.');
    }
  };

  // Edit Tree Function
  const handleEditClick = (tree: Tree) => {
    setEditTree({
      sensor_physical_id: tree.sensor_physical_id,
      custom_name: tree.custom_name || '',
      group_id: tree.group_id || '',
      battery_status: tree.battery_status || 'OK',
    });
    setEditingTreeUid(tree.tree_uid);
    setIsEditModalOpen(true);
  };

  const handleUpdateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTreeUid) return;

    try {
      setError('');
      const updateData: any = {
        custom_name: editTree.custom_name.trim() || undefined,
        battery_status: editTree.battery_status,
      };

      if (editTree.group_id) {
        updateData.group_id = editTree.group_id;
      }

      await treeService.updateTree(editingTreeUid, updateData);
      
      setEditingTreeUid(null);
      setIsEditModalOpen(false);
      
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to update tree:', err);
      setError(err.response?.data?.detail || 'Failed to update tree. Please try again.');
    }
  };

  // Delete Tree Function
  const handleDeleteClick = (tree: Tree) => {
    setDeletingTree(tree);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTree) return;

    try {
      setError('');
      await treeService.deleteTree(deletingTree.tree_uid);
      
      setDeletingTree(null);
      setIsDeleteModalOpen(false);
      
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to delete tree:', err);
      setError(err.response?.data?.detail || 'Failed to delete tree. Please try again.');
    }
  };

  // Upload Recording Functions
  const handleUploadClick = (tree: Tree) => {
    setUploadingTree(tree);
    setUploadFile(null);
    setUploadResult(null);
    setError('');
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadingTree || !uploadFile) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('tree_id', uploadingTree.tree_uid);

      const response = await api.post('/recordings/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      
      // Refresh trees to show updated status
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to upload recording:', err);
      setError(err.response?.data?.detail || 'Failed to upload recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getHealthStyle = (classification?: string | null) => {
    if (!classification) {
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '•', label: 'Pending' };
    }
    switch (classification) {
      case 'Clean': 
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✓', label: 'Clean' };
      case 'Suspicious': 
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⚠', label: 'Suspicious' };
      case 'Infested': 
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🐛', label: 'Infested' };
      default: 
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '•', label: 'Pending' };
    }
  };

  const getConnectionStyle = (status: string) => {
    switch (status) {
      case 'ONLINE': 
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: '🟢' };
      case 'OFFLINE': 
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: '⚫' };
      default: 
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: '•' };
    }
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'No Group';
    const group = groups.find(g => g.group_uid === groupId);
    return group ? group.group_name : 'Unknown Group';
  };

  const filteredTrees = trees.filter(tree => {
    const matchesSearch = 
      (tree.custom_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) || 
      tree.sensor_physical_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = selectedGroup === 'All Groups' || tree.group_id === selectedGroup;
    
    let matchesHealth = true;
    if (selectedHealth !== 'All Health') {
      const classification = tree.latest_reading_classification;
      if (selectedHealth === 'Clean') matchesHealth = classification === 'Clean';
      else if (selectedHealth === 'Suspicious') matchesHealth = classification === 'Suspicious';
      else if (selectedHealth === 'Infested') matchesHealth = classification === 'Infested';
      else if (selectedHealth === 'Pending') matchesHealth = !classification;
    }
    
    return matchesSearch && matchesGroup && matchesHealth;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGroup('All Groups');
    setSelectedHealth('All Health');
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-palm-dark flex items-center gap-3">
            🌳 Palm Trees Table
          </h1>
          <p className="text-gray-500 mt-1 text-base">Manage your palm trees, sensors, and groups.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Tree
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by Tree ID or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/30 focus:border-palm-main transition-all text-base"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-palm-main/30 focus:border-palm-main cursor-pointer"
          >
            <option value="All Groups">All Groups</option>
            {groups.map(g => (
              <option key={g.group_uid} value={g.group_uid}>{g.group_name}</option>
            ))}
          </select>
          <select 
            value={selectedHealth}
            onChange={(e) => setSelectedHealth(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-palm-main/30 focus:border-palm-main cursor-pointer"
          >
            <option value="All Health">All Health</option>
            <option value="Clean">Clean</option>
            <option value="Suspicious">Suspicious</option>
            <option value="Infested">Infested</option>
            <option value="Pending">Pending</option>
          </select>
          {(searchTerm || selectedGroup !== 'All Groups' || selectedHealth !== 'All Health') && (
            <button 
              onClick={clearFilters}
              className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-base font-semibold hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-500 font-medium">
        Showing <span className="text-palm-main font-bold">{filteredTrees.length}</span> of {trees.length} trees
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-palm-dark/5 to-palm-main/5 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-palm-dark uppercase tracking-wider">Tree ID</th>
                <th className="px-6 py-4 text-sm font-bold text-palm-dark uppercase tracking-wider">Tree Name</th>
                <th className="px-6 py-4 text-sm font-bold text-palm-dark uppercase tracking-wider">Group</th>
                <th className="px-6 py-4 text-sm font-bold text-palm-dark uppercase tracking-wider">Health Status</th>
                <th className="px-6 py-4 text-sm font-bold text-palm-dark uppercase tracking-wider">Connection</th>
                <th className="px-6 py-4 text-sm font-bold text-palm-dark uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTrees.length > 0 ? (
                filteredTrees.map((tree) => {
                  const healthStyle = getHealthStyle(tree.latest_reading_classification);
                  const connectionStyle = getConnectionStyle(tree.current_status);
                  return (
                    <tr key={tree.tree_uid} className="hover:bg-palm-light/30 transition-colors duration-150 group">
                      <td className="px-6 py-5 text-base font-mono font-semibold text-gray-600">{tree.sensor_physical_id}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-palm-light/50 flex items-center justify-center text-palm-main">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-6m0 0c0-3.5 2.5-6 6-6m-6 6c0-3.5-2.5-6-6-6m12 0c0 2.5-1.5 4.5-3.5 5.5M6 9c0 2.5 1.5 4.5 3.5 5.5M12 15a3 3 0 100-6 3 3 0 000 6z" />
                            </svg>
                          </div>
                          <span className="text-base text-gray-900 font-medium">{tree.custom_name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-base text-gray-600">
                        <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200">
                          {getGroupName(tree.group_id)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${healthStyle.bg} ${healthStyle.text} ${healthStyle.border}`}>
                          <span className="text-base">{healthStyle.icon}</span>
                          {healthStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${connectionStyle.bg} ${connectionStyle.text} ${connectionStyle.border}`}>
                          <span className="text-base">{connectionStyle.icon}</span>
                          {tree.current_status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {/* Upload Recording Button */}
                          <button 
                            onClick={() => handleUploadClick(tree)}
                            className="p-2 rounded-lg text-palm-main hover:bg-palm-light/50 transition-colors"
                            title="Upload Recording"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </button>
                          {/* Edit Button */}
                          <button 
                            onClick={() => handleEditClick(tree)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDeleteClick(tree)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-lg font-medium">No trees found matching your filters.</p>
                      <button 
                        onClick={clearFilters}
                        className="text-palm-main font-semibold hover:underline text-base"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tree Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-palm-dark p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">🌱 Add New Palm Tree</h2>
              <p className="text-palm-light text-sm mt-1">Register a new tree to the monitoring system.</p>
            </div>
            <form onSubmit={handleAddTree} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sensor ID</label>
                <input 
                  type="text" 
                  value={newTree.sensor_physical_id}
                  onChange={(e) => setNewTree({...newTree, sensor_physical_id: e.target.value})}
                  placeholder="e.g., TR-006"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tree Name (Optional)</label>
                <input 
                  type="text" 
                  value={newTree.custom_name}
                  onChange={(e) => setNewTree({...newTree, custom_name: e.target.value})}
                  placeholder="e.g., Palm Zeta"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Group (Optional)</label>
                <select 
                  value={newTree.group_id}
                  onChange={(e) => setNewTree({...newTree, group_id: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all"
                >
                  <option value="">-- No Group --</option>
                  {groups.map((g) => (
                    <option key={g.group_uid} value={g.group_uid}>{g.group_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewTree({ sensor_physical_id: '', custom_name: '', group_id: '' });
                    setError('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/30 hover:scale-[1.02] transition-all"
                >
                  Add Tree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tree Modal */}
      {isEditModalOpen && editingTreeUid && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-palm-dark p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">✏️ Edit Palm Tree</h2>
              <p className="text-palm-light text-sm mt-1">Update tree information.</p>
            </div>
            <form onSubmit={handleUpdateTree} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sensor ID</label>
                <input 
                  type="text" 
                  value={editTree.sensor_physical_id}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Sensor ID cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tree Name</label>
                <input 
                  type="text" 
                  value={editTree.custom_name}
                  onChange={(e) => setEditTree({...editTree, custom_name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Group</label>
                <select 
                  value={editTree.group_id}
                  onChange={(e) => setEditTree({...editTree, group_id: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all"
                >
                  <option value="">-- No Group --</option>
                  {groups.map((g) => (
                    <option key={g.group_uid} value={g.group_uid}>{g.group_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Battery Status</label>
                <select 
                  value={editTree.battery_status}
                  onChange={(e) => setEditTree({...editTree, battery_status: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all"
                >
                  <option value="OK">OK</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTreeUid(null);
                    setError('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/30 hover:scale-[1.02] transition-all"
                >
                  Update Tree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingTree && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-700 mb-2">Are you sure you want to delete this tree?</p>
              <p className="text-gray-500 text-sm">
                <span className="font-bold text-gray-900">{deletingTree.custom_name || deletingTree.sensor_physical_id}</span> ({deletingTree.sensor_physical_id})
              </p>
              <p className="text-red-500 text-xs mt-4 font-medium">This action cannot be undone.</p>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingTree(null);
                  setError('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmDelete}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/30 hover:scale-[1.02] transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Recording Modal */}
      {isUploadModalOpen && uploadingTree && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-palm-dark p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🎤 Upload Recording
              </h2>
              <p className="text-palm-light text-sm mt-1">
                Analyze audio for: <span className="font-bold">{uploadingTree.custom_name || uploadingTree.sensor_physical_id}</span>
              </p>
            </div>
            
            {!uploadResult ? (
              <form onSubmit={handleUploadRecording} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Audio File (WAV, MP3)
                  </label>
                  <input 
                    type="file" 
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-palm-light file:text-palm-dark hover:file:bg-palm-main/20"
                    required
                  />
                  {uploadFile && (
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                
                <div className="bg-palm-light/30 border border-palm-main/30 rounded-xl p-4">
                  <p className="text-sm text-palm-dark">
                    <strong>Note:</strong> The AI model will analyze the audio and update the tree's health status automatically.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setUploadingTree(null);
                      setUploadFile(null);
                      setError('');
                    }}
                    disabled={isUploading}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUploading || !uploadFile}
                    className="flex-1 bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4">
                <div className={`p-5 rounded-xl border-2 ${
                  uploadResult.recording?.prediction_from_model === 'Clean' ? 'bg-emerald-50 border-emerald-200' :
                  uploadResult.recording?.prediction_from_model === 'Suspicious' ? 'bg-amber-50 border-amber-200' :
                  uploadResult.recording?.prediction_from_model === 'Infested' ? 'bg-rose-50 border-rose-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                      uploadResult.recording?.prediction_from_model === 'Clean' ? 'bg-emerald-100' :
                      uploadResult.recording?.prediction_from_model === 'Suspicious' ? 'bg-amber-100' :
                      uploadResult.recording?.prediction_from_model === 'Infested' ? 'bg-rose-100' :
                      'bg-gray-100'
                    }`}>
                      {uploadResult.recording?.prediction_from_model === 'Clean' ? '✓' :
                       uploadResult.recording?.prediction_from_model === 'Suspicious' ? '⚠' :
                       uploadResult.recording?.prediction_from_model === 'Infested' ? '🐛' : '•'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-bold text-gray-900">
                        {uploadResult.recording?.prediction_from_model || 'Pending'}
                      </p>
                      {uploadResult.recording?.confidence_percentage && (
                        <p className="text-sm text-gray-600 font-semibold mt-1">
                          Confidence: {(Number(uploadResult.recording.confidence_percentage) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 text-center">{uploadResult.message}</p>
                
                <button 
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadingTree(null);
                    setUploadFile(null);
                    setUploadResult(null);
                  }}
                  className="w-full bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/30 hover:scale-[1.02] transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}