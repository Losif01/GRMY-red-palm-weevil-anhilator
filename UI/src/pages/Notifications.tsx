import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../services/notificationService';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [notificationsData, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount()
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      await notificationService.markAsSeen(notificationId);
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.notification_uid === notificationId 
          ? { ...n, notification_seen: true }
          : n
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.notification_seen);
      
      await Promise.all(
        unreadNotifications.map(n => notificationService.markAsSeen(n.notification_uid))
      );
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, notification_seen: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotif = notifications.find(n => n.notification_uid === notificationId);
      setNotifications(notifications.filter(n => n.notification_uid !== notificationId));
      
      if (deletedNotif && !deletedNotif.notification_seen) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      if (selectedNotification?.notification_uid === notificationId) {
        setSelectedNotification(null);
      }
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Open notification detail
  const handleOpenNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    
    // Auto mark as seen when opened
    if (!notification.notification_seen) {
      await handleMarkAsRead(notification.notification_uid);
    }
  };

  // Parse message to extract info
  const parseMessage = (message: string) => {
    // Extract tree name, group name, confidence, events
    const treeMatch = message.match(/tree '([^']+)'/i);
    const groupMatch = message.match(/group '([^']+)'/i);
    const confidenceMatch = message.match(/Confidence: ([\d.]+)%/i);
    const eventsMatch = message.match(/Events detected: (\d+)/i);
    
    // Determine severity based on message content
    let severity = 'medium';
    let warningType = 'Unknown';
    
    // Check for Suspicious first (before Infested)
    if (message.toLowerCase().includes('suspicious activity detected')) {
      severity = 'high';
      warningType = 'Suspicious';
    } else if (message.toLowerCase().includes('infestation detected')) {
      severity = 'critical';
      warningType = 'Infested';
    }
    
    return {
      treeName: treeMatch ? treeMatch[1] : 'Unknown Tree',
      groupName: groupMatch ? groupMatch[1] : 'Unknown Group',
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : null,
      events: eventsMatch ? parseInt(eventsMatch[1]) : null,
      severity,
      warningType
    };
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getWarningIcon = (warningType: string) => {
    switch (warningType) {
      case 'Infested': return '🐛';
      case 'Suspicious': return '⚠';
      default: return '•';
    }
  };

  // Format timestamp
  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return 'Unknown time';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'unread') return !n.notification_seen;
    if (filterStatus === 'read') return n.notification_seen;
    return true;
  });

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
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1 text-base">AI predictions and alerts from your palm trees.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-5 py-2.5 bg-palm-main/10 text-palm-main border border-palm-main/30 rounded-xl font-semibold hover:bg-palm-main hover:text-white transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Mark all as read
          </button>
        )}
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

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-palm-main/30 focus:border-palm-main cursor-pointer"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Showing <span className="text-palm-main font-bold">{filteredNotifications.length}</span> of {notifications.length} notifications
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const parsed = parseMessage(notification.message);
            
            return (
              <div 
                key={notification.notification_uid}
                className={`rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group ${
                  !notification.notification_seen 
                    ? 'bg-gray-200 border-gray-400 hover:bg-gray-300' 
                    : 'bg-white border-gray-100 hover:bg-white'
                }`}
                onClick={() => handleOpenNotification(notification)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Indicator */}
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <div className={`w-3 h-3 rounded-full transition-all ${
                          !notification.notification_seen 
                            ? 'bg-palm-main shadow-lg shadow-palm-main/50' 
                            : 'bg-gray-400'
                        }`}></div>
                        <div className={`w-1 h-8 rounded-full ${getSeverityDot(parsed.severity)} opacity-60`}></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className={`text-xl ${!notification.notification_seen ? 'font-extrabold' : 'font-semibold'} text-gray-900`}>
                            {parsed.groupName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(parsed.severity)}`}>
                            {parsed.severity.toUpperCase()}
                          </span>
                          {!notification.notification_seen && (
                            <span className="text-xs font-bold text-palm-main bg-palm-light px-2 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTimestamp(notification.sent_at)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!notification.notification_seen && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notification.notification_uid, e)}
                          className="p-2 rounded-lg text-palm-main hover:bg-palm-light/50 transition-colors"
                          title="Mark as read"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleDelete(notification.notification_uid, e)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500 text-base">All caught up! No alerts match your filters.</p>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (() => {
        const parsed = parseMessage(selectedNotification.message);
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-palm-dark to-palm-main p-6 text-white overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{ 
                    backgroundImage: "url('/palm-bg.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                ></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      🔔 Alert Details
                    </h2>
                    <button 
                      onClick={() => setSelectedNotification(null)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-palm-light flex-wrap">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTimestamp(selectedNotification.sent_at)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(parsed.severity)}`}>
                      {parsed.severity.toUpperCase()} SEVERITY
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Alert Info */}
                <div className={`p-5 rounded-xl border-2 mb-6 ${
                  parsed.warningType === 'Infested' ? 'bg-rose-50 border-rose-200' :
                  parsed.warningType === 'Suspicious' ? 'bg-amber-50 border-amber-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white ${
                      parsed.warningType === 'Infested' ? 'bg-rose-500' :
                      parsed.warningType === 'Suspicious' ? 'bg-amber-500' :
                      'bg-gray-500'
                    }`}>
                      {getWarningIcon(parsed.warningType)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {parsed.warningType === 'Infested' ? 'Infestation Detected' : 
                         parsed.warningType === 'Suspicious' ? 'Suspicious Activity Detected' : 'Alert'}
                      </h3>
                      <p className="text-sm text-gray-700 mb-3">{selectedNotification.message}</p>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>🌳 <strong>{parsed.treeName}</strong></span>
                        <span>📍 <strong>{parsed.groupName}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {parsed.confidence !== null && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-blue-700">{parsed.confidence.toFixed(1)}%</p>
                      <p className="text-sm text-blue-600 font-medium mt-1">Confidence</p>
                    </div>
                  )}
                  {parsed.events !== null && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-purple-700">{parsed.events}</p>
                      <p className="text-sm text-purple-600 font-medium mt-1">Events Detected</p>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Notification Details</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-semibold">{selectedNotification.notification_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email Sent:</span>
                      <span className={`font-semibold ${selectedNotification.sent_status ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedNotification.sent_status ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-semibold ${selectedNotification.notification_seen ? 'text-gray-500' : 'text-palm-main'}`}>
                        {selectedNotification.notification_seen ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-200 p-6">
                <div className="flex gap-3 flex-wrap">
                  <button 
                    onClick={() => handleDelete(selectedNotification.notification_uid)}
                    className="flex-1 min-w-[150px] bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Dismiss Alert
                  </button>
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="px-6 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}