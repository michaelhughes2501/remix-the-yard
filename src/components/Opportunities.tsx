import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Job, Housing } from '../types';
import { Briefcase, Home, MapPin, Building, ShieldCheck, Plus, Search, ClipboardList, Trash2, Edit2, Save, X } from 'lucide-react';

interface JobApplication {
  id: string;
  company: string;
  position: string;
  date_applied: string;
  status: string;
  notes: string;
}

export default function Opportunities() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'housing' | 'tracker'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [housing, setHousing] = useState<Housing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Tracker state
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appForm, setAppForm] = useState({ company: '', position: '', date_applied: '', status: 'applied', notes: '' });

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(setJobs);
    } else if (activeTab === 'housing') {
      fetch('/api/housing', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(setHousing);
    } else if (activeTab === 'tracker') {
      fetch('/api/job-applications', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(setApplications);
    }
  }, [activeTab, token]);

  const handleSaveApp = async () => {
    try {
      const method = editingAppId ? 'PUT' : 'POST';
      const url = editingAppId ? `/api/job-applications/${editingAppId}` : '/api/job-applications';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(appForm)
      });
      
      if (res.ok) {
        setIsAddingApp(false);
        setEditingAppId(null);
        setAppForm({ company: '', position: '', date_applied: '', status: 'applied', notes: '' });
        // Refresh apps
        fetch('/api/job-applications', { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(setApplications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      const res = await fetch(`/api/job-applications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(apps => apps.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditApp = (app: JobApplication) => {
    setAppForm({
      company: app.company,
      position: app.position,
      date_applied: app.date_applied,
      status: app.status,
      notes: app.notes || ''
    });
    setEditingAppId(app.id);
    setIsAddingApp(true);
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHousing = housing.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.type.toLowerCase().replace('_', ' ').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter">Opportunities</h2>
        <p className="text-xl opacity-60 max-w-2xl">
          Find second-chance employers and felony-friendly housing options in your area.
        </p>
      </header>

      <div className="flex border-b border-[#141414]">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors flex justify-center items-center gap-2 ${
            activeTab === 'jobs' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
          }`}
        >
          <Briefcase size={16} /> Job Board
        </button>
        <button
          onClick={() => setActiveTab('housing')}
          className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors flex justify-center items-center gap-2 ${
            activeTab === 'housing' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
          }`}
        >
          <Home size={16} /> Housing Directory
        </button>
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors flex justify-center items-center gap-2 ${
            activeTab === 'tracker' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'
          }`}
        >
          <ClipboardList size={16} /> Application Tracker
        </button>
      </div>

      {activeTab !== 'tracker' && (
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={16} />
            <input 
              type="text"
              placeholder={`Search ${activeTab === 'jobs' ? 'jobs, companies' : 'housing, types, locations'}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-[#141414] p-4 pl-12 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 bg-white"
            />
          </div>
          <button className="bg-[#141414] text-[#E4E3E0] p-4 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} /> Post Listing
          </button>
        </div>
      )}

      {activeTab === 'jobs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-[#141414]/20 opacity-60">
              No jobs found matching your search.
            </div>
          ) : (
            filteredJobs.map(job => (
              <div key={job.id} className="bg-white border border-[#141414] p-6 hover:shadow-lg transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm opacity-80">
                      <Building size={14} /> {job.company}
                    </div>
                  </div>
                  {job.is_felony_friendly === 1 && (
                    <span className="bg-green-100 text-green-800 text-[10px] uppercase tracking-widest px-2 py-1 font-bold flex items-center gap-1">
                      <ShieldCheck size={12} /> Second Chance
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm opacity-60 mb-4">
                  <MapPin size={14} /> {job.location}
                </div>
                <p className="text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                  {job.description}
                </p>
                <button className="w-full border border-[#141414] py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors mt-auto">
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'housing' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHousing.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-[#141414]/20 opacity-60">
              No housing options found matching your search.
            </div>
          ) : (
            filteredHousing.map(house => (
              <div key={house.id} className="bg-white border border-[#141414] p-6 hover:shadow-lg transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{house.name}</h3>
                    <span className="inline-block bg-[#141414] text-[#E4E3E0] text-[10px] uppercase tracking-widest px-2 py-1 font-bold mt-1">
                      {house.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm opacity-60 mb-4">
                  <MapPin size={14} /> {house.location}
                </div>
                <p className="text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                  {house.description}
                </p>
                <div className="pt-4 border-t border-[#141414]/10 mt-auto">
                  <p className="text-xs font-mono opacity-80">Contact: {house.contact_info}</p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'tracker' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-serif italic">My Applications</h3>
            {!isAddingApp && (
              <button 
                onClick={() => {
                  setAppForm({ company: '', position: '', date_applied: new Date().toISOString().split('T')[0], status: 'applied', notes: '' });
                  setEditingAppId(null);
                  setIsAddingApp(true);
                }}
                className="bg-[#141414] text-[#E4E3E0] px-6 py-3 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus size={16} /> Log Application
              </button>
            )}
          </div>

          {isAddingApp && (
            <div className="bg-white border border-[#141414] p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold uppercase tracking-widest text-sm">{editingAppId ? 'Edit Application' : 'New Application'}</h4>
                <button onClick={() => setIsAddingApp(false)} className="opacity-60 hover:opacity-100"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2">Company</label>
                  <input 
                    type="text" value={appForm.company} onChange={e => setAppForm({...appForm, company: e.target.value})}
                    className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2">Position</label>
                  <input 
                    type="text" value={appForm.position} onChange={e => setAppForm({...appForm, position: e.target.value})}
                    className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                    placeholder="Job Title"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2">Date Applied</label>
                  <input 
                    type="date" value={appForm.date_applied} onChange={e => setAppForm({...appForm, date_applied: e.target.value})}
                    className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2">Status</label>
                  <select 
                    value={appForm.status} onChange={e => setAppForm({...appForm, status: e.target.value})}
                    className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 bg-white"
                  >
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                    <option value="accepted">Accepted</option>
                  </select>
                </div>
                <div className="col-span-full">
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2">Notes</label>
                  <textarea 
                    value={appForm.notes} onChange={e => setAppForm({...appForm, notes: e.target.value})}
                    className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 min-h-[80px]"
                    placeholder="Follow-up dates, interviewer names, etc."
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSaveApp}
                  disabled={!appForm.company || !appForm.position}
                  className="bg-[#141414] text-[#E4E3E0] px-8 py-3 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} /> Save
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-[#141414] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] text-xs uppercase tracking-widest">
                  <th className="p-4 font-bold">Company</th>
                  <th className="p-4 font-bold">Position</th>
                  <th className="p-4 font-bold">Date Applied</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center opacity-60 italic font-serif">
                      No applications logged yet.
                    </td>
                  </tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} className="hover:bg-[#141414]/5 transition-colors">
                      <td className="p-4 font-bold">{app.company}</td>
                      <td className="p-4">{app.position}</td>
                      <td className="p-4 opacity-80">{new Date(app.date_applied).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`text-[10px] uppercase tracking-widest px-2 py-1 font-bold ${
                          app.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                          app.status === 'interviewing' ? 'bg-purple-100 text-purple-800' :
                          app.status === 'offered' ? 'bg-green-100 text-green-800' :
                          app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEditApp(app)} className="p-2 hover:bg-[#141414]/10 rounded transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
