import { useState, useEffect, useRef } from 'react';

interface BidRequestNotification {
  type: 'NEW_BID_REQUEST';
  data: {
    id: number;
    customerName: string;
    projectDescription: string;
    timeline: string;
    budget: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
  };
}

interface NotificationState {
  isConnected: boolean;
  lastNotification: BidRequestNotification | null;
  unreadCount: number;
}

export function useNotifications(contractorId: number | null) {
  const [state, setState] = useState<NotificationState>({
    isConnected: false,
    lastNotification: null,
    unreadCount: 0,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!contractorId) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket for notifications:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for contractor:', contractorId);
        
        // Register this contractor for notifications
        ws.send(JSON.stringify({
          type: 'CONTRACTOR_CONNECT',
          contractorId: contractorId
        }));
        
        setState(prev => ({ ...prev, isConnected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'CONNECTION_CONFIRMED') {
            console.log('Notification connection confirmed for contractor:', message.contractorId);
          } else if (message.type === 'NEW_BID_REQUEST') {
            console.log('New bid request notification received:', message.data);
            
            setState(prev => ({
              ...prev,
              lastNotification: message,
              unreadCount: prev.unreadCount + 1,
            }));

            // Show browser notification if permission granted
            showBrowserNotification(message.data);
            
            // Play notification sound
            playNotificationSound();
          }
        } catch (error) {
          console.error('Error parsing notification message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, isConnected: false }));
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const markAsRead = () => {
    setState(prev => ({ ...prev, unreadCount: 0 }));
  };

  // Connect when contractorId is available
  useEffect(() => {
    if (contractorId) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [contractorId]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    isConnected: state.isConnected,
    lastNotification: state.lastNotification,
    unreadCount: state.unreadCount,
    markAsRead,
    reconnect: connect,
  };
}

function showBrowserNotification(data: BidRequestNotification['data']) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('New Customer Request!', {
      body: `${data.customerName} requested a quote for: ${data.projectDescription}`,
      icon: '/favicon.ico',
      tag: `bid-request-${data.id}`,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }
}

function playNotificationSound() {
  try {
    // Create a short notification beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
}