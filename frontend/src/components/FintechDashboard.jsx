import React, { useState, useEffect } from 'react';
import { 
  Send, 
  QrCode, 
  Building2, 
  Tv, 
  Zap, 
  Droplet, 
  PhoneCall, 
  Plane, 
  Train, 
  Bus, 
  Film,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Plus,
  Loader2,
  Gift,
  Eye,
  EyeOff
} from 'lucide-react';

import { API_BASE } from '../config.js';
import LoadMoneyModal from './LoadMoneyModal.jsx';

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

function FintechDashboard({ user, token, refreshUserProfile, onNavigate }) {
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Fetch transactions
      const tRes = await fetch(`${API_BASE}/api/wallet/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tData = await tRes.json();
      if (tData.success) {
        setTransactions(tData.transactions);
      }

      // Fetch bookings
      const bRes = await fetch(`${API_BASE}/api/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bData = await bRes.json();
      if (bData.success) {
        setBookings(bData.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalInflow = transactions
    .filter(t => t.status === 'success' && (t.type === 'load' || (t.type === 'transfer' && t.receiverEmail.toLowerCase() === user.email.toLowerCase()) || (t.type === 'reward_credit')))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.status === 'success' && (t.type === 'booking' || (t.type === 'transfer' && t.senderEmail.toLowerCase() === user.email.toLowerCase())))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Core Card & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visa Card Design */}
        <div className="relative w-full h-56 rounded-3xl bg-gradient-to-br from-[#0c0e17] via-[#1a1e36] to-[#0f111a] p-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-indigo-500/25 group hover:scale-[1.01] hover:border-indigo-400/40 transition-all duration-300">
          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-teal-500/5 blur-2xl"></div>
          <div className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full bg-purple-500/10 blur-2xl"></div>
          
          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-8 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 border border-amber-300/30 relative overflow-hidden flex flex-col justify-between p-1.5 shadow-md">
                <div className="w-full h-0.5 bg-slate-800/20"></div>
                <div className="w-full h-0.5 bg-slate-800/20"></div>
                <div className="w-full h-0.5 bg-slate-800/20"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-800/20 -translate-x-1/2"></div>
              </div>
              <span className="text-[10px] text-indigo-300 font-mono tracking-widest rotate-90">📶</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setShowCardDetails(!showCardDetails)}
                className="p-1 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 hover:text-indigo-350 transition-colors cursor-pointer"
                title={showCardDetails ? "Hide Card Info" : "Reveal Card Info"}
              >
                {showCardDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <span className="font-bold text-[9px] tracking-widest font-heading uppercase text-indigo-200 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                IndiaPay Platinum
              </span>
            </div>
          </div>

          <div className="my-2 z-10 space-y-1">
            <span className="text-[7.5px] text-slate-500 font-bold tracking-widest uppercase block">CARD NUMBER</span>
            <strong className="text-sm font-mono tracking-wider text-slate-200 block">
              {showCardDetails 
                ? (user.cardNumber || '4532 8821 9012 3456')
                : (user.cardNumber ? `${user.cardNumber.slice(0, 4)} •••• •••• ${user.cardNumber.slice(-4)}` : '4532 •••• •••• 3456')}
            </strong>
          </div>

          <div className="flex justify-between items-end z-10 border-t border-slate-800/30 pt-2.5">
            <div>
              <span className="text-[7px] text-slate-500 tracking-wider uppercase block">Cardholder</span>
              <span className="font-semibold text-[10.5px] text-slate-350 truncate max-w-[130px] block tracking-wide">{user.name}</span>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <div>
                <span className="text-[7px] text-slate-500 block uppercase">Expiry</span>
                <span className="text-slate-300 font-bold">{user.cardExpiry || '12/30'}</span>
              </div>
              <div>
                <span className="text-[7px] text-slate-500 block uppercase">CVV</span>
                <span className="text-indigo-405 font-bold">{showCardDetails ? (user.cardCvv || '321') : '***'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic stat metrics & Load Actions */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-slate-850">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Cashback & Deposits</span>
                <h4 className="text-lg font-bold font-heading text-emerald-400">₹{totalInflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h4>
                <span className="text-[8px] text-slate-500 block">Funds added + won cards</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border border-slate-850">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Spending & Transfers</span>
                <h4 className="text-lg font-bold font-heading text-red-400">₹{totalOutflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h4>
                <span className="text-[8px] text-slate-500 block">Bookings + P2P sends</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-850">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Simulate Deposit Load</h4>
              <p className="text-[9.5px] text-slate-400 leading-relaxed">Instantly increase your balance by depositing funds via a mock credit/debit card.</p>
            </div>
            
            <button
              onClick={() => setIsLoadOpen(true)}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Load Wallet Funds
            </button>
          </div>
        </div>

      </div>

      {/* 2. Services Grid Category Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Services Container (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Quick Pay Actions */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-slate-300 text-xs uppercase tracking-wider">People & Transfers</h4>
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => onNavigate('chat')} className="gpay-quick-btn-send glass-panel rounded-2xl p-4 text-center border border-slate-850 hover:bg-slate-900/40 hover:scale-[1.01] transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-300 block">Send to Contact</span>
              </button>
              <button onClick={() => onNavigate('qr')} className="gpay-quick-btn-qr glass-panel rounded-2xl p-4 text-center border border-slate-850 hover:bg-slate-900/40 hover:scale-[1.01] transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-300 block">Scan UPI QR</span>
              </button>
              <button onClick={() => onNavigate('banks')} className="gpay-quick-btn-banks glass-panel rounded-2xl p-4 text-center border border-slate-850 hover:bg-slate-900/40 hover:scale-[1.01] transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-300 block">Linked Banks</span>
              </button>
            </div>

            {/* Linked Bank Accounts Details list */}
            {user.linkedBanks && user.linkedBanks.length > 0 && (
              <div className="gpay-panel-bg rounded-2xl p-3.5 space-y-2 mt-3 text-[10px] animate-fadeIn">
                <span className="font-bold text-slate-400 block uppercase tracking-wider text-[8px] font-mono">Linked UPI Bank Accounts</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.linkedBanks.map((bank, idx) => (
                    <div key={idx} className="flex items-center justify-between gpay-panel-bg p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs ${getBankColorClasses(bank.bankName)}`}>
                          🏦
                        </div>
                        <div>
                          <strong className="text-slate-200 font-bold block leading-tight">{bank.bankName}</strong>
                          <span className="text-[8px] text-slate-500 font-mono">IFSC: {bank.bankName.includes('HDFC') ? 'HDFC0001024' : 'SBIN0000840'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-350 font-mono font-bold block">{bank.accountNumber}</span>
                        {bank.isDefault && (
                          <span className="text-[7.5px] bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase font-mono">PRIMARY</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ticket Booking Portals */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-slate-300 text-xs uppercase tracking-wider">Travel & Leisure Bookings</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <button onClick={() => onNavigate('travel')} className="gpay-booking-btn-flight glass-panel rounded-2xl p-4 text-center border border-slate-850 hover:bg-slate-900/40 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between aspect-square">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <Plane className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-200 block">Flight Tickets</span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">Indigo, AirIndia</span>
                </div>
              </button>

              <button onClick={() => onNavigate('travel')} className="gpay-booking-btn-train glass-panel rounded-2xl p-4 text-center border border-slate-850 hover:bg-slate-900/40 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between aspect-square">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto shadow-sm">
                  <Train className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-200 block">IRCTC Trains</span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">Shatabdi, Rajdhani</span>
                </div>
              </button>

              <button onClick={() => onNavigate('travel')} className="gpay-booking-btn-bus glass-panel rounded-2xl p-4 text-center border border-slate-850 hover:bg-slate-900/40 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between aspect-square">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-sm">
                  <Bus className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-200 block">Bus Bookings</span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">IntrCity, ZingBus</span>
                </div>
              </button>

              <button onClick={() => onNavigate('entertainment')} className="gpay-booking-btn-movie glass-panel rounded-2xl p-4 text-center border border-slate-850 hover:bg-slate-900/40 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between aspect-square">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto shadow-sm">
                  <Film className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-200 block">Movie Tickets</span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">Cinema Seat Map</span>
                </div>
              </button>

            </div>
          </div>

          {/* Utility bills and recharges */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-slate-300 text-xs uppercase tracking-wider">Utility Invoices & Recharges</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button onClick={() => onNavigate('recharges')} className="gpay-utility-btn-mobile glass-panel rounded-xl p-3 flex items-center gap-3 border border-slate-850 hover:bg-slate-900/40 cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <span className="text-[10px] font-bold text-slate-300 block">Recharge Mobile</span>
                  <span className="text-[8px] text-slate-500">Jio, Airtel plans</span>
                </div>
              </button>

              <button onClick={() => onNavigate('recharges')} className="gpay-utility-btn-electricity glass-panel rounded-xl p-3 flex items-center gap-3 border border-slate-850 hover:bg-slate-900/40 cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <span className="text-[10px] font-bold text-slate-300 block">Electricity bill</span>
                  <span className="text-[8px] text-slate-500">State board boards</span>
                </div>
              </button>

              <button onClick={() => onNavigate('recharges')} className="gpay-utility-btn-dth glass-panel rounded-xl p-3 flex items-center gap-3 border border-slate-850 hover:bg-slate-900/40 cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 flex items-center justify-center shrink-0 shadow-sm">
                  <Tv className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <span className="text-[10px] font-bold text-slate-300 block">DTH Recharge</span>
                  <span className="text-[8px] text-slate-500">Tata Play, Dish TV</span>
                </div>
              </button>

              <button onClick={() => onNavigate('recharges')} className="gpay-utility-btn-water glass-panel rounded-xl p-3 flex items-center gap-3 border border-slate-850 hover:bg-slate-900/40 cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Droplet className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <span className="text-[10px] font-bold text-slate-300 block">Water Bills</span>
                  <span className="text-[8px] text-slate-500">Municipal municipal</span>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: GPay Rewards & Offers Cards (4 cols) */}
        <div className="md:col-span-4 glass-panel rounded-3xl p-5 border border-slate-850 flex flex-col justify-between min-h-[380px] shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Gift className="w-5 h-5" />
              <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Rewards & Offers</h4>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Earn assured cashbacks and scratch cards by sending money to contacts or booking flight and cinema tickets on Google Pay.
            </p>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center space-y-2">
              <span className="text-[8px] text-red-500 block uppercase font-bold tracking-widest font-mono">Cashback Won</span>
              <strong className="text-2xl font-heading font-extrabold text-red-600">₹280.00</strong>
              <span className="text-[9px] text-red-400 block mt-0.5">3 Scratch Cards Claimed</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('rewards')}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            Claim Scratch Cards
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 3. Transaction Statements Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-850 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
          <h3 className="font-heading font-semibold text-slate-200 text-sm">Passbook Ledger Accounts</h3>
          <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Verified Trails</span>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mx-auto text-indigo-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No transaction statements logged.
          </div>
        ) : (
          <div className="divide-y divide-slate-850 text-xs space-y-1">
            {transactions.slice(0, 5).map(txn => {
              const isInflow = txn.type === 'load' || 
                (txn.type === 'transfer' && txn.receiverEmail.toLowerCase() === user.email.toLowerCase()) ||
                (txn.type === 'reward_credit');

              return (
                <div key={txn.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/10 px-2 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    {isInflow ? (
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><ArrowDownLeft className="w-4 h-4" /></span>
                    ) : (
                      <span className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400"><ArrowUpRight className="w-4 h-4" /></span>
                    )}
                    <div>
                      <h5 className="font-semibold text-slate-200 text-xs">{txn.description}</h5>
                      <span className="text-[9px] text-slate-500 font-mono">{new Date(txn.createdAt).toLocaleString()} • {txn.gateway.toUpperCase()}</span>
                    </div>
                  </div>
                  <strong className={`font-heading font-bold text-sm ${isInflow ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {isInflow ? '+' : '-'} ₹{txn.amount.toLocaleString('en-IN')}
                  </strong>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isLoadOpen && (
        <LoadMoneyModal 
          token={token} 
          onClose={() => setIsLoadOpen(false)} 
          refreshDashboard={() => {
            refreshUserProfile();
            fetchDashboardData();
          }}
        />
      )}

    </div>
  );
}

export default FintechDashboard;
