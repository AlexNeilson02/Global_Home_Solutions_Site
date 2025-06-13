import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Check, 
  X, 
  Eye, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  relatedId?: number;
}

interface NotificationCenterProps {
  userId: number;
  userRole: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mock notifications - in a real app, this would come from an API
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'info',
      title: 'New Bid Request',
      message: 'You have received a new bid request for kitchen renovation.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionUrl: '/contractor-portal?tab=bids',
      relatedId: 1
    },
    {
      id: '2',
      type: 'success',
      title: 'Project Won',
      message: 'Congratulations! Your bid for bathroom remodel has been accepted.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: false,
      actionUrl: '/contractor-portal?tab=projects'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Response Time Alert',
      message: 'You have pending bid requests that need attention.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true,
      actionUrl: '/contractor-portal?tab=bids'
    },
    {
      id: '4',
      type: 'info',
      title: 'QR Code Scanned',
      message: 'Your profile was viewed 5 times today.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      read: true,
      actionUrl: '/sales-portal?tab=analytics'
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    // In a real app, this would make an API call
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read."
    });
  };

  const markAllAsRead = () => {
    // In a real app, this would make an API call
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read."
    });
  };

  const deleteNotification = (notificationId: string) => {
    // In a real app, this would make an API call
    toast({
      title: "Notification deleted",
      description: "The notification has been deleted."
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            variant="destructive"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="unread" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mx-4 mb-4">
                  <TabsTrigger value="unread">
                    Unread ({unreadCount})
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    All ({notifications.length})
                  </TabsTrigger>
                </TabsList>

                <div className="max-h-96 overflow-y-auto">
                  <TabsContent value="unread" className="mt-0">
                    {unreadNotifications.length > 0 ? (
                      <div className="space-y-1">
                        {unreadNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-blue-500"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                {getIcon(notification.type)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm">
                                      {notification.title}
                                    </h4>
                                    <Badge variant="outline" className="text-xs">
                                      New
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTimestamp(notification.timestamp)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead(notification.id)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteNotification(notification.id)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          No unread notifications
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          You're all caught up!
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="all" className="mt-0">
                    {notifications.length > 0 ? (
                      <div className="space-y-1">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              !notification.read ? 'border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                {getIcon(notification.type)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`text-sm ${
                                      notification.read ? 'font-normal text-gray-600 dark:text-gray-400' : 'font-medium'
                                    }`}>
                                      {notification.title}
                                    </h4>
                                    {!notification.read && (
                                      <Badge variant="outline" className="text-xs">
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                  <p className={`text-sm mb-2 ${
                                    notification.read ? 'text-gray-500' : 'text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTimestamp(notification.timestamp)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {!notification.read && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => markAsRead(notification.id)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteNotification(notification.id)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          No notifications
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          When you have notifications, they'll appear here
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;