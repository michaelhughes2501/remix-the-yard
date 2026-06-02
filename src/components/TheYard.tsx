import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MapPin, History, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { User } from '../types';
import { calculateRelevanceScore } from '../utils/searchUtils';

export default function TheYard() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'connections'>('all');
  const { token } = useAuth();

  useEffect(() => {
    // Fetch all users list
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Expected array of users, got:', data);
      }
    })
    .catch(console.error);

    // Fetch user's connection list
    fetch('/api/connections', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setConnectedIds(data);
      }
    })
    .catch(console.error);
  }, [token]);

  const handleSendKite = async (receiverId: string, name: string) => {
    const content = prompt(`Send a kite to ${name}:`);
    if (!content) return;
    
    try {
      await fetch('/api/kites', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId, content })
      });
      alert('Kite sent successfully! Check your Kites tab to view the conversation.');
    } catch (err) {
      alert('Failed to send kite.');
    }
  };

  const handleToggleConnect = async (e: React.MouseEvent, userId: string, isCurrentlyConnected: boolean) => {
    e.stopPropagation(); // Avoid parent click actions
    try {
      const url = isCurrentlyConnected ? `/api/connections/${userId}` : '/api/connections';
      const method = isCurrentlyConnected ? 'DELETE' : 'POST';
      const body = isCurrentlyConnected ? undefined : JSON.stringify({ receiverId: userId });

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body
      });

      if (res.ok) {
        if (isCurrentlyConnected) {
          setConnectedIds(prev => prev.filter(id => id !== userId));
        } else {
          setConnectedIds(prev => [...prev, userId]);
        }
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update connection.');
      }
    } catch (err) {
      console.error('Error toggling connection:', err);
      alert('An error occurred while updating the connection.');
    }
  };

  const finalFilteredUsers = users
    .filter(u => filterMode === 'all' || connectedIds.includes(u.id))
    .map(u => ({
      ...u,
      relevance: calculateRelevanceScore(u, search, {
        name: 3,
        history: 2, // facility
        location: 2,
        bio: 1
      })
    }))
    .filter(u => search.trim() === '' || u.relevance > 0)
    .sort((a, b) => {
      if (search.trim() === '') return 0; // Keep original order if no search
      return b.relevance - a.relevance;
    });

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter">The Yard</h2>
        <p className="text-xl opacity-60 max-w-2xl">
          Find the people you walked the line with. Search by facility, name, or location.
        </p>
      </header>

      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by facility (e.g. San Quentin), name, or state..."
            className="w-full bg-white border border-[#141414] py-6 pl-14 pr-6 text-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all"
          />
        </div>

        {/* Elegant Connections Filter Switch */}
        <div className="flex border border-[#141414] bg-white text-xs font-bold uppercase tracking-widest max-w-md">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-4 text-center border-r border-[#141414] transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'hover:bg-gray-100 text-[#141414]'
            }`}
          >
            All Members
          </button>
          <button
            onClick={() => setFilterMode('connections')}
            className={`flex-1 py-4 text-center transition-colors cursor-pointer ${
              filterMode === 'connections'
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'hover:bg-gray-100 text-[#141414]'
            }`}
          >
            Connected ({connectedIds.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {finalFilteredUsers.length === 0 && (
          <div className="col-span-full p-12 text-center opacity-60 border border-dashed border-[#141414] bg-white font-serif italic">
            {filterMode === 'connections' 
              ? "You haven't connected with anyone in The Yard yet. Find peers below to build your network." 
              : "No users found. Be the first to invite your brothers."}
          </div>
        )}
        {finalFilteredUsers.map((user, idx) => {
          const isConnected = connectedIds.includes(user.id);
          return (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white border border-[#141414] p-8 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-serif italic mb-1">{user.name}</h3>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60">
                    <MapPin size={12} />
                    {user.location || 'Unknown Location'}
                  </div>
                </div>
                <button 
                  onClick={(e) => handleToggleConnect(e, user.id, isConnected)}
                  title={isConnected ? 'Disconnect' : 'Connect'}
                  className={`p-3 border rounded-full transition-colors cursor-pointer ${
                    isConnected 
                      ? 'bg-[#141414] text-[#E4E3E0] border-[#E4E3E0] group-hover:bg-[#E4E3E0] group-hover:text-[#141414] group-hover:border-[#141414]' 
                      : 'border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] group-hover:border-current group-hover:hover:bg-[#E4E3E0] group-hover:hover:text-[#141414]'
                  }`}
                  id={`connect-btn-${user.id}`}
                >
                  {isConnected ? <UserCheck size={20} /> : <UserPlus size={20} />}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <History size={16} className="opacity-40" />
                  <span className="opacity-60">Facility:</span>
                  <span>{user.history || 'Not specified'}</span>
                </div>
                <p className="text-sm leading-relaxed opacity-80">
                  "{user.bio || 'No bio provided.'}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-current/10 flex gap-4">
                <button 
                  onClick={() => handleSendKite(user.id, user.name)}
                  className="text-xs uppercase tracking-widest font-bold hover:underline cursor-pointer"
                >
                  Send Kite
                </button>
                <span className="text-xs uppercase tracking-widest opacity-40 select-none">|</span>
                <span className="text-xs uppercase tracking-widest font-bold font-mono">
                  {isConnected ? '✓ Linked Connection' : 'Not Connected'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
