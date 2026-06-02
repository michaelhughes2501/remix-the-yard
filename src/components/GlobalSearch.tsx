import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { Search, X, Users, Briefcase, Home, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalSearch({ onClose, onNavigate }: { onClose: () => void, onNavigate: (tab: string) => void }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ users: [], jobs: [], housing: [], posts: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], jobs: [], housing: [], posts: [] });
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.users)) {
          setResults(data);
        } else {
          console.error('Expected search results object, got:', data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, token]);

  const hasResults = results.users.length > 0 || results.jobs.length > 0 || results.housing.length > 0 || results.posts.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="bg-[#E4E3E0] w-full max-w-3xl border border-[#141414] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-4">
          <Search size={24} className="opacity-60" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search The Yard..."
            className="flex-1 bg-transparent border-none outline-none text-xl font-serif italic placeholder:opacity-40"
          />
          <button onClick={onClose} className="hover:opacity-70 transition-opacity p-2">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading && (
            <div className="text-center opacity-60 font-serif italic py-8">Searching...</div>
          )}

          {!isLoading && query && !hasResults && (
            <div className="text-center opacity-60 font-serif italic py-8">No results found for "{query}"</div>
          )}

          {!isLoading && hasResults && (
            <>
              {results.users.length > 0 && (
                <section>
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2 opacity-60 border-b border-[#141414]/10 pb-2">
                    <Users size={14} /> Members
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.users.map((u: any) => (
                      <button 
                        key={u.id}
                        onClick={() => { onNavigate('yard'); onClose(); }}
                        className="bg-white border border-[#141414] p-4 text-left hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group"
                      >
                        <h4 className="font-bold text-lg">{u.name}</h4>
                        {u.location && <p className="text-xs opacity-60 mt-1">{u.location}</p>}
                        {u.bio && <p className="text-sm mt-2 line-clamp-2 opacity-80 group-hover:opacity-100">{u.bio}</p>}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {results.jobs.length > 0 && (
                <section>
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2 opacity-60 border-b border-[#141414]/10 pb-2">
                    <Briefcase size={14} /> Jobs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.jobs.map((j: any) => (
                      <button 
                        key={j.id}
                        onClick={() => { onNavigate('opportunities'); onClose(); }}
                        className="bg-white border border-[#141414] p-4 text-left hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group"
                      >
                        <h4 className="font-bold text-lg">{j.title}</h4>
                        <p className="text-xs opacity-60 mt-1">{j.company} • {j.location}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {results.housing.length > 0 && (
                <section>
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2 opacity-60 border-b border-[#141414]/10 pb-2">
                    <Home size={14} /> Housing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.housing.map((h: any) => (
                      <button 
                        key={h.id}
                        onClick={() => { onNavigate('opportunities'); onClose(); }}
                        className="bg-white border border-[#141414] p-4 text-left hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group"
                      >
                        <h4 className="font-bold text-lg">{h.name}</h4>
                        <p className="text-xs opacity-60 mt-1">{h.type.replace('_', ' ')} • {h.location}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {results.posts.length > 0 && (
                <section>
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2 opacity-60 border-b border-[#141414]/10 pb-2">
                    <MessageSquare size={14} /> Forum Posts
                  </h3>
                  <div className="space-y-4">
                    {results.posts.map((p: any) => (
                      <button 
                        key={p.id}
                        onClick={() => { onNavigate('forum'); onClose(); }}
                        className="w-full bg-white border border-[#141414] p-4 text-left hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg">{p.title}</h4>
                          <span className="text-[10px] uppercase tracking-widest opacity-60 bg-[#141414]/10 group-hover:bg-white/20 px-2 py-1">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2 opacity-80 group-hover:opacity-100">{p.content}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
