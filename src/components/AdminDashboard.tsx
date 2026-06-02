import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { ShieldAlert, Users, Briefcase, Home, MessageSquare, Trash2, ShieldCheck, Flag, Ban, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ users: 0, jobs: 0, housing: 0, posts: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [flaggedContent, setFlaggedContent] = useState<{threads: any[], replies: any[]}>({ threads: [], replies: [] });
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'flagged' | 'logs'>('overview');

  const currentUserRole = user?.role === 'user' && user?.is_admin === 1 ? 'super_admin' : (user?.role || 'user');

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);

    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (activeTab === 'flagged') {
      fetch('/api/admin/flagged', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.threads)) setFlaggedContent(data);
        })
        .catch(console.error);
    } else if (activeTab === 'logs') {
      fetch('/api/admin/logs', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setLogs(data);
        })
        .catch(console.error);
    }
  }, [activeTab, token]);

  const deleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        setStats(s => ({ ...s, users: s.users - 1 }));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const suspendUser = async (id: string, currentStatus: number) => {
    const action = currentStatus === 1 ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}/suspend`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ suspend: currentStatus === 1 ? false : true })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, is_suspended: currentStatus === 1 ? 0 : 1 } : u));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dismissFlag = async (type: string, id: string) => {
    try {
      const res = await fetch(`/api/admin/flagged/${type}/${id}/dismiss`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (type === 'thread') {
          setFlaggedContent(prev => ({ ...prev, threads: prev.threads.filter(t => t.id !== id) }));
        } else {
          setFlaggedContent(prev => ({ ...prev, replies: prev.replies.filter(r => r.id !== id) }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFlaggedContent = async (type: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    try {
      const res = await fetch(`/api/admin/flagged/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (type === 'thread') {
          setFlaggedContent(prev => ({ ...prev, threads: prev.threads.filter(t => t.id !== id) }));
        } else {
          setFlaggedContent(prev => ({ ...prev, replies: prev.replies.filter(r => r.id !== id) }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter flex items-center gap-4">
          <ShieldAlert size={48} className="text-red-600" /> Admin Dashboard
        </h2>
        <p className="text-xl opacity-60">
          Platform moderation and management.
        </p>
      </header>

      <div className="flex border-b border-[#141414]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-8 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${
            activeTab === 'overview' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-8 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${
            activeTab === 'users' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
          }`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-8 py-4 text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'flagged' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
          }`}
        >
          Moderation Queue
          {(flaggedContent.threads.length > 0 || flaggedContent.replies.length > 0) && (
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">
              {flaggedContent.threads.length + flaggedContent.replies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-8 py-4 text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'logs' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
          }`}
        >
          Logs
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#141414] p-6">
            <div className="flex items-center gap-4 mb-4 opacity-60">
              <Users size={24} />
              <h3 className="text-xs uppercase tracking-widest font-bold">Total Users</h3>
            </div>
            <p className="text-4xl font-serif italic">{stats.users}</p>
          </div>
          <div className="bg-white border border-[#141414] p-6">
            <div className="flex items-center gap-4 mb-4 opacity-60">
              <Briefcase size={24} />
              <h3 className="text-xs uppercase tracking-widest font-bold">Job Listings</h3>
            </div>
            <p className="text-4xl font-serif italic">{stats.jobs}</p>
          </div>
          <div className="bg-white border border-[#141414] p-6">
            <div className="flex items-center gap-4 mb-4 opacity-60">
              <Home size={24} />
              <h3 className="text-xs uppercase tracking-widest font-bold">Housing Options</h3>
            </div>
            <p className="text-4xl font-serif italic">{stats.housing}</p>
          </div>
          <div className="bg-white border border-[#141414] p-6">
            <div className="flex items-center gap-4 mb-4 opacity-60">
              <MessageSquare size={24} />
              <h3 className="text-xs uppercase tracking-widest font-bold">Forum Posts</h3>
            </div>
            <p className="text-4xl font-serif italic">{stats.posts}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-[#141414] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-[#E4E3E0] text-xs uppercase tracking-widest">
                <th className="p-4 font-bold">Username</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Joined</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/10">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-[#141414]/5 transition-colors ${u.is_suspended === 1 ? 'opacity-60 bg-red-50/50' : ''}`}>
                  <td className="p-4 font-bold flex items-center gap-2">
                    {u.name}
                    {u.is_suspended === 1 && <span title="Suspended"><Ban size={14} className="text-red-600" /></span>}
                  </td>
                  <td className="p-4 opacity-80">{u.email}</td>
                  <td className="p-4">
                    <div className="flex gap-2 items-center flex-wrap">
                      {currentUserRole === 'super_admin' && u.id !== user?.id ? (
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className="text-xs border border-[#141414] p-1 bg-white cursor-pointer"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      ) : (
                        <>
                          {u.role === 'super_admin' && <span className="bg-purple-100 text-purple-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Super Admin</span>}
                          {u.role === 'admin' && <span className="bg-red-100 text-red-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Admin</span>}
                          {u.role === 'moderator' && <span className="bg-orange-100 text-orange-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Moderator</span>}
                          {(u.role === 'user' || !u.role) && <span className="opacity-60 text-[10px] uppercase tracking-widest">User</span>}
                        </>
                      )}
                      {u.is_mentor === 1 && <span className="bg-blue-100 text-blue-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Mentor</span>}
                      {u.is_suspended === 1 && <span className="bg-red-600 text-white text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Suspended</span>}
                    </div>
                  </td>
                  <td className="p-4 opacity-60 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {u.id !== user?.id && u.role !== 'super_admin' && (
                        <button 
                          onClick={() => suspendUser(u.id, u.is_suspended)}
                          className={`${u.is_suspended === 1 ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'} p-2 rounded transition-colors`}
                          title={u.is_suspended === 1 ? "Unsuspend User" : "Suspend User"}
                        >
                          {u.is_suspended === 1 ? <CheckCircle size={16} /> : <Ban size={16} />}
                        </button>
                      )}
                      {(currentUserRole === 'super_admin' || currentUserRole === 'admin') && u.role !== 'super_admin' && u.id !== user?.id && (
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'flagged' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h3 className="text-2xl font-serif italic flex items-center gap-2">
                <Flag className="text-red-600" size={24} /> Moderation Queue
              </h3>
              <p className="text-sm opacity-60 mt-1">Review and take action on user-flagged content.</p>
            </div>
          </div>

          {flaggedContent.threads.length === 0 && flaggedContent.replies.length === 0 ? (
            <div className="bg-white border border-[#141414] p-12 text-center opacity-60 font-serif italic">
              No flagged content in the queue.
            </div>
          ) : (
            <>
              {flaggedContent.threads.map(thread => (
                <div key={thread.id} className="bg-white border border-[#141414] p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-red-100 text-red-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Flagged Thread</span>
                        <span className="text-sm opacity-60">by {thread.author_name}</span>
                      </div>
                      <h3 className="font-bold text-xl">{thread.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => dismissFlag('thread', thread.id)}
                        className="px-4 py-2 border border-[#141414] text-xs uppercase tracking-widest font-bold hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                      >
                        Dismiss
                      </button>
                      <button 
                        onClick={() => deleteFlaggedContent('thread', thread.id)}
                        className="px-4 py-2 bg-red-600 text-white text-xs uppercase tracking-widest font-bold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="opacity-80 whitespace-pre-wrap">{thread.content}</p>
                </div>
              ))}

              {flaggedContent.replies.map(reply => (
                <div key={reply.id} className="bg-white border border-[#141414] p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-orange-100 text-orange-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Flagged Reply</span>
                        <span className="text-sm opacity-60">by {reply.author_name}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => dismissFlag('reply', reply.id)}
                        className="px-4 py-2 border border-[#141414] text-xs uppercase tracking-widest font-bold hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                      >
                        Dismiss
                      </button>
                      <button 
                        onClick={() => deleteFlaggedContent('reply', reply.id)}
                        className="px-4 py-2 bg-red-600 text-white text-xs uppercase tracking-widest font-bold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="opacity-80 whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white border border-[#141414] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-[#E4E3E0] text-xs uppercase tracking-widest">
                <th className="p-4 font-bold">Timestamp</th>
                <th className="p-4 font-bold">Moderator</th>
                <th className="p-4 font-bold">Action</th>
                <th className="p-4 font-bold">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/10">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center opacity-60 font-serif italic">
                    No moderation logs found.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#141414]/5 transition-colors">
                    <td className="p-4 opacity-60 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4 font-bold">{log.moderator_name || 'Unknown'}</td>
                    <td className="p-4">
                      <span className="text-[10px] uppercase tracking-widest px-2 py-1 font-bold bg-[#141414]/10">
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 opacity-80 text-sm">
                      {log.target_type} ({log.target_id.substring(0, 8)}...)
                      {log.details && (
                        <div className="text-[10px] opacity-60 mt-1">
                          {log.details}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
