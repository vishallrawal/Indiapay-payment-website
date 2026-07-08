import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { 
  X, 
  Loader2, 
  CreditCard, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

import { API_BASE, STRIPE_KEY } from '../config.js';

// Load Stripe instance conditionally
let stripePromise = null;
if (STRIPE_KEY) {
  stripePromise = loadStripe(STRIPE_KEY);
}

// ----------------------------------------------------
// Sub-Component: Stripe Card Payment Form
// ----------------------------------------------------
const StripeCheckoutForm = ({ clientSecret, paymentIntentId, transactionId, token, amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm credit on backend
        const res = await fetch(`${API_BASE}/api/wallet/confirm-load`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ paymentIntentId, transactionId })
        });
        const data = await res.json();
        
        if (data.success) {
          onSuccess();
        } else {
          setError(data.error || 'Balance credit failed.');
          setLoading(false);
        }
      }
    } catch (err) {
      setError('Stripe connection failed.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Credit or Debit Card</label>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <CardElement options={{
            style: {
              base: {
                color: '#f8fafc',
                fontSize: '13px',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': {
                  color: '#64748b',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }} />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-400 text-xs font-semibold cursor-pointer disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Pay ₹{amount.toLocaleString()}
        </button>
      </div>
    </form>
  );
};

// ----------------------------------------------------
// Sub-Component: Demo Mode Payment Form (Fallback)
// ----------------------------------------------------
const DemoCheckoutForm = ({ amount, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc) {
      alert("Please fill card credentials.");
      return;
    }

    setLoading(true);
    // Simulate transaction latency
    setTimeout(() => {
      setLoading(false);
      onConfirm();
    }, 1800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] rounded-xl leading-relaxed flex items-start gap-2">
        <HelpCircle className="w-4 h-4 shrink-0 text-indigo-400" />
        <span>
          <strong>Sandbox Demo Active:</strong> Stripe keys are missing from `.env`. You can enter any mock card number (e.g. `4242 4242...`) to load money instantly for testing.
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Card Number</label>
          <input
            type="text"
            placeholder="4242 4242 4242 4242"
            required
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono tracking-widest text-slate-200 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Expiry</label>
            <input
              type="text"
              placeholder="MM/YY"
              required
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">CVC</label>
            <input
              type="password"
              placeholder="•••"
              required
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-400 text-xs font-semibold cursor-pointer disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Load ₹{amount.toLocaleString()}
        </button>
      </div>
    </form>
  );
};

// ----------------------------------------------------
// Main Component: LoadMoneyModal Container
// ----------------------------------------------------
function LoadMoneyModal({ token, onClose, refreshDashboard }) {
  const [step, setStep] = useState('amount'); // amount, checkout, success
  const [amount, setAmount] = useState('');
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState('');

  // Stripe details returned by backend
  const [intentData, setIntentData] = useState(null);

  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return setError('Please enter a valid amount.');
    }

    setLoadingIntent(true);

    try {
      const res = await fetch(`${API_BASE}/api/wallet/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numericAmount })
      });
      const data = await res.json();

      if (data.success) {
        setIntentData(data);
        setStep('checkout');
      } else {
        setError(data.error || 'Failed to initiate payment.');
      }
    } catch (err) {
      setError('Connection failure: backend is unreachable.');
    } finally {
      setLoadingIntent(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep('success');
    refreshDashboard();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#04060b]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-800">
        
        {/* Modal Close */}
        {step !== 'success' && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 hover:text-slate-200 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* STEP 1: Enter amount */}
        {step === 'amount' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="font-heading font-semibold text-slate-200">Load Wallet Balance</h3>
              <p className="text-xs text-slate-400">Add cash to your AuraPay P2P wallet instantly.</p>
            </div>

            <form onSubmit={handleInitiatePayment} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingIntent}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 disabled:opacity-50"
              >
                {loadingIntent && <Loader2 className="w-4 h-4 animate-spin" />}
                Initiate Secure Checkout
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Checkout / Payment Details */}
        {step === 'checkout' && intentData && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="font-heading font-semibold text-slate-200 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                Wallet Payment Sheet
              </h3>
              <p className="text-xs text-slate-400">Total charge: <strong className="text-slate-200">₹{Number(amount).toLocaleString()}</strong></p>
            </div>

            {/* Check if Stripe Key is active */}
            {intentData.mode === 'stripe' && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret: intentData.clientSecret }}>
                <StripeCheckoutForm 
                  clientSecret={intentData.clientSecret}
                  paymentIntentId={intentData.paymentIntentId}
                  transactionId={intentData.transactionId}
                  token={token}
                  amount={Number(amount)}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setStep('amount')}
                />
              </Elements>
            ) : (
              <DemoCheckoutForm 
                amount={Number(amount)}
                onConfirm={handlePaymentSuccess}
                onCancel={() => setStep('amount')}
              />
            )}
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto glow-emerald">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-lg text-slate-200">Wallet Settle Success!</h3>
              <p className="text-xs text-slate-400">₹{Number(amount).toLocaleString()} has been credited to your AuraPay balance.</p>
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

export default LoadMoneyModal;
