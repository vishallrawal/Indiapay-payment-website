import React, { useState, useEffect } from 'react';
import { 
  Home,
  MessageCircle, 
  Users, 
  Gift, 
  QrCode, 
  Building2, 
  Wallet,
  LogOut, 
  User, 
  ArrowRight, 
  Lock, 
  Mail, 
  Key,
  ShieldCheck,
  Building,
  Activity,
  PhoneCall,
  Sliders
} from 'lucide-react';

import { API_BASE } from './config.js';
import FintechDashboard from './components/FintechDashboard.jsx';
import ConsolePanel from './components/ConsolePanel.jsx';
import TravelBookings from './components/TravelBookings.jsx';
import EntertainmentBookings from './components/EntertainmentBookings.jsx';
import UtilityRecharges from './components/UtilityRecharges.jsx';
import ChatPayments from './components/ChatPayments.jsx';
import RewardsCenter from './components/RewardsCenter.jsx';
import GroupSplitter from './components/GroupSplitter.jsx';
import BankManager from './components/BankManager.jsx';

function App() {
  const [token, setToken] = useState(localStorage.getItem('aurapay_token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // home, orchestrator, travel, entertainment, recharges, chat, rewards, banks
  const [authView, setAuthView] = useState('login'); // login, register
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('indiapay_theme') || 'light');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('indiapay_theme', theme);
  }, [theme]);

  // Form states
  const [authEmail, setAuthEmail] = useState('recruiter@juspay.com');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authName, setAuthName] = useState('');

  // 1. Silent login for Recruiter if no token present (Direct landing bypass!)
  const runSilentLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'recruiter@juspay.com', password: 'password123' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('aurapay_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        // If seed user login fails, show manual login
        setProfileLoading(false);
      }
    } catch (err) {
      console.error('Silent login connection error:', err);
      setProfileLoading(false);
    }
  };

  // 2. Fetch User Profile
  const fetchProfile = async (sessionToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        // Token expired, clear & try silent login
        localStorage.removeItem('aurapay_token');
        setToken('');
        runSilentLogin();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      runSilentLogin();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('aurapay_token');
    setToken('');
    setUser(null);
    setActiveTab('home');
    setAuthEmail('recruiter@juspay.com');
    setAuthPassword('password123');
  };

  // 3. User Register / Login (Manual fallback option)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authView === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authView === 'login' 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('aurapay_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Connection error: backend server not responding.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gpay-main-bg">
        <div className="text-center space-y-3">
          <Activity className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <span className="text-xs text-slate-500 font-mono">Initializing GPay Orchestration Core...</span>
        </div>
      </div>
    );
  }

  // Fallback Manual Login screen if silent profile bypass fails
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen gpay-main-bg px-4">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-slate-800/80">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
          
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg">
              I
            </div>
            <h2 className="font-heading font-bold text-2xl text-slate-100 tracking-tight">IndiaPay Customizer</h2>
            <p className="text-xs text-slate-400">IndiaPay Clone & Customizer Portal</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                ⚠️ {authError}
              </div>
            )}

            {authView === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rahul Sharma"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Email Address</label>
              <input 
                type="email" 
                placeholder="name@email.com"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
            >
              {authLoading ? 'Verifying...' : authView === 'login' ? 'Open Portal' : 'Register Profile'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen gpay-main-bg">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/60 bg-[#0c101d]/60 backdrop-blur-md px-6 md:px-12 flex items-center justify-between shrink-0 sticky top-0 z-40">
        
        {/* Brand logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 via-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/10">
            I
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm tracking-tight text-slate-100">
              IndiaPay <span className="text-indigo-400 font-extrabold">Super</span>
            </h1>
            <span className="text-[8px] text-teal-400 font-mono tracking-widest uppercase block -mt-0.5">IndiaPay Payments System</span>
          </div>
        </div>

        <nav className="hidden xl:flex items-center gap-1">
          {[
            { id: 'home', label: 'Dashboard', icon: Home },
            { id: 'travel', label: 'Book Tickets', icon: Wallet },
            { id: 'entertainment', label: 'Movie Ticket', icon: Users },
            { id: 'recharges', label: 'Bills & Utilities', icon: PhoneCall },
            { id: 'chat', label: 'P2P Chats', icon: MessageCircle },
            { id: 'rewards', label: 'Rewards', icon: Gift },
            { id: 'banks', label: 'Linked Banks', icon: Building2 },
            { id: 'console', label: 'IndiaPay Console', icon: Sliders }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600/15 text-indigo-400 border-b-2 border-indigo-500 rounded-b-none' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Profile info & actions */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-200 block">{user.name}</span>
            <span className="text-[9px] text-teal-400 font-mono font-bold">Balance: ₹{(user.balance || 0).toLocaleString()}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-slate-800 hover:bg-red-950/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Log Out GPay"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </header>

      {/* Mobile Top Navigation */}
      <nav className="xl:hidden flex items-center justify-start border-b border-slate-800/40 bg-[#0c101d]/30 py-2 overflow-x-auto shrink-0 px-2 gap-2">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'travel', label: 'Tickets', icon: Wallet },
          { id: 'entertainment', label: 'Movie Ticket', icon: Users },
          { id: 'recharges', label: 'Bills', icon: PhoneCall },
          { id: 'chat', label: 'Chats', icon: MessageCircle },
          { id: 'rewards', label: 'Rewards', icon: Gift },
          { id: 'banks', label: 'Banks', icon: Building2 },
          { id: 'console', label: 'Console', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-xl text-[9px] font-bold cursor-pointer transition-all shrink-0 ${
                isActive ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'home' && (
          <FintechDashboard 
            user={user} 
            token={token} 
            refreshUserProfile={() => fetchProfile(token)}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'travel' && (
          <TravelBookings 
            token={token} 
            user={user}
            refreshUserProfile={() => fetchProfile(token)}
          />
        )}
        {activeTab === 'entertainment' && (
          <EntertainmentBookings 
            token={token} 
            user={user}
            refreshUserProfile={() => fetchProfile(token)}
          />
        )}
        {activeTab === 'recharges' && (
          <UtilityRecharges 
            token={token} 
            user={user}
            refreshUserProfile={() => fetchProfile(token)}
          />
        )}
        {activeTab === 'chat' && (
          <ChatPayments 
            user={user} 
            token={token} 
            refreshUserProfile={() => fetchProfile(token)} 
          />
        )}
        {activeTab === 'rewards' && (
          <RewardsCenter 
            user={user} 
            token={token} 
            refreshUserProfile={() => fetchProfile(token)}
          />
        )}
        {activeTab === 'banks' && (
          <BankManager 
            user={user} 
            token={token} 
          />
        )}
        {activeTab === 'console' && (
          <ConsolePanel 
            user={user} 
            token={token} 
            theme={theme}
            onThemeToggle={(newTheme) => setTheme(newTheme)}
            onProfileUpdate={(updatedUser) => setUser(updatedUser)}
          />
        )}
      </main>

      {/* Global Footer */}
      <footer className="py-6 border-t border-slate-800/40 text-center text-[10px] text-slate-500 font-mono">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>IndiaPay Secure Core v1.1.0</span>
        </div>
        <div className="text-slate-400 font-bold mt-1 text-[11px] font-heading">
          Design by <span className="text-indigo-500 hover:text-teal-400 transition-colors font-extrabold">Vishal Rawal</span>
        </div>
        <span className="block mt-1">© {new Date().getFullYear()} IndiaPay Technologies. All rights reserved.</span>
      </footer>

    </div>
  );
}

export default App;
