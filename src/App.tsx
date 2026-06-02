import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Send, 
  ShieldCheck, 
  Scale, 
  LogOut,
  Menu,
  X,
  MessageSquare,
  Bell,
  Archive,
  UserCircle,
  Briefcase,
  Search,
  ShieldAlert,
  HelpCircle,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthProvider, useAuth } from './AuthContext';
import Auth from './components/Auth';
import { AppNotification } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import TheYard from './components/TheYard';
import Kites from './components/Kites';
import Resources from './components/Resources';
import Tools from './components/Tools';
import Forum from './components/Forum';
import MentorshipTab from './components/Mentorship';
import Vault from './components/Vault';
import Profile from './components/Profile';
import Opportunities from './components/Opportunities';
import SOSButton from './components/SOSButton';
import GlobalSearch from './components/GlobalSearch';
import AdminDashboard from './components/AdminDashboard';
import HelpCenter from './components/HelpCenter';
import CaseTracker from './components/CaseTracker';
import WorkspaceHub from './components/WorkspaceHub';

type Tab = 'yard' | 'kites' | 'resources' | 'tools' | 'forum' | 'mentorship' | 'vault' | 'profile' | 'opportunities' | 'admin' | 'help' | 'cases' | 'workspace';

function MainApp() {
  const { user, token, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('yard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (!user || !token) return;
    const fetchNotifications = () => {
      fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          console.error('Expected array of notifications, got:', data);
        }
      })
      .catch(console.error);
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user, token]);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
    }
    setActiveTab(notif.link as Tab);
    setShowNotifications(false);
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-serif italic text-2xl">Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  const tabs = [
    { id: 'yard', name: 'The Yard', icon: Users },
    { id: 'opportunities', name: 'Opportunities', icon: Briefcase },
    { id: 'forum', name: 'Forum', icon: MessageSquare },
    { id: 'kites', name: 'Kites', icon: Send },
    { id: 'mentorship', name: 'Mentorship', icon: ShieldCheck },
    { id: 'vault', name: 'The Vault', icon: Archive },
    { id: 'resources', name: 'Resources', icon: ShieldCheck },
    { id: 'tools', name: 'Legal Tools', icon: Scale },
    { id: 'cases', name: 'Case Tracker', icon: Scale },
    { id: 'workspace', name: 'Workspace', icon: Globe },
    { id: 'help', name: 'Help Center', icon: HelpCircle },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'yard': return <TheYard />;
      case 'opportunities': return <Opportunities />;
      case 'forum': return <Forum />;
      case 'kites': return <Kites onNavigate={(tab: Tab) => setActiveTab(tab)} />;
      case 'mentorship': return <MentorshipTab />;
      case 'vault': return <Vault />;
      case 'resources': return <Resources />;
      case 'tools': return <Tools />;
      case 'cases': return <CaseTracker />;
      case 'workspace': return <WorkspaceHub />;
      case 'help': return <HelpCenter />;
      case 'profile': return <Profile />;
      case 'admin': return <AdminDashboard />;
      default: return <TheYard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#E4E3E0] border-b border-[#141414] px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#141414] text-[#E4E3E0] p-2 rounded-sm">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">The Yard</h1>
        </div>

        {/* Desktop Nav */}
          <div className="hidden md:flex gap-6 items-center flex-wrap justify-center">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors opacity-60 hover:opacity-100"
              title="Search"
            >
              <Search size={20} />
            </button>

            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "text-xs font-medium uppercase tracking-widest transition-all hover:opacity-100",
                  activeTab === tab.id ? "opacity-100 border-b-2 border-[#141414]" : "opacity-40"
                )}
              >
                {tab.name}
              </button>
            ))}
            
            <div className="relative ml-2">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
            >
              <Bell size={20} />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-[#141414] shadow-xl z-50"
                >
                  <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
                    <h3 className="font-serif italic">Notifications</h3>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button onClick={markAllAsRead} className="text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-[#141414]/10">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm opacity-60">No notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn(
                            "w-full text-left p-4 hover:bg-[#141414]/5 transition-colors text-sm flex gap-3",
                            !notif.is_read ? "bg-[#141414]/5" : "opacity-60"
                          )}
                        >
                          {!notif.is_read && <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />}
                          <div>
                            <p>{notif.content}</p>
                            <span className="text-[10px] uppercase tracking-widest opacity-60 mt-1 block">
                              {new Date(notif.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

            <button 
              onClick={() => setActiveTab('profile')}
              className={cn(
                "ml-2 flex items-center gap-2 text-xs uppercase tracking-widest transition-opacity hover:opacity-100",
                activeTab === 'profile' ? "opacity-100 font-bold" : "opacity-40"
              )}
            >
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user?.username} 
                  className="w-5 h-5 rounded-full object-cover border border-[#141414]/20"
                />
              ) : (
                <UserCircle size={16} />
              )}
              Profile
            </button>

            {['super_admin', 'admin', 'moderator'].includes(user?.role || (user?.is_admin === 1 ? 'super_admin' : 'user')) && (
              <button 
                onClick={() => setActiveTab('admin')}
                className="ml-2 flex items-center gap-2 text-xs uppercase tracking-widest text-red-600 opacity-60 hover:opacity-100 transition-opacity"
              >
                <ShieldAlert size={16} /> Admin
              </button>
            )}

            <button 
              onClick={logout}
              className="ml-2 flex items-center gap-2 text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-[#E4E3E0] pt-24 px-8"
          >
            <div className="flex flex-col gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as Tab);
                    setIsMenuOpen(false);
                  }}
                  className="text-3xl font-serif italic text-left border-b border-[#141414]/10 pb-4"
                >
                  {tab.name}
                </button>
              ))}
              <button 
                onClick={() => { setActiveTab('help'); setIsMenuOpen(false); }}
                className="text-3xl font-serif italic text-left border-b border-[#141414]/10 pb-4"
              >
                Help Center
              </button>
              <button 
                onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }}
                className="text-3xl font-serif italic text-left border-b border-[#141414]/10 pb-4 flex items-center gap-3"
              >
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user?.username} 
                    className="w-10 h-10 rounded-full object-cover border border-[#141414]/20 animate-fade-in"
                  />
                ) : (
                  <UserCircle size={28} className="opacity-40" />
                )}
                Profile
              </button>
              {['super_admin', 'admin', 'moderator'].includes(user?.role || (user?.is_admin === 1 ? 'super_admin' : 'user')) && (
                <button 
                  onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }}
                  className="text-3xl font-serif italic text-left border-b border-[#141414]/10 pb-4 text-red-600"
                >
                  Admin Dashboard
                </button>
              )}
              <button 
                onClick={() => { logout(); setIsMenuOpen(false); }}
                className="text-xl font-serif italic text-left text-red-600 pt-4"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {renderContent()}
        </motion.div>
      </main>

      <SOSButton />

      {isSearchOpen && (
        <GlobalSearch 
          onClose={() => setIsSearchOpen(false)} 
          onNavigate={(tab) => setActiveTab(tab as Tab)} 
        />
      )}

      {/* Footer */}
      <footer className="border-t border-[#141414] mt-20 py-12 px-4 md:px-8 bg-[#141414] text-[#E4E3E0]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-serif italic text-xl mb-4">Second Chance Network</h3>
            <p className="text-sm opacity-60 leading-relaxed">
              A platform built by and for the formerly incarcerated. We believe in redemption, 
              community, and the power of a second chance.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest opacity-40 mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="#" className="hover:underline">Mental Health Support</a></li>
              <li><a href="#" className="hover:underline">Parole Resources</a></li>
              <li><a href="#" className="hover:underline">Legal Aid</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest opacity-40 mb-4">Emergency</h4>
            <p className="text-sm">If you are in crisis, please call 988 or visit the nearest emergency room.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-[10px] uppercase tracking-widest opacity-40 flex justify-between">
          <span>© 2026 The Yard</span>
          <span>Built for Redemption</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
