import React, { useState } from 'react';
import { 
  Loader2, 
  Check, 
  X, 
  ShieldCheck, 
  ChevronDown,
  Delete,
  CreditCard,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';

import { API_BASE } from '../config.js';

function UPIPaymentModal({ amount, serviceType, details, token, user, onSettleSuccess, onCancel }) {
  const [paymentStep, setPaymentStep] = useState('select_method'); // select_method, upi_pin, card_input, emi_select, processing, success
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // UPI states
  const [selectedBank, setSelectedBank] = useState(user?.linkedBanks?.[0]?.bankName || 'HDFC Bank');
  const [isBankOpen, setIsBankOpen] = useState(false);

  // Card states (Debit/Credit)
  const [cardType, setCardType] = useState('Debit Card'); // Debit Card, Credit Card
  const [cardNumber, setCardNumber] = useState(user?.cardNumber || '4532 8821 9012 3456');
  const [cardExpiry, setCardExpiry] = useState(user?.cardExpiry || '12/30');
  const [cardCvv, setCardCvv] = useState(user?.cardCvv || '321');

  // EMI states
  const [selectedEmiPlan, setSelectedEmiPlan] = useState('3_months'); // 3_months, 6_months, 12_months

  const emiPlans = {
    '3_months': { rate: '12% p.a.', factor: 1.03, term: 3 },
    '6_months': { rate: '14% p.a.', factor: 1.07, term: 6 },
    '12_months': { rate: '15% p.a.', factor: 1.15, term: 12 }
  };

  const handleKeyClick = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleProcessPayment = async (gatewayName) => {
    setPaymentStep('processing');
    setErrorMsg('');

    try {
      // Simulate bank network latency (1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await fetch(`${API_BASE}/api/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceType,
          details,
          amount,
          gatewayUsed: gatewayName
        })
      });
      const data = await res.json();

      if (data.success) {
        setPaymentStep('success');
        setTimeout(() => {
          onSettleSuccess(data, gatewayName);
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Transaction declined by gateway.');
        setPaymentStep('select_method');
      }
    } catch (err) {
      setErrorMsg('Connection to payment gateway timed out.');
      setPaymentStep('select_method');
    }
  };

  const handleUPISubmit = () => {
    const activeBank = user?.linkedBanks?.find(b => b.bankName === selectedBank);
    const expectedPin = activeBank?.upiPin || user?.upiPin || '1234';

    if (pin.length < 4) {
      return setErrorMsg('Please enter a 4-digit or 6-digit UPI PIN.');
    }

    if (pin !== expectedPin) {
      setPin('');
      return setErrorMsg(`Incorrect UPI PIN for ${selectedBank}. Please try again.`);
    }

    handleProcessPayment(`UPI (${selectedBank})`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#04060b]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between h-[520px] transition-all duration-300">
        
        {/* Header Block */}
        <div className="h-14 border-b border-slate-850 px-6 bg-[#0c101d]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase">SECURE PAYMENT ORCHESTRATOR</span>
          </div>
          <button 
            onClick={onCancel}
            className="p-1 rounded-lg border border-slate-850 text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Content step panels */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
          
          {/* STEP 1: Select payment method */}
          {paymentStep === 'select_method' && (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="text-center space-y-1">
                <h3 className="font-heading font-bold text-slate-200 text-sm">Choose Payment Method</h3>
                <p className="text-[10px] text-slate-500">Order Amount: <strong className="text-blue-500">₹{amount.toLocaleString('en-IN')}</strong></p>
                {errorMsg && <p className="text-[10px] text-red-500 font-bold mt-1">{errorMsg}</p>}
              </div>

              {/* Method choice lists */}
              <div className="space-y-2.5 my-2">
                
                {/* 1. UPI / Bank account choice */}
                <button
                  type="button"
                  onClick={() => setPaymentStep('upi_pin')}
                  className="w-full p-3.5 rounded-2xl bg-[#090e1f] border border-slate-850 hover:border-blue-500 text-left flex items-center justify-between group cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-200 block group-hover:text-blue-400">Net Banking / UPI</strong>
                      <span className="text-[8px] text-slate-500 uppercase font-mono">Pay via Linked {selectedBank}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold">➔</span>
                </button>

                {/* 2. Debit card */}
                <button
                  type="button"
                  onClick={() => { setCardType('Debit Card'); setPaymentStep('card_input'); }}
                  className="w-full p-3.5 rounded-2xl bg-[#090e1f] border border-slate-850 hover:border-blue-500 text-left flex items-center justify-between group cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-200 block group-hover:text-blue-400">Debit Card</strong>
                      <span className="text-[8px] text-slate-500 uppercase font-mono">RuPay, Visa, MasterCard</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold">➔</span>
                </button>

                {/* 3. Credit Card */}
                <button
                  type="button"
                  onClick={() => { setCardType('Credit Card'); setPaymentStep('card_input'); }}
                  className="w-full p-3.5 rounded-2xl bg-[#090e1f] border border-slate-850 hover:border-blue-500 text-left flex items-center justify-between group cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-200 block group-hover:text-blue-400">Credit Card</strong>
                      <span className="text-[8px] text-slate-500 uppercase font-mono">Interest free for 45 days</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold">➔</span>
                </button>

                {/* 4. EMI Installments */}
                <button
                  type="button"
                  onClick={() => setPaymentStep('emi_select')}
                  className="w-full p-3.5 rounded-2xl bg-[#090e1f] border border-slate-850 hover:border-blue-500 text-left flex items-center justify-between group cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-200 block group-hover:text-blue-400">Easy Monthly EMIs</strong>
                      <span className="text-[8px] text-slate-500 uppercase font-mono">HDFC, SBI, ICICI Partners</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold">➔</span>
                </button>

              </div>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 rounded-xl bg-red-650 hover:bg-red-500 text-xs font-bold text-white transition-all cursor-pointer text-center"
              >
                Cancel Checkout
              </button>
            </div>
          )}

          {/* STEP 2: UPI Keypad input */}
          {paymentStep === 'upi_pin' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Payee Info Banner */}
              <div className="flex justify-between items-center bg-[#090e1f] border border-indigo-950/40 rounded-2xl p-4">
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-widest font-mono">PAYING SECURE MERCHANT</span>
                  <h4 className="text-xs font-bold text-blue-450 capitalize">{serviceType.replace('_', ' ')} Checkout</h4>
                  <span className="text-[9px] text-slate-400 truncate block max-w-[150px] mt-0.5">{details.movieTitle || details.carrierName || 'Utility billing'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold font-mono">Amount</span>
                  <strong className="text-base font-heading font-extrabold text-slate-200">₹{amount.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Enter PIN Slots */}
              <div className="text-center space-y-3 py-1">
                <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                  ENTER {user?.upiPin?.length || 4}-DIGIT UPI PIN
                </span>
                
                {/* Dots wrapper */}
                <div className="flex items-center justify-center gap-6 py-1">
                  {Array.from({ length: (user?.upiPin?.length || 4) }).map((_, idx) => {
                    const filled = pin.length > idx;
                    return (
                      <div 
                        key={idx} 
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          filled ? 'bg-blue-500 border-blue-500 scale-110 shadow-md shadow-blue-500/20' : 'border-indigo-950/60 bg-[#090e1f]'
                        }`}
                      ></div>
                    );
                  })}
                </div>

                {errorMsg && (
                  <p className="text-[10px] text-red-500 font-semibold px-4 animate-shake leading-relaxed">{errorMsg}</p>
                )}
              </div>

              {/* Bottom Bank selector and controls */}
              <div className="bg-[#090e1f] rounded-2xl p-3 border border-indigo-950/30 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[7.5px] text-slate-500 block uppercase font-mono">Paying From</span>
                  <strong className="text-slate-350 text-[10.5px]">{selectedBank}</strong>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('select_method')}
                    className="py-1 px-3 rounded-lg bg-red-650 hover:bg-red-500 text-[10px] font-bold text-white transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleUPISubmit}
                    className="py-1 px-4.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white transition-colors cursor-pointer"
                  >
                    Confirm PIN
                  </button>
                </div>
              </div>

              {/* UPI Numerical Keypad block */}
              <div className="grid grid-cols-3 gap-2 bg-[#090e1f]/35 p-3 rounded-2xl border border-indigo-950/15">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyClick(num.toString())}
                    className="py-2.5 text-center text-sm font-extrabold text-slate-350 hover:bg-[#090e1f] rounded-xl transition-colors cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-2.5 flex items-center justify-center text-slate-500 hover:text-red-400 cursor-pointer"
                >
                  <Delete className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick('0')}
                  className="py-2.5 text-center text-sm font-extrabold text-slate-350 hover:bg-[#090e1f] rounded-xl transition-colors cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleUPISubmit}
                  className="py-2.5 flex items-center justify-center text-blue-500 hover:text-blue-400 font-extrabold cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: Card Input fields */}
          {paymentStep === 'card_input' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="text-center space-y-1">
                <h3 className="font-heading font-bold text-slate-200 text-sm">Enter {cardType} Details</h3>
                <p className="text-[10px] text-slate-500">Payable amount: <strong className="text-blue-500">₹{amount.toLocaleString()}</strong></p>
                {errorMsg && <p className="text-[10px] text-red-500 font-bold">{errorMsg}</p>}
              </div>

              {/* Fields */}
              <div className="space-y-3 bg-[#090e1f]/60 p-4.5 rounded-2xl border border-slate-850/80">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-400">CVV</label>
                    <input
                      type="password"
                      maxLength={3}
                      required
                      placeholder="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentStep('select_method')}
                  className="flex-1 py-2.5 rounded-xl bg-red-650 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessPayment(`${cardType} (Visa Platinum)`)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Pay ₹{amount.toLocaleString()}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: EMI Plan options */}
          {paymentStep === 'emi_select' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="text-center space-y-1">
                <h3 className="font-heading font-bold text-slate-200 text-sm">Choose EMI Plan</h3>
                <p className="text-[10px] text-slate-500">Principal Amount: <strong className="text-blue-500">₹{amount.toLocaleString()}</strong></p>
              </div>

              {/* EMI plan options */}
              <div className="space-y-2.5">
                {Object.entries(emiPlans).map(([key, plan]) => {
                  const monthlyPayment = Math.round((amount * plan.factor) / plan.term);
                  const isChecked = selectedEmiPlan === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedEmiPlan(key)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                        isChecked ? 'bg-blue-600/10 border-blue-500' : 'bg-[#090e1f] border-slate-850'
                      }`}
                    >
                      <div>
                        <strong className="text-xs font-bold text-slate-200 block">{plan.term} Months Installments</strong>
                        <span className="text-[9px] text-slate-500 font-mono">Interest Rate: {plan.rate}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-xs font-extrabold text-blue-500">₹{monthlyPayment}/mo</strong>
                        <span className="text-[8px] text-slate-600 block font-mono">Total: ₹{Math.round(amount * plan.factor)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentStep('select_method')}
                  className="flex-1 py-2.5 rounded-xl bg-red-650 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessPayment(`EMI (${emiPlans[selectedEmiPlan].term} Months)`)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Authorize EMI
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Processing Animation */}
          {paymentStep === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <div>
                <strong className="text-slate-200 text-xs block">Securing Transaction...</strong>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">Contacting HDFC/SBI Secure Gateway Nodes</span>
              </div>
            </div>
          )}

          {/* STEP 6: Success Checkmark overlay */}
          {paymentStep === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
                <Check className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <strong className="text-emerald-400 text-xs block font-bold uppercase tracking-widest font-mono">Transaction Settled Successfully</strong>
                <span className="text-[9px] text-slate-500 block mt-1">Bookings confirmed and ledger written.</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default UPIPaymentModal;
