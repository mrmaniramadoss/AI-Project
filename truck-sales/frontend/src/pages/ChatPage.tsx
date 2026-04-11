import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Conversation {
  user: { id: number; username: string; full_name: string; role: string };
  unread_count: number;
  last_message: { message: string; sender_id: number; created_at: string } | null;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  sender_name: string;
  created_at: string;
  is_read: number;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetchConversations();
    const chatUser = searchParams.get('user');
    if (chatUser) setSelectedUser(Number(chatUser));
  }, [searchParams]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 3000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.get(`/chat/messages/${selectedUser}?per_page=100`);
      setMessages([...res.data.items].reverse());
    } catch {
      // ignore
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    setSending(true);
    try {
      await api.post('/chat', { receiver_id: selectedUser, message: newMessage });
      setNewMessage('');
      fetchMessages();
      fetchConversations();
    } catch {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find(c => c.user.id === selectedUser);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6" /> Messages
      </h1>

      <div className="bg-white rounded-xl shadow overflow-hidden flex" style={{ height: '600px' }}>
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r flex-shrink-0 overflow-y-auto ${selectedUser ? 'hidden md:block' : ''}`}>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start by contacting a dealer from a truck listing</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button key={conv.user.id} onClick={() => setSelectedUser(conv.user.id)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                  selectedUser === conv.user.id ? 'bg-blue-50' : ''
                }`}>
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{conv.user.full_name || conv.user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{conv.user.role}</p>
                    {conv.last_message && (
                      <p className="text-sm text-gray-500 truncate mt-1">{conv.last_message.message}</p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <p className="font-medium">{selectedConv?.user.full_name || selectedConv?.user.username || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{selectedConv?.user.role}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      msg.sender_id === user?.id
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
