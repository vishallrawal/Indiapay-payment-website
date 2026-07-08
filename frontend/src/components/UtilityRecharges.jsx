import React, { useState } from 'react';
import { 
  PhoneCall, 
  Zap, 
  Tv, 
  Smartphone, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

import UPIPaymentModal from './UPIPaymentModal.jsx';

const MOBILE_PLANS = [
  { id: 'PL-JIO-299', price: 299, desc: '1.5 GB/day Data + Unlimited P2P calls', validity: '28 Days' },
  { id: 'PL-Airtel-749', price: 749, desc: '2 GB/day High speed Data + Amazon Prime', validity: '84 Days' },
  { id: 'PL-VI-2999', price: 2999, desc: '2.5 GB/day Data + Disney Hotstar bundle', validity: '365 Days' }
];

function UtilityRecharges({ token, user, refreshUserProfile }) {
  const [activeTab, setActiveTab] = useState('mobile'); // mobile, electricity, dth
  
  // Mobile recharge form states
  const [phone, setPhone] = useState('9876543210');
  const [operator, setOperator] = useState('Reliance Jio');
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Electricity form states
  const [consumerNo, setConsumerNo] = useState('100295813');
  const [board, setBoard] = useState('BSES Rajdhani Power');
  const [billAmount, setBillAmount] = useState(1850);

  // DTH states
  const [dthId, setDthId] = useState('70029105');
  const [dthProvider, setDthProvider] = useState('Tata Play (DTH)');
  const [dthAmount, setDthAmount] = useState(350);

  // Modal triggers
  const [checkoutData, setCheckoutData] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10 || isNaN(phone)) {
      return alert('Enter a valid 10-digit mobile number.');
    }
    if (!selectedPlan) return alert('Please select a recharge plan.');

    setCheckoutData({
      amount: selectedPlan.price,
      serviceType: 'mobile_recharge',
      details: {
        phoneNumber: phone,
        operator,
        planId: selectedPlan.id,
        desc: selectedPlan.desc
      }
    });
  };

  const handleElectricitySubmit = (e) => {
    e.preventDefault();
    if (!consumerNo) return alert('Enter consumer number.');
    
    setCheckoutData({
      amount: billAmount,
      serviceType: 'electricity_bill',
      details: {
        consumerNumber: consumerNo,
        utilityBoard: board,
        desc: 'Electricity billing settle'
      }
    });
  };

  const handleDthSubmit = (e) => {
    e.preventDefault();
    if (!dthId) return alert('Enter subscriber ID.');
    
    setCheckoutData({
      amount: dthAmount,
      serviceType: 'dth_recharge',
      details: {
        subscriberId: dthId,
        provider: dthProvider,
        desc: 'DTH subscription recharge'
      }
    });
  };

  const handleSettleSuccess = (resData, gatewayUsed) => {
    setSuccessBooking({
      ...resData.booking,
      gatewayUsed,
      rewardWon: resData.rewardWon,
      rewardMessage: resData.rewardMessage
    });
    setCheckoutData(null);
    setSelectedPlan(null);
    refreshUserProfile();
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      
      {/* Tab selectors */}
      <div className="glass-panel rounded-3xl p-4 border border-slate-850 flex items-center justify-center gap-3 shadow-lg">
        {[
          { id: 'mobile', label: 'Mobile Recharge', icon: PhoneCall },
          { id: 'electricity', label: 'Electricity Bill', icon: Zap },
          { id: 'dth', label: 'DTH Recharge', icon: Tv }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSuccessBooking(null); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Success banner */}
      {successBooking && (
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4 max-w-xl mx-auto shadow-xl animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-bold text-slate-200 text-sm">Payment Completed Successfully!</h3>
            <p className="text-xs text-slate-400">Your recharge invoice has been settled and credited instantly.</p>
          </div>

          <div className="border border-slate-800 bg-[#0c101d]/60 rounded-2xl p-4 text-left text-[10.5px] space-y-2 font-mono text-slate-400 max-w-md mx-auto leading-relaxed">
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span>TRANSACTION ID:</span>
              <strong className="text-slate-200">{successBooking.id}</strong>
            </div>
            <div className="flex justify-between">
              <span>SERVICE TYPE:</span>
              <strong className="text-indigo-400 uppercase font-bold">{successBooking.serviceType.replace('_', ' ')}</strong>
            </div>
            <div className="flex justify-between">
              <span>DESCRIPTION:</span>
              <strong className="text-slate-350">{successBooking.details?.desc || 'Utility bill settle'}</strong>
            </div>
            <div className="flex justify-between">
              <span>AMOUNT CHARGED:</span>
              <strong className="text-emerald-400">₹{successBooking.amount}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-800/40 pt-2 text-[9px] text-slate-500 font-mono">
              <span>UPI BANKING:</span>
              <span>{successBooking.gatewayUsed.toUpperCase()}</span>
            </div>
          </div>

          {successBooking.rewardWon && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center space-y-1.5 max-w-md mx-auto animate-scaleUp">
              <span className="text-xl block">🎁</span>
              <h4 className="text-[11px] font-bold text-red-500 font-heading">{successBooking.rewardMessage}</h4>
              <p className="text-[9.5px] text-slate-400 leading-relaxed">A cashback reward scratch card has been added to your profile! Go to the Rewards tab to claim your cashback.</p>
            </div>
          )}

          <button
            onClick={() => setSuccessBooking(null)}
            className="py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-500/10"
          >
            Settle Another Bill
          </button>
        </div>
      )}

      {/* Forms inputs */}
      {!successBooking && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Side (5 cols) */}
          <div className="lg:col-span-5">
            {activeTab === 'mobile' && (
              <form onSubmit={handleMobileSubmit} className="glass-panel rounded-3xl p-6 border border-slate-850 space-y-4 shadow-lg">
                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Mobile Recharge</h3>
                  <p className="text-[10px] text-slate-500">Provide details to query operator prepaid vouchers.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Mobile Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">+91</span>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Carrier Operator</label>
                  <select 
                    value={operator} 
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  >
                    <option>Reliance Jio</option>
                    <option>Bharti Airtel</option>
                    <option>Vodafone Idea (Vi)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!selectedPlan}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  Pay ₹{selectedPlan ? selectedPlan.price : '0'}
                </button>
              </form>
            )}

            {activeTab === 'electricity' && (
              <form onSubmit={handleElectricitySubmit} className="glass-panel rounded-3xl p-6 border border-slate-850 space-y-4 shadow-lg">
                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Electricity Bill</h3>
                  <p className="text-[10px] text-slate-500">Link your electricity consumer account to clear invoices.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Consumer Account Number</label>
                  <input
                    type="text"
                    required
                    value={consumerNo}
                    onChange={(e) => setConsumerNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Electricity Utility Board</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-medium"
                  >
                    <option>BSES Rajdhani Power Ltd.</option>
                    <option>Tata Power Delhi Distribution</option>
                    <option>MSEB (Maharashtra State)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center bg-[#0b0f19] p-3 rounded-xl border border-slate-850 text-xs text-slate-400">
                  <span>Pending Invoice Amount:</span>
                  <strong className="text-amber-500 font-heading text-sm">₹{billAmount}</strong>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md"
                >
                  Pay Electricity Invoice
                </button>
              </form>
            )}

            {activeTab === 'dth' && (
              <form onSubmit={handleDthSubmit} className="glass-panel rounded-3xl p-6 border border-slate-850 space-y-4 shadow-lg">
                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">DTH Recharge</h3>
                  <p className="text-[10px] text-slate-500">Provide subscriber credentials to topup TV vouchers.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Subscriber Card ID</label>
                  <input
                    type="text"
                    required
                    value={dthId}
                    onChange={(e) => setDthId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">DTH Provider</label>
                  <select
                    value={dthProvider}
                    onChange={(e) => setDthProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  >
                    <option>Tata Play (DTH)</option>
                    <option>Airtel Digital TV</option>
                    <option>Dish TV</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Topup Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={dthAmount}
                    onChange={(e) => setDthAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md"
                >
                  Pay DTH Vouchers
                </button>
              </form>
            )}
          </div>

          {/* Right Panel: Plans selection list for Mobile only (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">
              {activeTab === 'mobile' ? 'Choose Mobile Tariff Plan' : 'Billing Explainer notes'}
            </h4>

            {activeTab === 'mobile' ? (
              <div className="space-y-3.5">
                {MOBILE_PLANS.map(plan => {
                  const isChecked = selectedPlan?.id === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full p-4.5 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all cursor-pointer shadow-md ${
                        isChecked 
                          ? 'bg-red-500/15 border-red-500 ring-2 ring-red-500/25' 
                          : 'border-red-500/15 bg-red-500/5 hover:bg-red-500/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                            isChecked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {plan.validity} VALIDITY
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">Ref: {plan.id}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed pt-0.5">{plan.desc}</p>
                      </div>

                      <strong className="text-emerald-400 font-heading text-sm shrink-0">₹{plan.price}</strong>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-6 border border-slate-850 text-[10.5px] text-slate-400 space-y-4 leading-relaxed font-mono">
                <p>
                  Utility payments processed via IndiaPay Go are routed through the secure Payment Orchestration network. The system evaluates gateways dynamically:
                </p>
                <div className="space-y-2 text-[10px] text-slate-500 border-t border-slate-850 pt-3">
                  <div>• Electricity invoices are cleared within 24 hours with zero processing overhead.</div>
                  <div>• DTH topups credits are dispatched within 60 seconds to Tata Play / Dish TV servers.</div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Settle Checkout modal overlay */}
      {checkoutData && (
        <UPIPaymentModal 
          amount={checkoutData.amount}
          serviceType={checkoutData.serviceType}
          details={checkoutData.details}
          token={token}
          user={user}
          onSettleSuccess={handleSettleSuccess}
          onCancel={() => setCheckoutData(null)}
        />
      )}

    </div>
  );
}

export default UtilityRecharges;
