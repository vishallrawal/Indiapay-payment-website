import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';

import { API_BASE } from '../config.js';

function GroupSplitter({ token, user }) {
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      // 1. Fetch split groups
      const gRes = await fetch(`${API_BASE}/api/groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const gData = await gRes.json();
      if (gData.success) {
        setGroups(gData.groups);
      }

      // 2. Fetch contacts for multi-select
      const cRes = await fetch(`${API_BASE}/api/chats/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cData = await cRes.json();
      if (cData.success) {
        setContacts(cData.contacts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckboxChange = (email) => {
    setSelectedEmails(prev => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setFormError('');

    const amountNum = Number(totalAmount);
    if (!groupName.trim()) return setFormError('Please enter a group name.');
    if (!totalAmount || isNaN(amountNum) || amountNum <= 0) {
      return setFormError('Please enter a valid numeric total amount.');
    }
    if (selectedEmails.length === 0) {
      return setFormError('Select at least one contact to split the bill with.');
    }

    setCreating(true);

    try {
      const res = await fetch(`${API_BASE}/api/groups/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          groupName,
          totalAmount: amountNum,
          memberEmails: selectedEmails
        })
      });
      const data = await res.json();

      if (data.success) {
        setGroupName('');
        setTotalAmount('');
        setSelectedEmails([]);
        fetchData();
      } else {
        setFormError(data.error || 'Failed to initialize group split.');
      }
    } catch (err) {
      setFormError('Connection failure.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
      
      {/* 1. Split Groups List (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-slate-200 text-sm">Split Bill Groups</h3>
            <p className="text-xs text-slate-400">Track and monitor shared invoice split status among group members.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Count: {groups.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
            Loading group splitting curves...
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2 border border-dashed border-slate-850 rounded-2xl">
            <Users className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-xs">No active split bill groups found.</p>
            <p className="text-[10px] text-slate-600">Use the group compiler form on the right to divide a bill.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map(group => {
              const settledSplits = group.splits.filter(s => s.status === 'settled').length;
              const totalSplits = group.splits.length;
              const progressPercent = Math.round((settledSplits / totalSplits) * 100);

              return (
                <div key={group.id} className="glass-panel rounded-2xl p-5 border border-slate-850 flex flex-col justify-between space-y-4 hover:border-slate-800 transition-all shadow-md">
                  
                  {/* Card Header */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {group.id}
                      </span>
                      <strong className="text-emerald-400 font-heading text-sm">₹{group.totalAmount.toLocaleString()}</strong>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 pt-1 truncate">{group.name}</h4>
                    <span className="text-[9px] text-slate-500 font-mono">Created by: {group.creatorEmail === user.email ? 'You' : group.creatorEmail}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Settle: {settledSplits}/{totalSplits} members</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-550" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Member splits list */}
                  <div className="border-t border-slate-800/40 pt-3 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {group.splits.map((split, idx) => {
                      const isMe = split.email.toLowerCase() === user.email.toLowerCase();
                      return (
                        <div key={idx} className="flex justify-between items-center text-[10px]">
                          <span className={`truncate max-w-[120px] font-mono ${isMe ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
                            {isMe ? 'You' : split.email}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300 font-semibold">₹{split.amount}</span>
                            {split.status === 'settled' ? (
                              <span className="text-[8px] text-emerald-400 font-mono font-bold uppercase">PAID</span>
                            ) : (
                              <span className="text-[8px] text-amber-500 font-mono font-bold uppercase">PENDING</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Group Creator Form (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <h3 className="font-heading font-semibold text-slate-200 text-sm">Split Creator</h3>
        
        <form onSubmit={handleCreateGroup} className="glass-panel rounded-2xl p-6 border border-slate-850 space-y-4">
          
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Group / Bill Name</label>
            <input
              type="text"
              placeholder="e.g. Lunch Share, Office Gift"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Bill Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total Bill Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-slate-400 font-bold text-xs">₹</span>
              <input
                type="number"
                placeholder="e.g. 3000"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors font-semibold"
              />
            </div>
          </div>

          {/* Add Members Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Choose Members</label>
            {contacts.length === 0 ? (
              <span className="text-[10px] text-slate-500 italic">No contacts available to split.</span>
            ) : (
              <div className="border border-slate-800/80 rounded-xl bg-slate-900/60 p-3.5 space-y-2 max-h-[140px] overflow-y-auto">
                {contacts.map(c => {
                  const checked = selectedEmails.includes(c.email);
                  return (
                    <label key={c.id} className="flex items-center gap-2.5 text-[11px] text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleCheckboxChange(c.email)}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span className="truncate">{c.name} ({c.email})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 disabled:opacity-50"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            Compile Split Request
          </button>

        </form>
      </div>

    </div>
  );
}

export default GroupSplitter;
