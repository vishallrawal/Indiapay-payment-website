import React, { useState, useEffect, useRef } from 'react';
import { 
  Gift, 
  Sparkles, 
  Trophy, 
  HelpCircle, 
  X, 
  Loader2,
  CheckCircle
} from 'lucide-react';

import { API_BASE } from '../config.js';

function RewardsCenter({ token, user, refreshUserProfile }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Scratch modal state
  const [activeCard, setActiveCard] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);

  const fetchCards = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/rewards`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.scratchCards || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Claim Scratch card cashback instantly on click
  const handleCardClick = async (card) => {
    setActiveCard(card);
    setClaiming(true);
    setClaimedReward(null);
    try {
      const res = await fetch(`${API_BASE}/api/rewards/scratch/${card.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClaimedReward(data.card);
        refreshUserProfile();
        fetchCards();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  // Sum total cashbacks
  const totalCashback = (cards || [])
    .filter(c => c && c.status === 'scratched')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Rewards Stats Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-850 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-yellow-500/10 blur-2xl"></div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 glow-indigo">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-slate-100 text-sm">Rewards & Cashbacks</h3>
            <span className="text-[10px] text-slate-500 block">Earn scratch cards on sending/settling payments.</span>
          </div>
        </div>

        <div className="text-center md:text-right shrink-0">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Total Won</span>
          <h2 className="text-3xl font-bold font-heading text-yellow-500 mt-1">₹{(totalCashback || 0).toLocaleString('en-IN')}</h2>
          <span className="text-[9px] text-slate-500 font-mono">Credited to linked bank</span>
        </div>
      </div>

      {/* 2. Scratch Cards Grid */}
      <div className="space-y-4">
        <h4 className="font-heading font-semibold text-slate-200 text-sm">My Scratch Cards</h4>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
            Syncing reward shelf...
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2 border border-dashed border-slate-850 rounded-2xl">
            <Gift className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-xs">No scratch cards won yet.</p>
            <p className="text-[10px] text-slate-600">Send money P2P to friends or settle split bills to earn cards.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {cards.map(card => {
              const isScratched = card.status === 'scratched';

              return (
                <div key={card.id} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-slate-850/80">
                  
                  {isScratched ? (
                    // Scratched state (White background)
                    <div className="w-full h-full bg-white border border-slate-200 flex flex-col justify-between p-4 text-center shadow-inner">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mx-auto">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">CASHBACK</span>
                        <strong className="text-emerald-600 font-heading font-extrabold text-lg block">₹{card.amount}</strong>
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono">Claimed</span>
                    </div>
                  ) : (
                    // Unscratched state (Red background)
                    <button
                      onClick={() => handleCardClick(card)}
                      className="w-full h-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-700 flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:scale-[1.03] hover:border-red-400/50 transition-all group border border-red-500/20"
                    >
                      <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse mb-2 group-hover:rotate-12 transition-transform" />
                      <span className="text-[10px] font-bold text-yellow-200 font-mono block">₹ UP TO ₹150</span>
                      <span className="text-[8px] text-red-200 mt-1 uppercase font-bold tracking-widest">TAP TO SCRATCH</span>
                    </button>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scratch Modal Card canvas */}
      {activeCard && (
        <div className="fixed inset-0 z-50 bg-[#04060b]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl relative border border-slate-850 flex flex-col items-center text-center space-y-5">
            
            {/* Modal close */}
            {!claiming && (
              <button 
                onClick={() => setActiveCard(null)} 
                className="absolute top-4 right-4 p-1 rounded-lg border border-slate-850 text-slate-500 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div>
              <h3 className="font-heading font-bold text-slate-100 text-sm">IndiaPay Reward Card</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Instant scratch and claim activated</p>
            </div>

            {/* Canvas Container */}
            <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-inner border border-slate-200 bg-white flex flex-col justify-center items-center p-6">
              {claiming ? (
                <div className="space-y-3 text-center text-slate-600">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
                  <p className="text-xs font-bold font-mono tracking-wider animate-pulse">SCRATCHING CARD...</p>
                </div>
              ) : (
                /* Revealed Cashback Content (White Background) */
                <div className="space-y-2 animate-scaleUp z-0 text-slate-800 text-center">
                  <Sparkles className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">CONGRATULATIONS!</span>
                    <h2 className="text-4xl font-extrabold text-emerald-600 font-heading mt-1">
                      ₹{claimedReward ? claimedReward.amount : (activeCard.amount || 0)}
                    </h2>
                    <span className="text-[9px] text-slate-500 block mt-1">Cashback Credited Instantly</span>
                  </div>
                </div>
              )}
            </div>

            {/* Scratch progress state message */}
            {claiming ? (
              <div className="text-[11px] text-slate-400 font-mono animate-pulse">
                Verifying secure reward ledger checkout...
              </div>
            ) : (
              <div className="space-y-3 w-full">
                <p className="text-xs text-slate-350 font-medium">🎉 Reward claimed! ₹{claimedReward ? claimedReward.amount : (activeCard.amount || 0)} added to your balance.</p>
                <button
                  onClick={() => setActiveCard(null)}
                  className="w-full py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-500/10 hover:scale-[1.01]"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default RewardsCenter;
