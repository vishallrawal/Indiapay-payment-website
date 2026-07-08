import React, { useState } from 'react';
import { 
  X, 
  Loader2, 
  Send, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

import { API_BASE } from '../config.js';

function SendMoneyModal({ token, user, onClose, refreshWallet }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (!recipientEmail) return setError('Please enter recipient email address.');
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return setError('Please enter a valid numeric transfer amount.');
    }

    if (recipientEmail.toLowerCase() === user.email.toLowerCase()) {
      return setError('Cannot transfer money to yourself.');
    }

    if (user.balance < numericAmount) {
      return setError(`Insufficient wallet balance. Available: ₹${user.balance.toLocaleString()}`);
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail.toLowerCase(),
          amount: numericAmount,
          description
        })
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        refreshWallet();
      } else {
        setError(data.error || 'Transfer transaction rejected.');
      }
    } catch (err) {
      setError('Connection failure: could not connect to transaction server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#04060b]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-800">
        
        {/* Modal Close */}
        {!success && (
          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 hover:text-slate-200 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Transfer form */}
        {!success ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="font-heading font-semibold text-slate-200 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                P2P Instapay Fund Transfer
              </h3>
              <p className="text-xs text-slate-400">Transfer cash instantly to any registered AuraPay email.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              {/* Input: Recipient */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Recipient Email</label>
                <input
                  type="email"
                  placeholder="recipient@email.com"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Input: Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Transfer Amount (INR)</label>
                  <span className="text-[9px] font-mono text-slate-500">Available: ₹{user.balance.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors font-semibold"
                  />
                </div>
              </div>

              {/* Input: Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Remarks / Message (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner share, rent, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Instapay Transfer
              </button>

            </form>
          </div>
        ) : (
          // Success view
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto glow-emerald">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-lg text-slate-200">Transfer Completed!</h3>
              <p className="text-xs text-slate-400">₹{Number(amount).toLocaleString()} successfully sent to <strong className="text-slate-300 font-mono text-[11px] block mt-1">{recipientEmail.toLowerCase()}</strong></p>
            </div>

            <button
              onClick={onClose}
              className="py-2 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700/50 transition-colors cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default SendMoneyModal;
