import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Bid Accepted',
      message: 'Your bid for Kitchen Renovation has been accepted by the homeowner.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      actionUrl: '/projects/1'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Payment Reminder',
      message: 'Invoice #INV-2024-001 is due in 3 days.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
      actionUrl: '/billing'
    },
    {
      id: '3',
      type: 'info',
      title: 'Profile Updated',
      message: 'Your contractor profile has been successfully updated.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: true
    },
    {
      id: '4',
      type: 'error',
      title: 'Document Upload Failed',
      message: 'Unable to upload license document. Please try again.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter(n => !n.read);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
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

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('[data-notification-center]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" data-notification-center>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-lg shadow-lg z-50">
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
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="unread" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mx-4 mb-3">
                  <TabsTrigger value="unread" className="text-xs">
                    Unread ({unreadCount})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">
                    All ({notifications.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unread" className="mt-0">
                  {unreadNotifications.length > 0 ? (
                    <div className="space-y-1">
                      {unreadNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-50 border-l-4 border-blue-500"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    New
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                      className="text-xs h-6 px-2"
                                    >
                                      Mark read
                                    </Button>
                                    {notification.actionUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-6 px-2"
                                      >
                                        View
                                      </Button>
                                    )}
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
                      <h3 className="font-medium text-gray-900">
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
                          className={`p-4 hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className={`text-sm truncate ${
                                    notification.read ? 'font-normal text-gray-600' : 'font-medium'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeNotification(notification.id)}
                                    className="h-4 w-4 text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className={`text-sm mb-2 ${
                                  notification.read ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                  {notification.actionUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                    >
                                      View
                                    </Button>
                                  )}
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
                      <h3 className="font-medium text-gray-900">
                        No notifications
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        You don't have any notifications yet.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};