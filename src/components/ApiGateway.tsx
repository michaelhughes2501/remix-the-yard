import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import {
  Network,
  KeyRound,
  Plus,
  Copy,
  Check,
  Power,
  Trash2,
  Activity,
  Gauge,
  Clock,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string;
  rate_limit: number;
  is_active: number;
  request_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface GatewayStats {
  activeKeys: number;
  totalKeys: number;
  totalRequests: number;
  requests24h: number;
  avgResponseMs: number;
  topEndpoints: { path: string; c: number }[];
}

interface RequestLog {
  id: string;
  method: string;
  path: string;
  status: number;
  ip: string;
  response_ms: number;
  timestamp: string;
  key_name: string | null;
}

const ALL_SCOPES = [
  { id: 'jobs:read', label: 'Jobs (read)' },
  { id: 'housing:read', label: 'Housing (read)' },
  { id: 'stats:read', label: 'Stats (read)' },
];

export default function ApiGateway() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'logs' | 'docs'>('overview');
  const [stats, setStats] = useState<GatewayStats | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);

  // Create-key form state.
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState<string[]>(ALL_SCOPES.map(s => s.id));
  const [newLimit, setNewLimit] = useState(60);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadStats = useCallback(() => {
    fetch('/api/gateway/stats', { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if (data && typeof data.totalKeys === 'number') setStats(data); })
      .catch(console.error);
  }, [token]);

  const loadKeys = useCallback(() => {
    fetch('/api/gateway/keys', { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setKeys(data); })
      .catch(console.error);
  }, [token]);

  const loadLogs = useCallback(() => {
    fetch('/api/gateway/logs', { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLogs(data); })
      .catch(console.error);
  }, [token]);

  useEffect(() => { loadStats(); loadKeys(); }, [loadStats, loadKeys]);
  useEffect(() => { if (activeTab === 'logs') loadLogs(); }, [activeTab, loadLogs]);

  const toggleScope = (scope: string) => {
    setNewScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const createKey = async () => {
    setError('');
    if (!newName.trim()) { setError('Give the key a name.'); return; }
    if (newScopes.length === 0) { setError('Select at least one scope.'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/gateway/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ name: newName.trim(), scopes: newScopes, rate_limit: newLimit }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedKey(data.key);
        setNewName('');
        setNewScopes(ALL_SCOPES.map(s => s.id));
        setNewLimit(60);
        setShowForm(false);
        loadKeys();
        loadStats();
      } else {
        setError(data.error || 'Failed to create key.');
      }
    } catch {
      setError('Network error creating key.');
    } finally {
      setCreating(false);
    }
  };

  const copyKey = () => {
    if (!createdKey) return;
    navigator.clipboard?.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleKey = async (id: string) => {
    const res = await fetch(`/api/gateway/keys/${id}/toggle`, { method: 'PUT', headers: authHeaders });
    if (res.ok) { loadKeys(); loadStats(); }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm('Revoke this key permanently? Any app using it will stop working immediately.')) return;
    const res = await fetch(`/api/gateway/keys/${id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) { loadKeys(); loadStats(); }
  };

  const statusColor = (status: number) =>
    status < 300 ? 'text-green-700 bg-green-100'
      : status < 400 ? 'text-blue-700 bg-blue-100'
      : status === 429 ? 'text-orange-700 bg-orange-100'
      : 'text-red-700 bg-red-100';

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter flex items-center gap-4">
          <Network size={48} className="text-[#141414]" /> API Gateway
        </h2>
        <p className="text-xl opacity-60">
          Mint scoped, rate-limited API keys for programmatic access to The Yard's public data.
        </p>
      </header>

      {/* One-time key reveal */}
      {createdKey && (
        <div className="bg-[#141414] text-[#E4E3E0] p-6 border border-[#141414]">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-green-400" />
            <h3 className="text-xs uppercase tracking-widest font-bold">New key — copy it now</h3>
          </div>
          <p className="text-sm opacity-70 mb-4">
            This is the only time the full key is shown. Store it somewhere safe.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="bg-black/40 px-4 py-3 text-sm font-mono break-all flex-1 min-w-[240px]">{createdKey}</code>
            <button
              onClick={copyKey}
              className="flex items-center gap-2 bg-[#E4E3E0] text-[#141414] px-4 py-3 text-xs uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-4 text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100"
          >
            I've saved it — dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#141414] flex-wrap">
        {(['overview', 'keys', 'logs', 'docs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${
              activeTab === tab ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
            }`}
          >
            {tab === 'keys' ? 'API Keys' : tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-[#141414] p-6">
              <div className="flex items-center gap-4 mb-4 opacity-60">
                <KeyRound size={24} />
                <h3 className="text-xs uppercase tracking-widest font-bold">Active Keys</h3>
              </div>
              <p className="text-4xl font-serif italic">{stats?.activeKeys ?? 0}<span className="text-lg opacity-40"> / {stats?.totalKeys ?? 0}</span></p>
            </div>
            <div className="bg-white border border-[#141414] p-6">
              <div className="flex items-center gap-4 mb-4 opacity-60">
                <Activity size={24} />
                <h3 className="text-xs uppercase tracking-widest font-bold">Total Requests</h3>
              </div>
              <p className="text-4xl font-serif italic">{stats?.totalRequests ?? 0}</p>
            </div>
            <div className="bg-white border border-[#141414] p-6">
              <div className="flex items-center gap-4 mb-4 opacity-60">
                <Clock size={24} />
                <h3 className="text-xs uppercase tracking-widest font-bold">Last 24 Hours</h3>
              </div>
              <p className="text-4xl font-serif italic">{stats?.requests24h ?? 0}</p>
            </div>
            <div className="bg-white border border-[#141414] p-6">
              <div className="flex items-center gap-4 mb-4 opacity-60">
                <Gauge size={24} />
                <h3 className="text-xs uppercase tracking-widest font-bold">Avg Response</h3>
              </div>
              <p className="text-4xl font-serif italic">{stats?.avgResponseMs ?? 0}<span className="text-lg opacity-40">ms</span></p>
            </div>
          </div>

          <div className="bg-white border border-[#141414] p-6">
            <h3 className="text-xs uppercase tracking-widest font-bold opacity-60 mb-4">Top Endpoints</h3>
            {stats && stats.topEndpoints.length > 0 ? (
              <div className="space-y-3">
                {stats.topEndpoints.map(ep => {
                  const max = stats.topEndpoints[0].c || 1;
                  return (
                    <div key={ep.path} className="flex items-center gap-4">
                      <code className="text-sm font-mono w-56 shrink-0 truncate">{ep.path}</code>
                      <div className="flex-1 bg-[#141414]/10 h-4">
                        <div className="bg-[#141414] h-4" style={{ width: `${(ep.c / max) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{ep.c}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="opacity-60 font-serif italic">No traffic yet. Create a key and make a request.</p>
            )}
          </div>
        </div>
      )}

      {/* Keys */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <h3 className="text-2xl font-serif italic flex items-center gap-2">
              <KeyRound size={24} /> API Keys
            </h3>
            <button
              onClick={() => { setShowForm(!showForm); setError(''); }}
              className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 text-xs uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
            >
              <Plus size={16} /> {showForm ? 'Cancel' : 'New Key'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white border border-[#141414] p-6 space-y-5">
              {error && <div className="bg-red-100 text-red-800 text-sm px-4 py-2 border border-red-300">{error}</div>}
              <div>
                <label className="text-xs uppercase tracking-widest font-bold opacity-60 block mb-2">Key Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Partner job board"
                  className="w-full border border-[#141414] p-3 bg-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest font-bold opacity-60 block mb-2">Scopes</label>
                <div className="flex gap-3 flex-wrap">
                  {ALL_SCOPES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleScope(s.id)}
                      className={`px-4 py-2 text-xs uppercase tracking-widest font-bold border transition-colors ${
                        newScopes.includes(s.id)
                          ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]'
                          : 'bg-white text-[#141414] border-[#141414]/30 hover:border-[#141414]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest font-bold opacity-60 block mb-2">
                  Rate Limit — {newLimit} req/min
                </label>
                <input
                  type="range" min={10} max={600} step={10}
                  value={newLimit}
                  onChange={e => setNewLimit(parseInt(e.target.value, 10))}
                  className="w-full accent-[#141414]"
                />
              </div>
              <button
                onClick={createKey}
                disabled={creating}
                className="bg-[#141414] text-[#E4E3E0] px-6 py-3 text-xs uppercase tracking-widest font-bold hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                {creating ? 'Generating…' : 'Generate Key'}
              </button>
            </div>
          )}

          <div className="bg-white border border-[#141414] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] text-xs uppercase tracking-widest">
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Key</th>
                  <th className="p-4 font-bold">Scopes</th>
                  <th className="p-4 font-bold">Limit</th>
                  <th className="p-4 font-bold">Requests</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10">
                {keys.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center opacity-60 font-serif italic">No API keys yet.</td></tr>
                ) : keys.map(k => (
                  <tr key={k.id} className={`hover:bg-[#141414]/5 transition-colors ${k.is_active === 0 ? 'opacity-50' : ''}`}>
                    <td className="p-4 font-bold">{k.name}</td>
                    <td className="p-4"><code className="text-xs font-mono">{k.key_prefix}…</code></td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {k.scopes.split(',').map(s => (
                          <span key={s} className="bg-[#141414]/5 text-[#141414] text-[10px] uppercase tracking-widest px-2 py-1 font-bold">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm opacity-80">{k.rate_limit}/min</td>
                    <td className="p-4 text-sm opacity-80">{k.request_count}</td>
                    <td className="p-4">
                      {k.is_active === 1
                        ? <span className="bg-green-100 text-green-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Active</span>
                        : <span className="bg-red-100 text-red-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Revoked</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleKey(k.id)}
                          className={`p-2 rounded transition-colors ${k.is_active === 1 ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={k.is_active === 1 ? 'Deactivate' : 'Reactivate'}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => revokeKey(k.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                          title="Revoke permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-serif italic flex items-center gap-2">
              <ScrollText size={24} /> Request Log
            </h3>
            <button
              onClick={loadLogs}
              className="text-xs uppercase tracking-widest font-bold opacity-60 hover:opacity-100"
            >
              Refresh
            </button>
          </div>
          <div className="bg-white border border-[#141414] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] text-xs uppercase tracking-widest">
                  <th className="p-4 font-bold">Time</th>
                  <th className="p-4 font-bold">Key</th>
                  <th className="p-4 font-bold">Method</th>
                  <th className="p-4 font-bold">Path</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10">
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center opacity-60 font-serif italic">No requests logged yet.</td></tr>
                ) : logs.map(l => (
                  <tr key={l.id} className="hover:bg-[#141414]/5 transition-colors">
                    <td className="p-4 text-sm opacity-60 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-4 text-sm">{l.key_name || <span className="opacity-40">—</span>}</td>
                    <td className="p-4 text-xs font-mono font-bold">{l.method}</td>
                    <td className="p-4"><code className="text-xs font-mono">{l.path}</code></td>
                    <td className="p-4">
                      <span className={`text-[10px] tracking-widest px-2 py-1 font-bold ${statusColor(l.status)}`}>{l.status}</span>
                    </td>
                    <td className="p-4 text-sm opacity-80">{l.response_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Docs */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#141414] p-6 space-y-4">
            <h3 className="text-2xl font-serif italic">Using the gateway</h3>
            <p className="text-sm opacity-70 leading-relaxed">
              Send your key in the <code className="font-mono bg-[#141414]/5 px-1">X-API-Key</code> header.
              Every endpoint is read-only and returns JSON. Responses include
              <code className="font-mono bg-[#141414]/5 px-1 mx-1">X-RateLimit-Remaining</code>
              so you can back off before hitting your limit.
            </p>
          </div>

          <div className="bg-[#141414] text-[#E4E3E0] p-6 overflow-x-auto">
            <h4 className="text-xs uppercase tracking-widest font-bold opacity-60 mb-3">Example — list jobs</h4>
            <pre className="text-sm font-mono whitespace-pre-wrap break-all">{`curl http://localhost:3000/gateway/v1/jobs \\
  -H "X-API-Key: yk_live_your_key_here"`}</pre>
          </div>

          <div className="bg-white border border-[#141414] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] text-xs uppercase tracking-widest">
                  <th className="p-4 font-bold">Endpoint</th>
                  <th className="p-4 font-bold">Scope</th>
                  <th className="p-4 font-bold">Returns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10">
                <tr><td className="p-4"><code className="text-xs font-mono">GET /gateway/v1/ping</code></td><td className="p-4 text-sm opacity-70">any valid key</td><td className="p-4 text-sm opacity-70">Key name + scopes</td></tr>
                <tr><td className="p-4"><code className="text-xs font-mono">GET /gateway/v1/jobs</code></td><td className="p-4 text-sm opacity-70">jobs:read</td><td className="p-4 text-sm opacity-70">Job listings</td></tr>
                <tr><td className="p-4"><code className="text-xs font-mono">GET /gateway/v1/housing</code></td><td className="p-4 text-sm opacity-70">housing:read</td><td className="p-4 text-sm opacity-70">Housing options</td></tr>
                <tr><td className="p-4"><code className="text-xs font-mono">GET /gateway/v1/stats</code></td><td className="p-4 text-sm opacity-70">stats:read</td><td className="p-4 text-sm opacity-70">Platform counts</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
