import React, { useState } from 'react';
import { 
  QrCode, 
  Send, 
  Search, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ShieldCheck
} from 'lucide-react';

import { API_BASE } from '../config.js';

function QRShowcase({ token, user, refreshUserProfile }) {
  const [targetEmail, setTargetEmail] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foundUser, setFoundUser] = useState(null);

  // Transaction form states
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Search user by UPI ID (email)
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setFoundUser(null);
    setSuccessMsg('');

    if (!targetEmail.trim()) return;
    if (targetEmail.toLowerCase() === user.email.toLowerCase()) {
      return setSearchError('Cannot search your own ID.');
    }

    setSearchLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chats/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const match = data.contacts.find(c => c.email.toLowerCase() === targetEmail.toLowerCase().trim());
        if (match) {
          setFoundUser(match);
        } else {
          setSearchError('No AuraPay user found with this email/UPI ID.');
        }
      }
    } catch (err) {
      setSearchError('Connection failed.');
    } finally {
      setSearchLoading(false);
    }
  };

  // 2. Settle payment
  const handlePayment = async (e) => {
    e.preventDefault();
    const amountNum = Number(payAmount);
    if (!payAmount || isNaN(amountNum) || amountNum <= 0) return;
    if (amountNum > user.balance) return alert('Insufficient funds.');

    setPayLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: foundUser.email,
          amount: amountNum,
          description: payNote || 'UPI Scan payment'
        })
      });
      const data = await res.json();

      if (data.success) {
        // Also log transaction message inside chat thread
        await fetch(`${API_BASE}/api/chats/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverEmail: foundUser.email,
            text: `Sent ₹${amountNum} (Paid via UPI Scan)`
          })
        }).catch(() => {});

        setSuccessMsg(`₹${amountNum} successfully transferred via UPI ID to ${foundUser.name}!`);
        setPayAmount('');
        setPayNote('');
        setFoundUser(null);
        setTargetEmail('');
        refreshUserProfile();
      } else {
        alert(data.error || 'Payment failed.');
      }
    } catch (err) {
      alert('Connection failed.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
      
      {/* 1. personal QR Showcase */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-850 flex flex-col items-center justify-between text-center min-h-[380px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl"></div>
        
        <div className="space-y-1">
          <h3 className="font-heading font-bold text-slate-100 text-sm">Personal UPI QR Code</h3>
          <p className="text-[10px] text-slate-500">Show this QR to other AuraPay users to receive money.</p>
        </div>

        {/* Custom Dynamic SVG QR Code Design */}
        <div className="relative w-48 h-48 bg-white rounded-2xl p-4 shadow-xl border border-slate-200 flex flex-col justify-between items-center group">
          <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
            {/* Corner square 1 */}
            <rect x="5" y="5" width="20" height="20" strokeWidth="4" />
            <rect x="10" y="10" width="10" height="10" fill="currentColor" />
            {/* Corner square 2 */}
            <rect x="75" y="5" width="20" height="20" strokeWidth="4" />
            <rect x="80" y="10" width="10" height="10" fill="currentColor" />
            {/* Corner square 3 */}
            <rect x="5" y="75" width="20" height="20" strokeWidth="4" />
            <rect x="10" y="80" width="10" height="10" fill="currentColor" />
            {/* Center mockup squares */}
            <rect x="40" y="40" width="20" height="20" strokeWidth="2" strokeDasharray="3,3" />
            {/* Random dots to make it look like a real QR code */}
            <circle cx="45" cy="15" r="3" fill="currentColor" />
            <circle cx="55" cy="25" r="3.5" fill="currentColor" />
            <circle cx="15" cy="45" r="3" fill="currentColor" />
            <circle cx="25" cy="55" r="2.5" fill="currentColor" />
            <circle cx="45" cy="75" r="3" fill="currentColor" />
            <circle cx="75" cy="45" r="4" fill="currentColor" />
            <circle cx="85" cy="55" r="2" fill="currentColor" />
            <circle cx="65" cy="85" r="3" fill="currentColor" />
            <circle cx="85" cy="85" r="4" fill="currentColor" />
          </svg>
          {/* Central Logo mark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-600 border-2 border-white flex items-center justify-center font-bold text-white text-[10px] shadow-md">
            A
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-200 block">{user.name}</span>
          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{user.email}</span>
        </div>

      </div>

      {/* 2. QR/UPI ID Scanning Pay */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-850 flex flex-col justify-between min-h-[380px] shadow-xl relative">
        <div className="space-y-1 mb-4">
          <h3 className="font-heading font-bold text-slate-100 text-sm">Pay via Phone or UPI ID</h3>
          <p className="text-[10px] text-slate-500">Scan someone's account by typing their email address.</p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 mb-4">
            <CheckCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Bar */}
        {!foundUser ? (
          <form onSubmit={handleSearch} className="space-y-4 flex-1 flex flex-col justify-center">
            {searchError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Recipient UPI ID / Email</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="recipient@email.com"
                  required
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searchLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Search & Verify UPI ID
            </button>
          </form>
        ) : (
          // Found User Payout Portal
          <form onSubmit={handlePayment} className="space-y-4 flex-1 flex flex-col justify-center animate-fadeIn">
            
            {/* verified User Banner */}
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[8px] font-bold text-indigo-400 uppercase font-mono block">VERIFIED UPI BENEFICIARY</span>
                <span className="text-xs font-bold text-slate-200 block">{foundUser.name}</span>
                <span className="text-[9px] text-slate-500 font-mono block">{foundUser.email}</span>
              </div>
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>

            {/* Input Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Paying Amount (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            {/* Input Note */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Add Remark / Message</label>
              <input
                type="text"
                placeholder="What is this split for?"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFoundUser(null)}
                className="flex-1 py-2 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-400 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={payLoading}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
              >
                {payLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm UPI Pay
              </button>
            </div>

          </form>
        )}

        <div className="border-t border-slate-850 pt-4 text-[9px] text-slate-500 font-mono text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>AuraPay Dynamic Encryption Core</span>
        </div>
      </div>

    </div>
  );
}

export default QRShowcase;
