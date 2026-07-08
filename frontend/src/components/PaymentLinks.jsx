import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Link, 
  Copy, 
  Check, 
  HelpCircle, 
  FileText, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

import { API_BASE } from '../config.js';

function PaymentLinks({ user, token }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const fetchLinks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/links/my-links`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setLinks(data.links);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return setError('Please enter a valid numeric amount.');
    }

    setCreating(true);

    try {
      const res = await fetch(`${API_BASE}/api/links/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numericAmount, description })
      });
      const data = await res.json();

      if (data.success) {
        setAmount('');
        setDescription('');
        fetchLinks();
      } else {
        setError(data.error || 'Failed to generate link.');
      }
    } catch (err) {
      setError('Connection failure: could not create link.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (linkId) => {
    const fullUrl = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(''), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
      
      {/* 1. Payment Links List (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-slate-200">Shareable Checkout Links</h3>
            <p className="text-xs text-slate-400">Share these links with anyone. They can pay you via Card/Stripe without logging in.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Count: {links.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Clock className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
            Loading checkouts list...
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-2xl">
            <Link className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No active payment links found.</p>
            <p className="text-[10px] text-slate-600">Use the creator form on the right to compile a checkout route.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map(link => {
              const fullUrl = `${window.location.origin}/pay/${link.id}`;
              const isCopied = copiedId === link.id;

              return (
                <div key={link.id} className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {link.id}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-200">{link.description}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">URL:</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-sm" title={fullUrl}>{fullUrl}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4.5">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Settles Amount</span>
                      <strong className="text-emerald-400 font-heading font-bold text-sm">₹{link.amount.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Copy Link */}
                      <button
                        onClick={() => handleCopyLink(link.id)}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1 text-[10px] font-bold cursor-pointer ${
                          isCopied 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                        title="Copy payment URL"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Copied' : 'Copy'}
                      </button>

                      {/* Open Link */}
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors flex items-center justify-center"
                        title="Open checkout page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Link Creator Form (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <h3 className="font-heading font-semibold text-slate-200">Link Creator</h3>
        
        <form onSubmit={handleCreateLink} className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Settlement Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-slate-400 font-bold text-xs">₹</span>
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

          {/* Purpose input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Purpose / Description</label>
            <input
              type="text"
              placeholder="e.g. Graphic design invoice #12"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Generating...' : 'Generate Payment Link'}
          </button>

        </form>

        {/* Explain info */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/60 text-xs text-slate-400 space-y-2">
          <span className="font-semibold text-slate-300 block">How payment links work:</span>
          <p className="leading-relaxed text-[11px]">
            Once generated, copy the URL and send it to your client. When they click the link, they will be redirected to AuraPay's secure checkout page. They can pay via their debit/credit card. Upon successful settlement, the funds will be instantly credited to your wallet balance.
          </p>
        </div>
      </div>

    </div>
  );
}

export default PaymentLinks;
