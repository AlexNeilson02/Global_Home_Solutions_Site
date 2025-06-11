import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  Paperclip,
  Smile,
  MoreVertical,
  Circle
} from 'lucide-react';

interface Message {
  id: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  readBy: number[];
}

interface Conversation {
  id: string;
  participants: Array<{
    id: number;
    name: string;
    role: string;
    online: boolean;
  }>;
  projectId?: number;
  bidRequestId?: number;
  lastMessage?: Message;
  unreadCount: number;
}

interface RealTimeChatProps {
  currentUserId: number;
  currentUserName: string;
  currentUserRole: string;
  projectId?: number;
  bidRequestId?: number;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  projectId,
  bidRequestId
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: 'conv-1',
        participants: [
          { id: currentUserId, name: currentUserName, role: currentUserRole, online: true },
          { id: 2, name: 'John Smith', role: 'contractor', online: true },
          { id: 3, name: 'Sarah Wilson', role: 'homeowner', online: false }
        ],
        projectId: 1,
        bidRequestId: bidRequestId,
        lastMessage: {
          id: 'msg-1',
          senderId: 2,
          senderName: 'John Smith',
          senderRole: 'contractor',
          content: 'The materials have arrived and we can start tomorrow.',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          type: 'text',
          readBy: [2]
        },
        unreadCount: 1
      },
      {
        id: 'conv-2',
        participants: [
          { id: currentUserId, name: currentUserName, role: currentUserRole, online: true },
          { id: 4, name: 'Mike Johnson', role: 'salesperson', online: true }
        ],
        lastMessage: {
          id: 'msg-2',
          senderId: 4,
          senderName: 'Mike Johnson',
          senderRole: 'salesperson',
          content: 'I have a new lead that might interest you.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'text',
          readBy: [4]
        },
        unreadCount: 0
      }
    ];

    setConversations(mockConversations);
    if (mockConversations.length > 0) {
      setActiveConversation(mockConversations[0].id);
    }
  }, [currentUserId, currentUserName, currentUserRole, bidRequestId]);

  // Mock messages for active conversation
  useEffect(() => {
    if (activeConversation) {
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          senderId: 2,
          senderName: 'John Smith',
          senderRole: 'contractor',
          content: 'Hi! I received your bid request for the kitchen renovation.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'text',
          readBy: [2, currentUserId]
        },
        {
          id: 'msg-2',
          senderId: currentUserId,
          senderName: currentUserName,
          senderRole: currentUserRole,
          content: 'Great! When would you be available to discuss the project details?',
          timestamp: new Date(Date.now() - 90 * 60 * 1000),
          type: 'text',
          readBy: [currentUserId, 2]
        },
        {
          id: 'msg-3',
          senderId: 2,
          senderName: 'John Smith',
          senderRole: 'contractor',
          content: 'I can visit tomorrow at 2 PM to assess the work and provide a detailed quote.',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          type: 'text',
          readBy: [2, currentUserId]
        },
        {
          id: 'msg-4',
          senderId: 2,
          senderName: 'John Smith',
          senderRole: 'contractor',
          content: 'The materials have arrived and we can start tomorrow.',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          type: 'text',
          readBy: [2]
        }
      ];
      setMessages(mockMessages);
    }
  }, [activeConversation, currentUserId, currentUserName, currentUserRole]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      content: newMessage,
      timestamp: new Date(),
      type: 'text',
      readBy: [currentUserId]
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update conversation's last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, lastMessage: message }
          : conv
      )
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const activeConv = conversations.find(c => c.id === activeConversation);

  return (
    <div className="flex h-96 bg-white border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200
        <div className="p-4 border-b border-gray-200
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages
          </h3>
        </div>
        <div className="overflow-y-auto h-full">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                activeConversation === conversation.id ? 'bg-blue-50 : ''
              }`}
              onClick={() => setActiveConversation(conversation.id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(conversation.participants.find(p => p.id !== currentUserId)?.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.participants.some(p => p.id !== currentUserId && p.online) && (
                    <Circle className="absolute -bottom-1 -right-1 h-3 w-3 fill-green-500 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {conversation.participants.find(p => p.id !== currentUserId)?.name}
                    </p>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-xs text-gray-600 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {conversation.participants.find(p => p.id !== currentUserId)?.role}
                    </Badge>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(activeConv.participants.find(p => p.id !== currentUserId)?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">
                    {activeConv.participants.find(p => p.id !== currentUserId)?.name}
                  </h4>
                  <p className="text-xs text-gray-500 capitalize">
                    {activeConv.participants.find(p => p.id !== currentUserId)?.role}
                    {activeConv.participants.find(p => p.id !== currentUserId)?.online && (
                      <span className="text-green-500 ml-1">• Online</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.senderId !== currentUserId && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      message.senderId === currentUserId
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === currentUserId
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                  {message.senderId === currentUserId && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button onClick={sendMessage} size="sm" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900
                Select a conversation
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeChat;