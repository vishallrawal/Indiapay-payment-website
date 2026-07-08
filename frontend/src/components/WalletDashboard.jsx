import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { API_BASE } from '../config.js';
import LoadMoneyModal from './LoadMoneyModal.jsx';

function WalletDashboard({ user, token, refreshUserProfile }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadOpen, setIsLoadOpen] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchTransactions();
    refreshUserProfile();
  };

  // Calculate sum total inflows & outflows
  const totalInflow = transactions
    .filter(t => t.status === 'success' && (t.type === 'load' || (t.type === 'transfer' && t.receiverEmail.toLowerCase() === user.email.toLowerCase()) || (t.type === 'payment_link' && t.receiverEmail.toLowerCase() === user.email.toLowerCase())))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.status === 'success' && t.type === 'transfer' && t.senderEmail.toLowerCase() === user.email.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0);

  // Generate chart data based on transactions
  const getChartData = () => {
    if (transactions.length === 0) {
      // Placeholder data with professional upward trend
      return [
        { name: 'Mon', balance: 0 },
        { name: 'Tue', balance: 0 },
        { name: 'Wed', balance: 0 },
        { name: 'Thu', balance: 0 },
        { name: 'Fri', balance: 0 },
        { name: 'Sat', balance: 0 },
        { name: 'Sun', balance: user.balance }
      ];
    }

    // Process real transactions over last 7 days
    const sorted = [...(transactions || [])]
      .filter(t => t && t.status === 'success')
      .sort((a, b) => new Date(a.createdAt || a.timestamp || Date.now()) - new Date(b.createdAt || b.timestamp || Date.now()));

    let runningBalance = 0;
    const points = sorted.map(t => {
      const isInflow = t.type === 'load' || 
        (t.type === 'transfer' && t.receiverEmail.toLowerCase() === user.email.toLowerCase()) ||
        (t.type === 'payment_link' && t.receiverEmail.toLowerCase() === user.email.toLowerCase());
      
      if (isInflow) {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }

      const dateObj = new Date(t.createdAt);
      return {
        name: dateObj.toLocaleDateString([], { weekday: 'short' }),
        balance: runningBalance,
        rawDate: dateObj
      };
    });

    // Make sure we have at least 5 points for a beautiful chart
    if (points.length < 5) {
      const pad = [];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      for (let i = 0; i < 5 - points.length; i++) {
        pad.push({ name: days[i], balance: 0 });
      }
      return [...pad, ...points];
    }

    return points.slice(-7); // last 7 points
  };

  const chartData = getChartData();

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner section: 3D Credit Card & Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sleek Golden Visa-like 3D Debit Card */}
        <div className="relative w-full h-56 rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] p-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-indigo-500/30 group hover:scale-[1.01] hover:border-indigo-400/50 transition-all duration-300 ease-out">
          {/* Glowing Backdrops */}
          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-teal-400/10 blur-2xl group-hover:bg-teal-400/20 transition-colors"></div>
          <div className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full bg-purple-500/15 blur-2xl"></div>
          
          <div className="flex justify-between items-start z-10">
            {/* Card Chip & Contactless logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-9 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 border border-amber-300/40 relative overflow-hidden flex flex-col justify-between p-1.5 shadow-md">
                <div className="w-full h-0.5 bg-slate-800/20"></div>
                <div className="w-full h-0.5 bg-slate-800/20"></div>
                <div className="w-full h-0.5 bg-slate-800/20"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-800/20 -translate-x-1/2"></div>
              </div>
              <svg className="w-6 h-6 text-slate-400/80 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <span className="font-bold text-[11px] tracking-widest font-heading uppercase text-indigo-200 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/20">
              AuraPay Platinum
            </span>
          </div>

          <div className="my-2 z-10">
            <span className="text-[9px] text-indigo-200 font-semibold tracking-widest uppercase block opacity-70">Wallet Account Balance</span>
            <h3 className="text-3xl font-bold font-heading mt-1 tracking-tight">₹{(user.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>

          <div className="flex justify-between items-end z-10 border-t border-slate-700/20 pt-3">
            <div>
              <span className="text-[8px] text-indigo-200 tracking-wider uppercase block opacity-60">Account Holder</span>
              <span className="font-semibold text-xs text-slate-100 truncate max-w-[170px] block tracking-wide">{user.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[8px] text-indigo-200 font-bold uppercase tracking-wider block opacity-70 font-mono">RUPAY / SECURE</span>
              <span className="font-mono text-[11px] text-indigo-200/90 font-bold">•••• {user.id.slice(-4)}</span>
            </div>
          </div>
        </div>

        {/* Stats & Actions Panel */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Inflow Stat Card */}
            <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-slate-850 shadow-md">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Money Received</span>
                <h4 className="text-xl font-bold font-heading text-emerald-400">₹{(totalInflow || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h4>
                <p className="text-[9px] text-slate-500">Inflows & card deposits</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Outflow Stat Card */}
            <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-slate-850 shadow-md">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Money Sent</span>
                <h4 className="text-xl font-bold font-heading text-red-400">₹{(totalOutflow || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h4>
                <p className="text-[9px] text-slate-500">P2P Wallet Transfers</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/5">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action Row card */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-850 shadow-md">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Load Additional Funds</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Deposit money to your wallet instantly using any mock credit/debit card.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
              <button
                onClick={() => setIsLoadOpen(true)}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 cursor-pointer hover:shadow-indigo-500/25"
              >
                <Plus className="w-4 h-4" />
                Add Money
              </button>
              <button
                onClick={handleRefresh}
                className="p-2.5 rounded-xl border border-slate-850 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Refresh Page"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Analytical Curve and Transactions logs split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Area Line Chart: Wallet Growth (7 cols) */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-7 border border-slate-850 space-y-4 shadow-md flex flex-col justify-between min-h-[300px]">
          <div>
            <h4 className="font-heading font-semibold text-slate-200 text-sm">Wallet Balance Growth Curve</h4>
            <p className="text-[10px] text-slate-400">Visualization of balance trend over last active days</p>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area type="monotone" name="Balance (₹)" dataKey="balance" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info Explainer block: SaaS features description (5 cols) */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-5 border border-slate-850 flex flex-col justify-between min-h-[300px] shadow-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-heading font-semibold text-slate-200 text-sm">AuraPay Gateway Platform</h4>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Welcome to the premium payment orchestration network. AuraPay combines instantaneous bank-transfer simulation with real-world payment checkouts:
            </p>
            
            <div className="space-y-3 pt-1 text-[11px]">
              <div className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] text-indigo-400 font-bold">1</span>
                <div>
                  <span className="font-semibold text-slate-300 block">PCI-DSS Tokenization Vault</span>
                  <p className="text-[10px] text-slate-500">Secure card savings allow instant checkouts across checkout links.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-teal-500/10 flex items-center justify-center text-[10px] text-teal-400 font-bold">2</span>
                <div>
                  <span className="font-semibold text-slate-300 block">P2P Instant Settlement Ledger</span>
                  <p className="text-[10px] text-slate-500">Transfers are processed on-chain/in-database atomically with zero delays.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 text-[10px] text-slate-400 mt-2">
            <span className="font-semibold text-slate-300 block mb-0.5">Need Real Cards?</span>
            To connect to live card processing networks, open your `.env` configuration file and insert your Stripe Developer sandbox API credentials.
          </div>
        </div>

      </div>

      {/* 3. Transaction logs list */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-850 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
          <h3 className="font-heading font-semibold text-slate-200 text-sm">Account Ledger History</h3>
          <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Secured Trail</span>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto text-indigo-400 mb-2" />
            Loading transaction ledgers...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2 border border-dashed border-slate-850 rounded-2xl">
            <Clock className="w-8 h-8 mx-auto text-slate-700" />
            <p className="text-xs">No transactions recorded yet.</p>
            <p className="text-[10px] text-slate-600">Use "Add Money" to add funds, or generate payment links to receive pay.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850 text-xs space-y-1">
            {transactions.map(txn => {
              const isInflow = txn.type === 'load' || 
                (txn.type === 'transfer' && txn.receiverEmail && txn.receiverEmail.toLowerCase() === user.email.toLowerCase()) ||
                (txn.type === 'payment_link' && txn.receiverEmail && txn.receiverEmail.toLowerCase() === user.email.toLowerCase());

              const partyLabel = txn.type === 'load' 
                ? 'Deposited funds via card' 
                : txn.type === 'payment_link' 
                ? `Received link payout from ${(txn.senderEmail || '').replace('link_payer_', '')}` 
                : isInflow 
                ? `Received transfer from ${txn.senderEmail || 'sender'}` 
                : `Transferred balance to ${txn.receiverEmail || 'recipient'}`;

              return (
                <div key={txn.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/10 px-2 rounded-xl transition-all duration-150">
                  <div className="flex items-center gap-3.5">
                    {/* Directional Icon Indicator */}
                    {isInflow ? (
                      <span className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <ArrowDownLeft className="w-4.5 h-4.5" />
                      </span>
                    ) : (
                      <span className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <ArrowUpRight className="w-4.5 h-4.5" />
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-slate-200 text-xs">{partyLabel}</h5>
                        <span className="text-[8px] font-mono text-slate-500 uppercase">ID: {txn.id.slice(-6)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        {new Date(txn.createdAt).toLocaleString()} • {txn.gateway === 'stripe' ? 'Visa checkout via Stripe' : 'Local instapay settle'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <strong className={`font-heading font-bold text-sm ${isInflow ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {isInflow ? '+' : '-'} ₹{(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                      <span className={`block text-[9px] font-mono font-bold mt-0.5 ${
                        txn.status === 'success' ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        {txn.status.toUpperCase()}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load Money Modal popup */}
      {isLoadOpen && (
        <LoadMoneyModal 
          token={token} 
          onClose={() => setIsLoadOpen(false)} 
          refreshDashboard={() => {
            refreshUserProfile();
            fetchTransactions();
          }}
        />
      )}

    </div>
  );
}

export default WalletDashboard;
