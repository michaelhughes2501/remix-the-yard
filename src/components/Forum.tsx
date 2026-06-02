import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, ArrowLeft, Send, Clock, User, Hash, Search, Flag } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { Thread, Reply } from '../types';
import { calculateRelevanceScore } from '../utils/searchUtils';

type ViewState = 'list' | 'create' | 'thread';

export default function Forum() {
  const { token } = useAuth();
  const [view, setView] = useState<ViewState>('list');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<{ thread: Thread & { author_history?: string, author_location?: string }, replies: Reply[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newContent, setNewContent] = useState('');
  
  // Reply form state
  const [replyContent, setReplyContent] = useState('');

  const fetchThreads = () => {
    fetch('/api/threads', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setThreads(data))
      .catch(console.error);
  };

  useEffect(() => {
    if (view === 'list') fetchThreads();
  }, [view, token]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, category: newCategory, content: newContent })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewContent('');
        setView('list');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewThread = async (id: string) => {
    try {
      const res = await fetch(`/api/threads/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setActiveThread(data);
      setView('thread');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyContent) return;
    try {
      const res = await fetch(`/api/threads/${activeThread.thread.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: replyContent })
      });
      const data = await res.json();
      if (data.success) {
        setReplyContent('');
        handleViewThread(activeThread.thread.id); // Refresh thread
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlagThread = async (id: string) => {
    if (!window.confirm('Are you sure you want to flag this thread for moderation?')) return;
    try {
      const res = await fetch(`/api/threads/${id}/flag`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Thread flagged for review.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlagReply = async (id: string) => {
    if (!window.confirm('Are you sure you want to flag this reply for moderation?')) return;
    try {
      const res = await fetch(`/api/replies/${id}/flag`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Reply flagged for review.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (view === 'create') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
        <button 
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft size={16} /> Back to Forum
        </button>

        <div>
          <h2 className="text-4xl font-serif italic mb-2">Start a Discussion</h2>
          <p className="opacity-60">Ask a question, share your story, or support a brother.</p>
        </div>

        <form onSubmit={handleCreateThread} className="bg-white border border-[#141414] p-8 space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2">Title</label>
            <input 
              required
              type="text" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full border border-[#141414] p-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 text-lg"
              placeholder="What's on your mind?"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2">Category</label>
            <select 
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full border border-[#141414] p-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 appearance-none bg-transparent"
            >
              <option value="general">General</option>
              <option value="parole">Parole & Probation</option>
              <option value="jobs">Employment</option>
              <option value="housing">Housing</option>
              <option value="support">Support & Advice</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2">Message</label>
            <textarea 
              required
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="w-full border border-[#141414] p-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 min-h-[200px]"
              placeholder="Share the details here..."
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-[#141414] text-[#E4E3E0] p-4 uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
          >
            <Send size={18} /> Post Thread
          </button>
        </form>
      </motion.div>
    );
  }

  if (view === 'thread' && activeThread) {
    const { thread, replies } = activeThread;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft size={16} /> Back to Forum
        </button>

        {/* Original Post */}
        <div className="bg-white border border-[#141414]">
          <div className="p-8 border-b border-[#141414]/10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60">
                <Hash size={14} /> {thread.category}
                <span className="mx-2">•</span>
                <Clock size={14} /> {new Date(thread.timestamp).toLocaleString()}
              </div>
              <button 
                onClick={() => handleFlagThread(thread.id)}
                className="text-orange-600 hover:bg-orange-50 p-2 rounded transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-bold"
                title="Flag for moderation"
              >
                <Flag size={14} /> Flag
              </button>
            </div>
            <h2 className="text-3xl font-serif italic mb-6">{thread.title}</h2>
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{thread.content}</p>
          </div>
          <div className="bg-[#141414]/5 p-6 flex items-center gap-4">
            <div className="bg-[#141414] text-[#E4E3E0] p-3 rounded-sm">
              <User size={24} />
            </div>
            <div>
              <div className="font-bold uppercase tracking-widest text-sm">{thread.author_name}</div>
              <div className="text-xs opacity-60 mt-1">
                {thread.author_history || 'Unknown Facility'} • {thread.author_location || 'Unknown Location'}
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-6">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h3>
          
          {replies.map((reply) => (
            <div key={reply.id} className="bg-white border border-[#141414] p-6 flex gap-6">
              <div className="hidden sm:block">
                <div className="bg-[#141414]/10 text-[#141414] p-2 rounded-sm">
                  <User size={20} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <span className="font-bold uppercase tracking-widest text-xs">{reply.author_name}</span>
                    <span className="text-[10px] opacity-40 flex items-center gap-1">
                      <Clock size={10} /> {new Date(reply.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleFlagReply(reply.id)}
                    className="text-orange-600 hover:bg-orange-50 p-2 rounded transition-colors"
                    title="Flag for moderation"
                  >
                    <Flag size={14} />
                  </button>
                </div>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <form onSubmit={handleReply} className="bg-white border border-[#141414] p-6 mt-8">
          <label className="block text-xs uppercase tracking-widest font-bold mb-4">Add a Reply</label>
          <textarea 
            required
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            className="w-full border border-[#141414] p-4 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 min-h-[120px] mb-4"
            placeholder="Write your response..."
          />
          <div className="flex justify-end">
            <button 
              type="submit"
              className="bg-[#141414] text-[#E4E3E0] px-8 py-3 uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Send size={16} /> Reply
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  // List View
  const filteredThreads = threads
    .map(thread => ({
      ...thread,
      relevance: calculateRelevanceScore(thread, searchQuery, {
        title: 4,
        category: 3,
        content: 2,
        author_name: 1
      })
    }))
    .filter(thread => searchQuery.trim() === '' || thread.relevance > 0)
    .sort((a, b) => {
      if (searchQuery.trim() === '') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return b.relevance - a.relevance;
    });

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <h2 className="text-6xl font-serif italic tracking-tighter">Community Forum</h2>
          <p className="text-xl opacity-60 max-w-2xl">
            Connect with others, share advice, and find support from people who understand the journey.
          </p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="bg-[#141414] text-[#E4E3E0] px-6 py-4 uppercase tracking-widest text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> New Thread
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search threads by title, content, or category..."
          className="w-full bg-white border border-[#141414] py-6 pl-14 pr-6 text-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all"
        />
      </div>

      <div className="bg-white border border-[#141414] divide-y divide-[#141414]/10">
        {filteredThreads.length === 0 && (
          <div className="p-12 text-center opacity-60">
            {threads.length === 0 ? "No threads yet. Be the first to start a discussion." : "No threads found matching your search."}
          </div>
        )}
        {filteredThreads.map((thread) => (
          <div 
            key={thread.id} 
            onClick={() => handleViewThread(thread.id)}
            className="p-6 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer group flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-80 mb-2">
                <Hash size={12} /> {thread.category}
              </div>
              <h3 className="text-xl font-bold mb-2">{thread.title}</h3>
              <div className="flex items-center gap-4 text-xs font-mono opacity-60 group-hover:opacity-80">
                <span className="flex items-center gap-1"><User size={14} /> {thread.author_name}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(thread.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-mono bg-[#E4E3E0] text-[#141414] px-4 py-2 rounded-sm group-hover:bg-white/10 group-hover:text-white transition-colors">
              <MessageSquare size={16} />
              {thread.reply_count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
