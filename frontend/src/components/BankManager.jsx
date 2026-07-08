import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Loader2, 
  CheckCircle, 
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

import { API_BASE } from '../config.js';

const AVAILABLE_BANKS = [
  { name: 'HDFC Bank', code: 'HDFC', logo: '🏦' },
  { name: 'State Bank of India', code: 'SBI', logo: '🏦' },
  { name: 'ICICI Bank', code: 'ICICI', logo: '🏦' },
  { name: 'Axis Bank', code: 'AXIS', logo: '🏦' }
];

const getBankColorClasses = (bankName) => {
  const name = bankName.toLowerCase();
  if (name.includes('hdfc')) {
    return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
  } else if (name.includes('state') || name.includes('sbi')) {
    return 'bg-red-500/10 border-red-500/20 text-red-500';
  } else {
    return 'bg-rose-500/10 border-rose-500/20 text-rose-500'; // Maroon
  }
};

function BankManager({ token }) {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedBank, setSelectedBank] = useState('');
  const [linkStep, setLinkStep] = useState('select'); // select, verifying, success
  const [error, setError] = useState('');

  // Balance checking states
  const [visibleBalances, setVisibleBalances] = useState({});
  const [pinPromptBank, setPinPromptBank] = useState(null);
  const [upiPinInput, setUpiPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/banks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBanks(data.linkedBanks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleLinkBank = async () => {
    if (!selectedBank) return;
    setError('');
    setLinkStep('verifying');

    // Generate mock account number (last 4 digits)
    const mockAccNum = `•••• ${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Simulate SMS OTP handshake latency (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2200));

      const res = await fetch(`${API_BASE}/api/banks/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bankName: selectedBank,
          accountNumber: mockAccNum
        })
      });
      const data = await res.json();

      if (data.success) {
        setLinkStep('success');
        fetchBanks();
      } else {
        setError(data.error || 'Failed to authenticate bank account.');
        setLinkStep('select');
      }
    } catch (err) {
      setError('Connection failure during SMS verification.');
      setLinkStep('select');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-fadeIn">
      
      {/* 1. Linked Banks accounts lists (7 cols) */}
      <div className="md:col-span-7 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-slate-200 text-sm">Linked Bank Accounts</h3>
            <p className="text-xs text-slate-400">These accounts are utilized to load balance and debit transactions via UPI.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Count: {banks.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
            Syncing bank connections...
          </div>
        ) : banks.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2 border border-dashed border-slate-850 rounded-2xl">
            <Building2 className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-xs">No bank accounts linked yet.</p>
            <p className="text-[10px] text-slate-600">Link your bank account to enable direct instant checkout nodes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banks.map((bank, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-5 border border-slate-850 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg ${getBankColorClasses(bank.bankName)}`}>
                    🏦
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs">{bank.bankName}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{bank.accountNumber}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  {bank.isDefault ? (
                    <span className="text-[8.5px] font-bold text-teal-400 font-mono uppercase bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">PRIMARY DEBIT</span>
                  ) : (
                    <span className="text-[8.5px] font-bold text-slate-500 font-mono uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">SECONDARY</span>
                  )}
                  
                  {visibleBalances[bank.id || bank.bankName + bank.accountNumber] ? (
                    <span className="text-[10.5px] font-bold text-emerald-400 font-mono">
                      Bal: ₹{(bank.balance || 23420).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <button 
                      onClick={() => setPinPromptBank(bank)}
                      className="text-[9px] font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-0.5 rounded transition-colors cursor-pointer border border-red-500/25 mt-0.5"
                    >
                      Check Balance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Link Bank Form panel (5 cols) */}
      <div className="md:col-span-5 space-y-6">
        <h3 className="font-heading font-semibold text-slate-200 text-sm">Link New Bank</h3>

        <div className="glass-panel rounded-2xl p-6 border border-slate-850 space-y-4 shadow-md">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {linkStep === 'select' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Choose Bank Institution</label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_BANKS.map(b => {
                    const isSelected = selectedBank === b.name;
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBank(b.name)}
                        className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-blue-600/15 border-blue-500 text-blue-500' 
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 text-slate-300'
                        }`}
                      >
                        <span className="text-xl">{b.logo}</span>
                        <span className="text-[10px] font-bold tracking-tight">{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLinkBank}
                disabled={!selectedBank}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                Proceed via SMS Check
              </button>
            </div>
          )}

          {linkStep === 'verifying' && (
            <div className="text-center py-6 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-200">Sending SMS Verification...</h4>
                <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                  IndiaPay is sending an encrypted carrier SMS to link bank profiles matching your phone number.
                </p>
              </div>
            </div>
          )}

          {linkStep === 'success' && (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-200">Bank Linked Successfully!</h4>
                <p className="text-[10px] text-slate-400">Your {selectedBank} account is configured and ready.</p>
              </div>
              <button
                type="button"
                onClick={() => { setLinkStep('select'); setSelectedBank(''); }}
                className="py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-500/10"
              >
                Link Another
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mini UPI PIN Modal for Balance Check */}
      {pinPromptBank && (
        <div className="fixed inset-0 z-50 bg-[#04060b]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl relative border border-slate-800 space-y-4">
            <button 
              onClick={() => { setPinPromptBank(null); setUpiPinInput(''); setPinError(''); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 hover:text-slate-200 text-slate-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-1">
              <h4 className="font-heading font-semibold text-slate-200 text-xs font-mono">Verify UPI PIN</h4>
              <p className="text-[10px] text-slate-400">Enter UPI PIN for {pinPromptBank.bankName} ({pinPromptBank.accountNumber})</p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (upiPinInput === pinPromptBank.upiPin || upiPinInput === '1234') {
                setVisibleBalances(prev => ({ ...prev, [pinPromptBank.id || pinPromptBank.bankName + pinPromptBank.accountNumber]: true }));
                setPinPromptBank(null);
                setUpiPinInput('');
                setPinError('');
              } else {
                setPinError('Invalid UPI PIN. Default PIN is 1234.');
              }
            }} className="space-y-3">
              {pinError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-xl text-center font-mono">
                  {pinError}
                </div>
              )}
              <input
                type="password"
                maxLength={6}
                placeholder="Enter 4 or 6-digit PIN"
                value={upiPinInput}
                onChange={(e) => setUpiPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-sm font-mono py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-250 outline-none focus:border-red-500 transition-colors"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-red-500/10"
              >
                Confirm & View Balance
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default BankManager;
