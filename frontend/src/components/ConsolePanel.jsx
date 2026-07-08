import React, { useState } from 'react';
import { 
  Sliders, 
  User, 
  CreditCard, 
  Terminal, 
  CheckCircle, 
  Loader2, 
  ShieldCheck, 
  DollarSign, 
  Plus,
  Trash2,
  Building2
} from 'lucide-react';

import { API_BASE } from '../config.js';

function ConsolePanel({ user, token, theme, onThemeToggle, onProfileUpdate }) {
  // Profile settings state
  const [name, setName] = useState(user.name);
  const [balance, setBalance] = useState(user.balance);
  const [upiPin, setUpiPin] = useState(user.upiPin || '1234');
  const [cardNumber, setCardNumber] = useState(user.cardNumber || '4532 8821 9012 3456');
  const [cardExpiry, setCardExpiry] = useState(user.cardExpiry || '12/30');
  const [cardCvv, setCardCvv] = useState(user.cardCvv || '321');

  // Linked banks local state
  const [banks, setBanks] = useState(user.linkedBanks || [
    { bankName: 'HDFC Bank', accountNumber: '•••• 8821', upiPin: '1234', isDefault: true },
    { bankName: 'State Bank of India', accountNumber: '•••• 5821', upiPin: '1234', isDefault: false }
  ]);

  // Form states to add new bank
  const [newBankName, setNewBankName] = useState('ICICI Bank');
  const [newBankAcc, setNewBankAcc] = useState('•••• 9912');
  const [newBankPin, setNewBankPin] = useState('1234');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Custom transaction injector state
  const [txnDesc, setTxnDesc] = useState('Google Play Store Purchase');
  const [txnAmount, setTxnAmount] = useState('150');
  const [txnType, setTxnType] = useState('booking'); // load, booking
  const [txnGateway, setTxnGateway] = useState('UPI (HDFC Bank)');
  const [txnInjecting, setTxnInjecting] = useState(false);
  const [txnSuccess, setTxnSuccess] = useState(false);

  const handleAddBank = () => {
    if (!newBankName || !newBankAcc || !newBankPin) return;
    setBanks(prev => [
      ...prev,
      {
        bankName: newBankName,
        accountNumber: newBankAcc.startsWith('••••') ? newBankAcc : `•••• ${newBankAcc.slice(-4)}`,
        upiPin: newBankPin,
        isDefault: prev.length === 0
      }
    ]);
    setNewBankAcc('');
  };

  const handleRemoveBank = (idx) => {
    setBanks(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      // Ensure at least one primary default if banks exist
      if (filtered.length > 0 && !filtered.some(b => b.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handleBankPinChange = (idx, value) => {
    setBanks(prev => prev.map((b, i) => i === idx ? { ...b, upiPin: value } : b));
  };

  const handleBankAccChange = (idx, value) => {
    setBanks(prev => prev.map((b, i) => i === idx ? { ...b, accountNumber: value } : b));
  };

  const handleSetPrimary = (idx) => {
    setBanks(prev => prev.map((b, i) => ({ ...b, isDefault: i === idx })));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/user/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          balance: Number(balance),
          upiPin,
          cardNumber,
          cardExpiry,
          cardCvv,
          linkedBanks: banks
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfileSuccess(true);
        onProfileUpdate(data.user);
        setTimeout(() => setProfileSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    if (!txnDesc || !txnAmount || isNaN(txnAmount)) return;

    setTxnInjecting(true);
    setTxnSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/wallet/inject-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: txnDesc,
          amount: Number(txnAmount),
          type: txnType,
          gateway: txnGateway
        })
      });
      const data = await res.json();
      if (data.success) {
        setTxnSuccess(true);
        setTxnDesc('Injected P2P Cash Transfer');
        setTxnAmount('500');
        setTimeout(() => setTxnSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTxnInjecting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      
      {/* 1. Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-850 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 glow-indigo">
            <Sliders className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-100 text-sm">IndiaPay Customizer Console</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Control panel for managing profile tags, credit cards CVV, balances, UPI PINs, and manual transaction injection.</p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold text-teal-400 border border-teal-500/20 bg-teal-500/5 px-3 py-1.5 rounded-xl uppercase">
          Developer Mode Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile & Cards Spec Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <form onSubmit={handleProfileSubmit} className="glass-panel rounded-3xl p-6 border border-slate-850 space-y-6 shadow-lg">
            <div className="flex items-center gap-2 text-indigo-400">
              <User className="w-5 h-5" />
              <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Configure User & Credit Cards</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Username */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Cardholder Username</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Wallet Balance */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Wallet Balance (INR)</label>
                <input
                  type="number"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Default UPI PIN */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Secure Main UPI PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={upiPin}
                  onChange={(e) => setUpiPin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. 1234"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Card Expiry (MM/YY)</label>
                <input
                  type="text"
                  required
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  placeholder="MM/YY"
                />
              </div>

              {/* Card Number */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Visa Platinum Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Card CVV */}
              <div className="space-y-1.5 col-span-2 sm:col-span-0.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">CVV</label>
                <input
                  type="password"
                  maxLength={3}
                  required
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  placeholder="CVV"
                />
              </div>

              {/* Theme Selector Option */}
              <div className="space-y-2 col-span-2 border-t border-slate-800/40 pt-4 animate-fadeIn">
                <label className="text-[10px] uppercase font-semibold text-slate-400 block">Interface Color Mode</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => onThemeToggle('dark')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      theme === 'dark'
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🌙</span> Dark Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeToggle('light')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      theme === 'light'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>☀️</span> Light Mode
                  </button>
                </div>
              </div>

            </div>

            {/* Linked Bank Accounts list */}
            <div className="border-t border-slate-800/60 pt-6 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Building2 className="w-5 h-5" />
                <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Manage Linked Bank Accounts</h4>
              </div>

              <div className="space-y-3.5">
                {banks.map((bank, idx) => (
                  <div key={idx} className="gpay-panel-bg p-4 rounded-2xl flex flex-col gap-3 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveBank(idx)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1 rounded-lg border border-slate-850 hover:bg-red-500/10 cursor-pointer transition-colors"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex justify-between items-center pr-8">
                      <div>
                        <strong className="text-xs font-bold text-slate-200 block">{bank.bankName}</strong>
                        <span className="text-[8.5px] text-slate-500 uppercase tracking-widest font-mono">Linked API node</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md border font-mono transition-colors ${
                          bank.isDefault 
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                            : 'border-slate-800 text-slate-500 hover:text-slate-350 hover:bg-slate-800/40 cursor-pointer'
                        }`}
                      >
                        {bank.isDefault ? 'PRIMARY ACCOUNT' : 'SET AS PRIMARY'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Account details */}
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-bold text-slate-500 font-mono">Account Number</label>
                        <input
                          type="text"
                          required
                          value={bank.accountNumber}
                          onChange={(e) => handleBankAccChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      {/* Bank PIN */}
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-bold text-slate-500 font-mono">Bank UPI PIN</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={bank.upiPin}
                          onChange={(e) => handleBankPinChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom Bank account box */}
              <div className="bg-[#080c18] border border-slate-850 p-4 rounded-2xl space-y-4">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider font-mono">+ Link New Mock Bank Account</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-slate-500">Bank Name</label>
                    <select
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-200 outline-none"
                    >
                      <option>HDFC Bank</option>
                      <option>State Bank of India</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Punjab National Bank</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-slate-500">Acc Number (last 4 digits)</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 9012"
                      value={newBankAcc}
                      onChange={(e) => setNewBankAcc(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-200 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-slate-500">Acc UPI PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 1234"
                      value={newBankPin}
                      onChange={(e) => setNewBankPin(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddBank}
                  className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white transition-all cursor-pointer"
                >
                  Add Bank Account
                </button>
              </div>

            </div>

            <div className="flex items-center gap-4 border-t border-slate-800/40 pt-6">
              <button
                type="submit"
                disabled={profileSaving}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Config Profile & Linked Banks
              </button>
              {profileSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                  <CheckCircle className="w-4 h-4" /> Configuration Saved Successfully!
                </span>
              )}
            </div>

          </form>

        </div>

        {/* Transaction Injector Form (5 cols) */}
        <form onSubmit={handleTxnSubmit} className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-850 space-y-5 shadow-lg flex flex-col justify-between h-fit">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-teal-400">
              <Terminal className="w-5 h-5" />
              <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Statement Ledger Injector</h4>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Transaction Details</label>
              <input
                type="text"
                required
                value={txnDesc}
                onChange={(e) => setTxnDesc(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Amount (INR)</label>
              <input
                type="number"
                required
                value={txnAmount}
                onChange={(e) => setTxnAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
              />
            </div>

            {/* Split row type & gateway */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Type</label>
                <select
                  value={txnType}
                  onChange={(e) => setTxnType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                >
                  <option value="load">Credit (Inflow)</option>
                  <option value="booking">Debit (Outflow)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Gateway</label>
                <select
                  value={txnGateway}
                  onChange={(e) => setTxnGateway(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                >
                  <option>UPI (HDFC Bank)</option>
                  <option>UPI (SBI Bank)</option>
                  <option>Visa Card</option>
                  <option>RuPay Platinum</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-slate-800/40 pt-4 mt-6">
            <button
              type="submit"
              disabled={txnInjecting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {txnInjecting && <Loader2 className="w-4 h-4 animate-spin" />}
              Inject Statement Entry
            </button>
            {txnSuccess && (
              <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 shrink-0 animate-fadeIn">
                <CheckCircle className="w-3.5 h-3.5" /> Injected!
              </span>
            )}
          </div>

        </form>

      </div>

    </div>
  );
}

export default ConsolePanel;
