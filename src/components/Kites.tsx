import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, ArrowLeft, User, Search, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { Conversation, ThreadMessage } from '../types';

export default function Kites({ onNavigate }: { onNavigate?: (tab: any) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const { token, user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = () => {
    fetch('/api/kites/conversations', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setConversations(data);
      }
    })
    .catch(console.error);
  };

  const fetchThread = (otherUserId: string) => {
    fetch(`/api/kites/thread/${otherUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setMessages(data);
        scrollToBottom();
      }
    })
    .catch(console.error);
  };

  const markAsRead = (otherUserId: string) => {
    fetch(`/api/kites/read/${otherUserId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => fetchConversations())
    .catch(console.error);
  };

  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 10 seconds
    const interval = setInterval(() => {
      fetchConversations();
      if (activeThread) {
        fetchThread(activeThread);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [token, activeThread]);

  useEffect(() => {
    if (activeThread) {
      fetchThread(activeThread);
      markAsRead(activeThread);
    }
  }, [activeThread]);

  const filteredConversations = conversations.filter(c => 
    c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(m =>
    m.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleReply = async () => {
    if (!replyContent || !activeThread) return;

    try {
      await fetch('/api/kites', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: activeThread, content: replyContent })
      });
      setReplyContent('');
      fetchThread(activeThread);
      fetchConversations();
    } catch (err) {
      alert('Failed to send reply.');
    }
  };

  const activeConversation = conversations.find(c => c.other_user_id === activeThread);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter">Kites</h2>
        <p className="text-xl opacity-60 max-w-2xl">
          Direct messages with your brothers. Keep in touch, share advice, and stay strong.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-[#141414] bg-white h-[700px] shadow-2xl overflow-hidden rounded-sm">
        {/* Conversations List */}
        <div className={`lg:col-span-1 border-r border-[#141414] flex flex-col ${activeThread ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-[#141414] bg-[#141414] text-[#E4E3E0] space-y-4">
            <h2 className="text-2xl font-serif italic">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} />
              <input 
                type="text"
                placeholder="Search kites..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-sm py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-white/40 placeholder:text-white/30"
              />
            </div>
          </div>
          <div className="divide-y divide-[#141414]/10 flex-1 overflow-y-auto">
            {filteredConversations.length === 0 && (
              <div className="p-12 text-center opacity-40 text-sm italic font-serif">
                {searchQuery ? "No matching conversations found." : "No conversations yet."}
              </div>
            )}
            {filteredConversations.map((conv) => (
              <button
                key={conv.other_user_id}
                onClick={() => setActiveThread(conv.other_user_id)}
                className={`w-full text-left p-6 hover:bg-[#141414]/5 transition-all group relative overflow-hidden ${activeThread === conv.other_user_id ? 'bg-[#141414]/5' : ''}`}
              >
                {activeThread === conv.other_user_id && (
                  <motion.div layoutId="active-bg" className="absolute inset-y-0 left-0 w-1 bg-[#141414]" />
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold uppercase tracking-widest text-xs ${conv.unread_count > 0 ? 'text-[#141414]' : 'opacity-60'}`}>
                    {conv.other_user_name}
                  </span>
                  <span className="text-[10px] opacity-40 flex items-center gap-1 font-mono">
                    {new Date(conv.last_message_time).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-end gap-4">
                  <p className={`text-sm line-clamp-1 flex-1 ${conv.unread_count > 0 ? 'font-bold text-[#141414]' : 'opacity-60'}`}>
                    {conv.sender_id === user?.id ? (
                      <span className="opacity-40 italic">You: </span>
                    ) : ''}
                    {conv.last_message}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="bg-[#141414] text-[#E4E3E0] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread View */}
        <div className={`lg:col-span-2 flex flex-col bg-[#F9F9F8] ${!activeThread ? 'hidden lg:flex' : 'flex'}`}>
          {activeThread ? (
            <>
              <div className="p-4 md:p-6 border-b border-[#141414] bg-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveThread(null)}
                    className="lg:hidden p-2 -ml-2 hover:bg-[#141414]/5 rounded-full"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="bg-[#141414] text-[#E4E3E0] p-2 rounded-full hidden sm:block">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-serif italic">{activeConversation?.other_user_name || 'Loading...'}</h3>
                      <button 
                        onClick={() => onNavigate?.('profile')}
                        className="p-1 hover:bg-[#141414]/5 rounded-sm opacity-40 hover:opacity-100 transition-all"
                        title="View Profile"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Member since {new Date().getFullYear()}
                    </span>
                  </div>
                </div>
                
                <div className="relative hidden md:block w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={12} />
                  <input 
                    type="text"
                    placeholder="Search thread..."
                    value={messageSearchQuery}
                    onChange={e => setMessageSearchQuery(e.target.value)}
                    className="w-full border-b border-[#141414]/10 py-1 pl-8 text-xs focus:outline-none focus:border-[#141414]/40 bg-transparent"
                  />
                </div>
              </div>
              
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-[#141414]/10 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                  {filteredMessages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    const showDate = idx === 0 || new Date(msg.timestamp).toDateString() !== new Date(filteredMessages[idx - 1].timestamp).toDateString();
                    
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col"
                      >
                        {showDate && (
                          <div className="flex justify-center my-8">
                            <span className="text-[10px] uppercase tracking-widest opacity-40 bg-[#E4E3E0] px-4 py-1 rounded-full border border-[#141414]/5">
                              {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl shadow-sm ${
                            isMe 
                              ? 'bg-[#141414] text-[#E4E3E0] rounded-tr-none' 
                              : 'bg-white border border-[#141414]/10 rounded-tl-none text-[#141414]'
                          }`}>
                            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-1.5 opacity-40 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[9px] font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            {isMe && (
                              <span title={msg.is_read ? `Read ${new Date(msg.read_at!).toLocaleTimeString()}` : 'Delivered'}>
                                {msg.is_read ? (
                                  <CheckCheck size={12} className="text-blue-500" />
                                ) : (
                                  <Check size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 md:p-6 border-t border-[#141414]/10 bg-white">
                <div className="relative flex gap-3 items-end">
                  <textarea 
                    rows={1}
                    value={replyContent}
                    onChange={e => {
                      setReplyContent(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    placeholder="Type a kite..."
                    className="flex-1 bg-transparent border border-[#141414]/20 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 text-base resize-none max-h-32 transition-all"
                  />
                  <button 
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                    className="bg-[#141414] text-[#E4E3E0] p-4 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center shrink-0"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8 opacity-10"
              >
                <Send size={120} strokeWidth={1} />
              </motion.div>
              <h3 className="text-3xl font-serif italic text-[#141414]/30 mb-2">Your Kites</h3>
              <p className="text-[#141414]/40 max-w-xs">Select a brother from the list or search to send a new kite.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
