import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import axiosInstance from '../api/axiosInstance';
import { Send, X, AlertCircle, WifiOff } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { formatRelativeTime } from '../utils/formatDate';

const ChatDrawer = ({ isOpen, onClose, listingId, sellerId, listingTitle, sellerName, listingStatus }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentListingStatus, setCurrentListingStatus] = useState(listingStatus || 'available');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listingStatus) {
      setCurrentListingStatus(listingStatus);
    }
  }, [listingStatus]);

  // Memoize WebSocket URL — only changes when isOpen, listingId, or sellerId change
  const wsUrl = useMemo(() => {
    if (!isOpen || !listingId || !sellerId) return null;
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const apiHost = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '')
      : 'localhost:8000';
    return `${wsScheme}://${apiHost}/ws/chat/${listingId}/?token=${encodeURIComponent(token)}&other_user_id=${encodeURIComponent(sellerId)}`;
  }, [isOpen, listingId, sellerId]);

  // Stable callback for incoming WebSocket messages — uses useCallback to avoid
  // causing the useWebSocket hook to tear down and rebuild the connection on re-renders
  const handleIncomingMessage = useCallback((message) => {
    if (message.type === 'listing_sold') {
      setCurrentListingStatus('sold');
      setMessages((prev) => {
        // Prevent duplicate system messages
        if (prev.some((m) => m.isSystem && m.message === message.message)) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `system-${Date.now()}`,
            sender_id: 'system',
            message: message.message,
            timestamp: new Date().toISOString(),
            isSystem: true
          }
        ];
      });
      return;
    }

    if (message.type === 'error') {
      // Clean up optimistic message on error and log/notify
      console.warn('[ChatDrawer] Error received:', message.message);
      return;
    }

    setMessages((prev) => {
      // Replace matching optimistic message if the server echoes our own message back
      if (message.sender_id === user?.employee_id) {
        const optIndex = prev.findIndex((m) => m.isOptimistic && m.message === message.message);
        if (optIndex !== -1) {
          const updated = [...prev];
          updated[optIndex] = message;
          return updated;
        }
      }
      return [...prev, message];
    });
  }, [user?.employee_id]);

  // Instantiate WebSocket connection — only reconnects when wsUrl changes
  const { status, sendMessage } = useWebSocket(wsUrl, handleIncomingMessage);

  // Fetch chat history from REST API when the drawer opens
  useEffect(() => {
    if (!isOpen || !listingId || !sellerId) return;

    let cancelled = false;

    const fetchChatHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(
          `/api/marketplace/chats/${listingId}/messages/?other_user_id=${encodeURIComponent(sellerId)}`
        );
        if (!cancelled) {
          setMessages(response.data.results || response.data || []);
          if (response.data.listing_status) {
            setCurrentListingStatus(response.data.listing_status);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[ChatDrawer] Error fetching chat history:', err);
          if (err.response?.status === 403) {
            setError('You do not have permission to view this conversation.');
          } else if (err.response?.status === 404) {
            setError('Listing not found.');
          } else {
            // Graceful fallback — show empty state instead of crashing
            setMessages([]);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchChatHistory();

    return () => {
      cancelled = true;
    };
  }, [isOpen, listingId, sellerId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when connection is established
  useEffect(() => {
    if (status === 'Connected' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // Reset state when the drawer closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setNewMessage('');
      setError(null);
      setLoading(true);
      setCurrentListingStatus(listingStatus || 'available');
    }
  }, [isOpen, listingStatus]);

  const handleSend = useCallback((e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !sendMessage) return;

    // Truncate to 1000 chars to match server-side limit
    const safeMessage = trimmed.slice(0, 1000);

    const messageData = {
      message: safeMessage,
      sender_id: user?.employee_id,
      timestamp: new Date().toISOString(),
      isOptimistic: true,
      id: Date.now(),
    };

    // Optimistic update — will be replaced by the server echo
    setMessages((prev) => [...prev, messageData]);

    // Send via WebSocket
    sendMessage({ message: safeMessage });
    setNewMessage('');
  }, [newMessage, sendMessage, user?.employee_id]);

  if (!isOpen) return null;

  // Derive connection status display
  const statusBanner = (() => {
    if (status === 'Connected') return null;
    if (status === 'Connecting...') {
      return { bg: 'bg-yellow-50 text-yellow-800', text: 'Connecting to chat server...' };
    }
    if (status === 'Error') {
      return { bg: 'bg-red-50 text-red-800', text: 'Unable to connect to chat server.' };
    }
    // Disconnected
    return { bg: 'bg-red-50 text-red-800', text: 'Connection lost — reconnecting...' };
  })();

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/30 z-40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — full width on mobile, 400px on desktop */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl flex flex-col z-50 border-l border-gray-200 transition-transform duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#003366] text-white shrink-0">
          <div className="min-w-0 flex-1 mr-3">
            <h3 className="font-semibold text-lg truncate">
              {sellerName ? `Chat with ${sellerName}` : 'Seller Chat'}
            </h3>
            <p className="text-xs text-blue-200 truncate">{listingTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connection Status Banner */}
        {statusBanner && (
          <div className={`px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-1.5 shrink-0 ${statusBanner.bg}`}>
            {status === 'Error' ? <WifiOff className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {statusBanner.text}
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner size="small" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-sm text-red-500">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-3 w-full animate-fade-in">
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm text-center flex items-center gap-2 max-w-[90%]">
                      <AlertCircle className="w-4 h-4 text-red-650 shrink-0" />
                      <span>{msg.message}</span>
                    </div>
                  </div>
                );
              }
              const isMe = (msg.sender_id || msg.sender) === user?.employee_id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3.5 py-2 text-sm shadow-sm ${
                    isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {formatRelativeTime(msg.timestamp)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer or Closed Chat Banner */}
        {currentListingStatus === 'sold' ? (
          <div className="p-4 border-t border-gray-100 bg-red-50 text-red-855 text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-650 shrink-0 animate-bounce" />
            <span>This item has been sold by the owner. Chat is now closed.</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              maxLength={1000}
              className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || status !== 'Connected'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default ChatDrawer;
