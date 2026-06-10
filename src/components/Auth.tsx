import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';

const MANIFESTO = [
  'COMMUNITY', 'SECOND CHANCES', 'REDEMPTION', 'LEGAL TOOLS',
  'MENTORSHIP', 'OPPORTUNITIES', 'BROTHERHOOD', 'A FRESH START',
];

type AuthView = 'login' | 'register' | 'forgot' | 'reset';

export default function Auth() {
  const [view, setView] = useState<AuthView>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [facility, setFacility] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    try {
      if (view === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');
        login(data.token, data.user);
      } 
      else if (view === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, facility, location, bio })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        login(data.token, data.user);
      }
      else if (view === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process request');
        setSuccessMsg(data.message + (data._devToken ? ` (Dev Token: ${data._devToken})` : ''));
        // Optionally switch to reset view immediately for dev convenience
        if (data._devToken) {
          setResetToken(data._devToken);
          setView('reset');
        }
      }
      else if (view === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');
        setSuccessMsg('Password reset successfully. You can now log in.');
        setView('login');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-[#141414] font-sans flex">
      {/* Left editorial panel (desktop only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden bg-[#141414] text-[#E4E3E0]">
        <div className="absolute inset-0 yard-grid opacity-70" />
        {/* vertical scrolling manifesto */}
        <div className="absolute right-6 top-0 bottom-0 w-px bg-[#E4E3E0]/10" />
        <div className="absolute right-10 top-0 bottom-0 overflow-hidden pointer-events-none select-none">
          <div className="yard-marquee flex flex-col gap-10 text-right">
            {[...MANIFESTO, ...MANIFESTO].map((w, i) => (
              <span key={i} className="font-serif italic text-5xl lg:text-6xl leading-none opacity-[0.07] whitespace-nowrap">{w}</span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}
            className="flex items-center gap-3"
          >
            <div className="bg-[#E4E3E0] text-[#141414] p-2.5 rounded-sm">
              <ShieldCheck size={26} />
            </div>
            <span className="font-serif italic text-2xl uppercase tracking-tighter">The Yard</span>
          </motion.div>

          <div className="max-w-xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .1 }}
              className="font-serif italic text-5xl lg:text-7xl leading-[0.95] tracking-tight"
            >
              Your record<br />ends here.<br />
              <span className="text-[#E4E3E0]/55">Your story</span><br />starts now.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .7, delay: .35 }}
              className="mt-8 text-sm leading-relaxed opacity-60 max-w-md uppercase tracking-widest"
            >
              A platform built by and for the formerly incarcerated — community, work, legal tools, and the people who get it.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .7, delay: .5 }}
            className="grid grid-cols-3 gap-8 border-t border-[#E4E3E0]/15 pt-8"
          >
            {[['12K+', 'Members'], ['3.4K', 'Jobs Shared'], ['98%', 'Stay Connected']].map(([n, l]) => (
              <div key={l}>
                <div className="font-serif text-3xl lg:text-4xl">{n}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-[#E4E3E0] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md bg-white border border-[#141414] p-8 shadow-2xl yard-rise">
        <div className="flex flex-col items-center mb-8 md:hidden">
          <div className="bg-[#141414] text-[#E4E3E0] p-4 rounded-sm mb-4">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-4xl font-serif italic uppercase tracking-tighter">The Yard</h1>
          <p className="text-sm opacity-60 mt-2 uppercase tracking-widest">Built for Redemption</p>
        </div>
        <div className="hidden md:block mb-8">
          <h2 className="text-3xl font-serif italic tracking-tight">
            {view === 'login' && 'Welcome back'}
            {view === 'register' && 'Join The Yard'}
            {view === 'forgot' && 'Reset access'}
            {view === 'reset' && 'Set a new password'}
          </h2>
          <p className="text-xs uppercase tracking-widest opacity-50 mt-2">
            {view === 'login' ? 'Sign in to your account' : view === 'register' ? 'Create your free account' : 'We’ll get you back in'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm break-all">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(view === 'login' || view === 'register') && (
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-1">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              />
            </div>
          )}

          {(view === 'register' || view === 'forgot') && (
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              />
            </div>
          )}

          {view === 'reset' && (
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-1">Reset Token</label>
              <input 
                type="text" 
                required
                value={resetToken}
                onChange={e => setResetToken(e.target.value)}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              />
            </div>
          )}

          {(view === 'login' || view === 'register' || view === 'reset') && (
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-1">
                {view === 'reset' ? 'New Password' : 'Password'}
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              />
            </div>
          )}

          {view === 'register' && (
            <>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-1">Facility / History</label>
                <input 
                  type="text" 
                  placeholder="e.g. San Quentin (2015-2022)"
                  value={facility}
                  onChange={e => setFacility(e.target.value)}
                  className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-1">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Denver, CO"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-1">Bio</label>
                <textarea 
                  placeholder="Tell your story..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 h-24"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="yard-sheen w-full bg-[#141414] text-[#E4E3E0] p-4 uppercase tracking-widest font-bold hover:opacity-90 transition-opacity mt-6"
          >
            {view === 'login' && 'Enter The Yard'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot' && 'Send Reset Link'}
            {view === 'reset' && 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          {view === 'login' && (
            <>
              <button 
                onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); }}
                className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:underline"
              >
                Forgot Password?
              </button>
              <button 
                onClick={() => { setView('register'); setError(''); setSuccessMsg(''); }}
                className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:underline"
              >
                Need an account? Sign up
              </button>
            </>
          )}
          
          {view === 'register' && (
            <button 
              onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
              className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:underline"
            >
              Already have an account? Log in
            </button>
          )}

          {(view === 'forgot' || view === 'reset') && (
            <button 
              onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
              className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:underline flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Back to Login
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
