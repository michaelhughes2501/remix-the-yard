import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { User, Mentorship } from '../types';
import { Users, CheckCircle, XCircle, Clock, ShieldCheck, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MentorshipTab() {
  const { user, token } = useAuth();
  const [mentors, setMentors] = useState<User[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [isMentor, setIsMentor] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = () => {
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then((users: User[]) => {
        const me = users.find(u => u.id === user?.id);
        if (me) setIsMentor(!!me.is_mentor);
      });

    fetch('/api/mentors', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setMentors);

    fetch('/api/mentorships', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setMentorships);
  };

  const toggleMentorStatus = async () => {
    await fetch('/api/users/mentor-status', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ is_mentor: !isMentor })
    });
    setIsMentor(!isMentor);
    fetchData();
  };

  const requestMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/mentorships/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          mentorId: selectedMentor.id,
          message: requestMessage
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setRequestModalOpen(false);
      setSelectedMentor(null);
      setRequestMessage('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRequestModal = (mentor: User) => {
    setSelectedMentor(mentor);
    setRequestMessage('');
    setRequestModalOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/mentorships/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const myMentees = mentorships.filter(m => m.mentor_id === user?.id && m.status === 'active');
  const myMentors = mentorships.filter(m => m.mentee_id === user?.id && m.status === 'active');
  const pendingIncoming = mentorships.filter(m => m.mentor_id === user?.id && m.status === 'pending');
  const pendingOutgoing = mentorships.filter(m => m.mentee_id === user?.id && m.status === 'pending');

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter">Mentorship</h2>
        <p className="text-xl opacity-60 max-w-2xl">
          Guide others through their journey or find someone who has walked the path before you.
        </p>
      </header>

      {/* Mentor Toggle */}
      <div className="bg-white border border-[#141414] p-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif italic mb-1">Offer Mentorship</h3>
          <p className="text-sm opacity-60">Make yourself available to guide new members of The Yard.</p>
        </div>
        <button
          onClick={toggleMentorStatus}
          className={`px-6 py-3 uppercase tracking-widest text-xs font-bold transition-colors ${
            isMentor 
              ? 'bg-[#141414] text-[#E4E3E0]' 
              : 'border border-[#141414] hover:bg-[#141414]/5'
          }`}
        >
          {isMentor ? 'Active Mentor' : 'Become a Mentor'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Active & Pending */}
        <div className="space-y-8">
          {/* Pending Requests (Incoming) */}
          {pendingIncoming.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                <Clock size={16} /> Pending Requests
              </h3>
              <div className="space-y-4">
                {pendingIncoming.map(m => (
                  <div key={m.id} className="bg-white border border-[#141414] p-4 flex justify-between items-center">
                    <div>
                      <span className="font-bold">{m.mentee_name}</span> wants you as a mentor.
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(m.id, 'active')} className="p-2 hover:bg-green-100 text-green-700 rounded-full">
                        <CheckCircle size={20} />
                      </button>
                      <button onClick={() => updateStatus(m.id, 'declined')} className="p-2 hover:bg-red-100 text-red-700 rounded-full">
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Mentorships */}
          <section>
            <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> Active Connections
            </h3>
            <div className="space-y-4">
              {myMentors.map(m => (
                <div key={m.id} className="bg-[#141414] text-[#E4E3E0] p-6">
                  <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Your Mentor</div>
                  <div className="text-2xl font-serif italic mb-4">{m.mentor_name}</div>
                  <div className="flex justify-between items-center">
                    <button className="text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-80">
                      <MessageSquare size={14} /> Send Kite
                    </button>
                    <button onClick={() => updateStatus(m.id, 'completed')} className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100">
                      Mark Completed
                    </button>
                  </div>
                </div>
              ))}
              {myMentees.map(m => (
                <div key={m.id} className="bg-white border border-[#141414] p-6">
                  <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Your Mentee</div>
                  <div className="text-2xl font-serif italic mb-4">{m.mentee_name}</div>
                  <div className="flex justify-between items-center">
                    <button className="text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-80">
                      <MessageSquare size={14} /> Send Kite
                    </button>
                    <button onClick={() => updateStatus(m.id, 'completed')} className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100">
                      Mark Completed
                    </button>
                  </div>
                </div>
              ))}
              {myMentors.length === 0 && myMentees.length === 0 && (
                <div className="p-6 border border-[#141414]/20 text-center opacity-60 text-sm">
                  No active mentorships.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Find a Mentor */}
        <section>
          <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
            <Users size={16} /> Find a Mentor
          </h3>
          <div className="space-y-4">
            {mentors.map(mentor => {
              const pending = pendingOutgoing.find(m => m.mentor_id === mentor.id);
              const active = myMentors.find(m => m.mentor_id === mentor.id);
              
              return (
                <div key={mentor.id} className="bg-white border border-[#141414] p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-serif italic">{mentor.name}</h4>
                      <p className="text-xs uppercase tracking-widest opacity-60 mt-1">{mentor.history}</p>
                    </div>
                    {active ? (
                      <span className="text-[10px] uppercase tracking-widest bg-[#141414] text-[#E4E3E0] px-2 py-1">Active</span>
                    ) : pending ? (
                      <span className="text-[10px] uppercase tracking-widest border border-[#141414] px-2 py-1 opacity-60">Pending</span>
                    ) : (
                      <button 
                        onClick={() => openRequestModal(mentor)}
                        className="text-[10px] uppercase tracking-widest bg-[#141414] text-[#E4E3E0] px-3 py-1.5 hover:opacity-90"
                      >
                        Request
                      </button>
                    )}
                  </div>
                  <p className="text-sm opacity-80 line-clamp-2">{mentor.bio}</p>
                </div>
              );
            })}
            {mentors.length === 0 && (
              <div className="p-6 border border-[#141414]/20 text-center opacity-60 text-sm">
                No mentors available right now. Check back later.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Mentorship Request Modal */}
      <AnimatePresence>
        {requestModalOpen && selectedMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md border border-[#141414] shadow-2xl overflow-hidden"
            >
              <div className="bg-[#141414] text-[#E4E3E0] p-4 flex justify-between items-center">
                <h3 className="font-serif italic text-xl">Request Mentorship</h3>
                <button 
                  onClick={() => setRequestModalOpen(false)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={requestMentorship} className="p-6 space-y-6">
                <div>
                  <p className="text-sm opacity-80 mb-4">
                    You are requesting mentorship from <strong className="font-bold">{selectedMentor.name}</strong>.
                  </p>
                  
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2">
                    Personal Message
                  </label>
                  <textarea
                    required
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Introduce yourself and explain why you'd like them to be your mentor..."
                    className="w-full border border-[#141414] p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#141414]/10 resize-y"
                  />
                  <p className="text-[10px] uppercase tracking-widest opacity-60 mt-2">
                    This will be sent as a Kite to the mentor.
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#141414] text-[#E4E3E0] p-3 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRequestModalOpen(false)}
                    className="flex-1 border border-[#141414] p-3 text-xs uppercase tracking-widest font-bold hover:bg-[#141414]/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
