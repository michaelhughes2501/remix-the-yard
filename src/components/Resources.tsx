import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  ArrowRight, 
  HeartPulse, 
  UserCheck, 
  Droplets, 
  Sparkles,
  TestTube,
  Shield,
  Activity,
  Badge,
  Plus,
  X,
  Filter,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UA_CHECK_INS, PAROLE_RESOURCES, MENTAL_HEALTH_RESOURCES } from '../constants';
import { geminiService } from '../services/geminiService';
import Markdown from 'react-markdown';
import { useAuth } from '../AuthContext';
import { ParoleOfficer } from '../types';
import ConfirmationDialog from './ConfirmationDialog';

const ResourceCard = ({ item, icon: Icon, type }: { item: any, icon: any, type: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group flex flex-col justify-between bg-white border border-[#141414] p-6 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors duration-300"
  >
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-[#E4E3E0] text-[#141414] rounded-sm group-hover:bg-white/10 group-hover:text-white transition-colors">
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 group-hover:opacity-60">
          {type}
        </span>
      </div>
      <h4 className="text-xl font-bold mb-3">{item.title}</h4>
      <p className="text-sm opacity-60 leading-relaxed mb-8">{item.description}</p>
    </div>
    {item.phone ? (
      <a href={`tel:${item.phone}`} className="inline-flex items-center justify-between w-full pt-4 border-t border-[#141414]/10 group-hover:border-white/10 font-mono text-sm hover:text-blue-600 group-hover:hover:text-blue-400 transition-colors">
        <span>{item.phone}</span>
        <PhoneCall size={16} />
      </a>
    ) : (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between w-full pt-4 border-t border-[#141414]/10 group-hover:border-white/10 font-mono text-sm uppercase tracking-widest hover:text-blue-600 group-hover:hover:text-blue-400 transition-colors">
        <span>Visit Website</span>
        <ArrowRight size={16} />
      </a>
    )}
  </motion.div>
);

export default function Resources() {
  const { token } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selfHelpTopic, setSelfHelpTopic] = useState('');
  const [selfHelpContent, setSelfHelpContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [officers, setOfficers] = useState<ParoleOfficer[]>([]);
  const [showAddPO, setShowAddPO] = useState(false);
  const [poName, setPoName] = useState('');
  const [poAgency, setPoAgency] = useState('');
  const [poPhone, setPoPhone] = useState('');
  const [poDistrict, setPoDistrict] = useState('');

  // States for confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState<ParoleOfficer | null>(null);

  const handleDeleteOfficer = (officer: ParoleOfficer) => {
    setOfficerToDelete(officer);
    setDeleteConfirmOpen(true);
  };

  const executeDeleteOfficer = async () => {
    if (!officerToDelete) return;
    try {
      const res = await fetch(`/api/parole-officers/${officerToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setOfficers(officers.filter(o => o.id !== officerToDelete.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmOpen(false);
      setOfficerToDelete(null);
    }
  };

  useEffect(() => {
    fetch('/api/parole-officers', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setOfficers(data))
    .catch(console.error);
  }, [token]);

  const handleAddPO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/parole-officers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: poName, agency: poAgency, phone: poPhone, district: poDistrict })
      });
      const data = await res.json();
      if (data.success) {
        setOfficers([...officers, data.officer]);
        setShowAddPO(false);
        setPoName('');
        setPoAgency('');
        setPoPhone('');
        setPoDistrict('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetSelfHelp = async () => {
    if (!selfHelpTopic) return;
    setIsLoading(true);
    try {
      const content = await geminiService.getSelfHelpMaterial(selfHelpTopic);
      setSelfHelpContent(content || '');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-20">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter">Resources</h2>
        <p className="text-xl opacity-60 max-w-2xl">
          Support for your journey. Find immediate help, manage your supervision requirements, and access personalized guidance.
        </p>
      </header>

      <div className="flex justify-end">
        <div className="relative w-full md:w-72">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none bg-white border border-[#141414] py-4 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 cursor-pointer font-bold text-xs uppercase tracking-widest transition-all"
          >
            <option value="all">All Resources</option>
            <option value="ua">UA Check-Ins</option>
            <option value="parole">Parole & Supervision</option>
            <option value="mental_health">Mental Health</option>
            <option value="ai">AI Self-Help</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" size={18} />
        </div>
      </div>

      <div className="space-y-16">
        {/* UA Check-Ins Section */}
        {(selectedCategory === 'all' || selectedCategory === 'ua') && (
        <section>
          <div className="flex items-center gap-3 mb-8 border-b border-[#141414]/10 pb-4">
            <Droplets className="text-blue-600" size={28} />
            <h3 className="text-3xl font-serif italic">UA Check-In Lines</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {UA_CHECK_INS.map(ua => (
              <ResourceCard key={ua.id} item={ua} icon={TestTube} type="Testing" />
            ))}
          </div>
        </section>
        )}

        {/* Parole Section */}
        {(selectedCategory === 'all' || selectedCategory === 'parole') && (
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-[#141414]/10 pb-4">
            <div className="flex items-center gap-3">
              <UserCheck className="text-green-600" size={28} />
              <h3 className="text-3xl font-serif italic">Parole & Supervision</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAROLE_RESOURCES.map(parole => (
              <ResourceCard key={parole.id} item={parole} icon={Shield} type="Supervision" />
            ))}
          </div>
        </section>
        )}

        {/* My Parole Officers Section */}
        {(selectedCategory === 'all' || selectedCategory === 'parole') && (
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-[#141414]/10 pb-4">
            <div className="flex items-center gap-3">
              <Badge className="text-[#141414]" size={28} />
              <h3 className="text-3xl font-serif italic">My Parole Officers</h3>
            </div>
            <button 
              onClick={() => setShowAddPO(true)}
              className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:underline"
            >
              <Plus size={16} /> Add Officer
            </button>
          </div>

          <AnimatePresence>
            {showAddPO && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddPO}
                className="bg-white border border-[#141414] p-6 mb-8 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold uppercase tracking-widest text-xs">Add New Contact</h4>
                  <button type="button" onClick={() => setShowAddPO(false)} className="opacity-40 hover:opacity-100"><X size={20} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-1">Name</label>
                    <input required type="text" value={poName} onChange={e => setPoName(e.target.value)} className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10" placeholder="Officer Name" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-1">Agency</label>
                    <input required type="text" value={poAgency} onChange={e => setPoAgency(e.target.value)} className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10" placeholder="e.g. State Dept of Corrections" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-1">Phone Number</label>
                    <input required type="text" value={poPhone} onChange={e => setPoPhone(e.target.value)} className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10" placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-1">District / Office</label>
                    <input required type="text" value={poDistrict} onChange={e => setPoDistrict(e.target.value)} className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10" placeholder="e.g. District 4" />
                  </div>
                </div>
                <button type="submit" className="bg-[#141414] text-[#E4E3E0] px-6 py-3 uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity">
                  Save Officer
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {officers.length === 0 && !showAddPO && (
            <div className="p-8 text-center opacity-60 border border-dashed border-[#141414]">
              No parole officers added yet. Keep your contacts organized here.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officers.map(officer => (
              <motion.div 
                key={officer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#141414] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[#141414] text-[#E4E3E0] rounded-sm">
                      <Badge size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteOfficer(officer)}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-all cursor-pointer"
                        title="Delete Officer"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">
                        Officer
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold mb-1">{officer.name}</h4>
                  <p className="text-sm font-bold opacity-80 mb-1">{officer.agency}</p>
                  <p className="text-sm opacity-60 mb-6">{officer.district}</p>
                </div>
                <a href={`tel:${officer.phone}`} className="inline-flex items-center justify-between w-full pt-4 border-t border-[#141414]/10 font-mono text-sm hover:text-blue-600 transition-colors">
                  <span>{officer.phone}</span>
                  <PhoneCall size={16} />
                </a>
              </motion.div>
            ))}
          </div>
        </section>
        )}

        {/* Mental Health Section */}
        {(selectedCategory === 'all' || selectedCategory === 'mental_health') && (
        <section>
          <div className="flex items-center gap-3 mb-8 border-b border-[#141414]/10 pb-4">
            <HeartPulse className="text-red-600" size={28} />
            <h3 className="text-3xl font-serif italic">Mental Health Support</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MENTAL_HEALTH_RESOURCES.map(mh => (
              <ResourceCard key={mh.id} item={mh} icon={Activity} type="Crisis / Support" />
            ))}
          </div>
        </section>
        )}
      </div>

      {/* AI Self-Help Section */}
      {(selectedCategory === 'all' || selectedCategory === 'ai') && (
      <section className="bg-[#141414] text-[#E4E3E0] p-8 md:p-12 relative overflow-hidden rounded-sm shadow-2xl">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-5 pointer-events-none">
          <Sparkles size={400} />
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-yellow-400" size={32} />
            <h3 className="text-4xl font-serif italic">AI Self-Help Guide</h3>
          </div>
          <p className="text-lg opacity-60 mb-10 leading-relaxed max-w-2xl">
            Enter a topic (e.g., "managing anger", "finding a job with a record", "reconnecting with family") to get a personalized, actionable guide generated in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <input 
              type="text" 
              value={selfHelpTopic}
              onChange={(e) => setSelfHelpTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGetSelfHelp()}
              placeholder="What do you need help with today?"
              className="flex-1 bg-white/5 border border-white/20 px-6 py-4 text-lg focus:outline-none focus:border-yellow-400 focus:bg-white/10 transition-all placeholder:text-white/20"
            />
            <button 
              onClick={handleGetSelfHelp}
              disabled={isLoading || !selfHelpTopic}
              className="bg-yellow-400 text-[#141414] px-8 py-4 uppercase tracking-widest text-sm font-bold hover:bg-yellow-300 disabled:opacity-50 disabled:hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Generating...' : <>Generate <ArrowRight size={18} /></>}
            </button>
          </div>
          
          {selfHelpContent && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert prose-lg max-w-none bg-white/5 border border-white/10 p-8 rounded-sm"
            >
              <Markdown>{selfHelpContent}</Markdown>
            </motion.div>
          )}
        </div>
      </section>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        title="Delete Parole Officer"
        message={`Are you sure you want to remove ${officerToDelete?.name} from your parole officers contact list?`}
        onConfirm={executeDeleteOfficer}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setOfficerToDelete(null);
        }}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
