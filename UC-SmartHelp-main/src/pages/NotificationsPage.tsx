import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getDashboardPath } from '@/lib/utils';

interface Notification {
  id?: number;
  notification_id?: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  ticket_id?: number;
  announcement_id?: number;
  is_read: number;
  created_at: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const getCurrentUser = () => {
    if (authUser && (authUser.userId || authUser.id || authUser.user_id)) {
      return authUser as any;
    }

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.userId || parsed.id || parsed.user_id)) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors and fallback to authUser
    }

    return authUser;
  };

  const getCurrentUserId = (user: any) => user?.userId || user?.id || user?.user_id || null;

  const fetchNotifications = async () => {
    const currentUser = getCurrentUser();
    const userId = getCurrentUserId(currentUser);
    if (!userId) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/notifications?user_id=${encodeURIComponent(userId)}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNotificationId = (notification: Notification) => notification.notification_id ?? notification.id ?? 0;

  const markAsRead = async (notificationId: number) => {
    const currentUser = getCurrentUser();
    const userId = getCurrentUserId(currentUser);
    if (!userId) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      await fetch(`${API_URL}/api/notifications/${notificationId}/mark-as-read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      setNotifications(prev => prev.map(n => 
        getNotificationId(n) === notificationId ? { ...n, is_read: 1 } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    const currentUser = getCurrentUser();
    const userId = getCurrentUserId(currentUser);
    if (!userId) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      setNotifications(prev => prev.filter(n => getNotificationId(n) !== notificationId));
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    const currentUser = getCurrentUser();
    const userId = getCurrentUserId(currentUser);
    if (!userId) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      await fetch(`${API_URL}/api/notifications/mark-all-as-read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  // Group notifications by day and preserve descending order
  const groupNotificationsByDay = (notifications: Notification[]) => {
    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const groups: { [key: string]: Notification[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    sortedNotifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      const dateKey = notificationDate.toDateString();

      let groupKey = dateKey;
      if (notificationDate.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (notificationDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = notificationDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  };

  useEffect(() => {
    fetchNotifications();
  }, [authUser]);

  const groupedNotifications = groupNotificationsByDay(notifications);
  const notificationCount = notifications.length;
  const visibleNotificationEntries = Object.entries(
    showAllNotifications || notificationCount <= 5
      ? groupedNotifications
      : groupNotificationsByDay(
          [...notifications]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        )
  );
  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications */}
        {visibleNotificationEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground text-center">
                You'll see notifications here when there are updates on your tickets or new announcements.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {visibleNotificationEntries.map(([dateGroup, groupNotifications]) => (
              <div key={dateGroup}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold">{dateGroup}</h2>
                  <Badge variant="secondary">
                    {groupNotifications.length} notification{groupNotifications.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {groupNotifications.map((notification) => {
                    const notificationId = getNotificationId(notification);
                    return (
                      <Card 
                        key={notificationId || `${notification.type}-${notification.created_at}`} 
                        className={`transition-colors cursor-pointer ${
                          notification.is_read === 0 
                            ? 'border-primary/20 bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          if (notification.is_read === 0 && notificationId) {
                            markAsRead(notificationId);
                          }
                          if (notification.type === 'department_feedback_submitted') {
                            // Redirect feedback notifications to departmental analytics
                            navigate('/analytics');
                          } else if (['ticket_reply', 'student_ticket_reply', 'ticket_status_changed', 'ticket_overdue', 'ticket_overdue_staff', 'ticket_auto_closed', 'status_updated_by_you', 'new_ticket', 'overdue_tickets_detected', 'ticket_assigned'].includes(notification.type)) {
                            // Check if user is staff/admin and redirect to their dashboard instead of tickets page
                            const userJson = localStorage.getItem("user");
                            const user = userJson ? JSON.parse(userJson) : null;
                            const role = (user?.role || "").toString().toLowerCase();
                            
                            if (role === 'staff' || role === 'admin') {
                              navigate(getDashboardPath());
                            } else {
                              navigate('/tickets');
                            }
                          } else if (notification.type === 'announcement') {
                            navigate('/announcements');
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{notification.title}</h3>
                                {notification.is_read === 0 && (
                                  <div className="h-2 w-2 rounded-full bg-red-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notification.created_at).toLocaleString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                {notification.is_read === 0 && notificationId && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      markAsRead(notificationId);
                                    }}
                                  >
                                    Mark as read
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {notification.is_read === 0 && notificationId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    markAsRead(notificationId);
                                  }}
                                >
                                  Mark as read
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (notificationId) deleteNotification(notificationId);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
            {notificationCount > 5 && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => setShowAllNotifications(prev => !prev)}>
                  {showAllNotifications
                    ? 'Show fewer notifications'
                    : `See more notifications (${notificationCount - 5} more)`}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;