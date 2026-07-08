import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { 
  Loader2, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

import { API_BASE, STRIPE_KEY } from '../config.js';

// Init Stripe conditionally
let stripePromise = null;
if (STRIPE_KEY) {
  stripePromise = loadStripe(STRIPE_KEY);
}

// ----------------------------------------------------
// Sub-Component: Stripe Card Payment Elements
// ----------------------------------------------------
const PublicStripeForm = ({ clientSecret, amount, beneficiary, payerName, onSuccess, onCancel }) => {
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
        onSuccess();
      } else {
        setError(`Payment declined with status: ${paymentIntent.status}`);
        setLoading(false);
      }
    } catch (err) {
      setError('Stripe connection refused.');
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

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Debit/Credit Card Details</label>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <CardElement options={{
            style: {
              base: {
                color: '#f8fafc',
                fontSize: '13px',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': { color: '#64748b' }
              },
              invalid: { color: '#ef4444' }
            }
          }} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Confirm Payment ₹{amount.toLocaleString('en-IN')}
      </button>
    </form>
  );
};

// ----------------------------------------------------
// Sub-Component: Demo Sandbox Payment elements
// ----------------------------------------------------
const PublicDemoForm = ({ amount, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc) {
      alert("Please fill card details.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onConfirm();
    }, 1800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] rounded-xl leading-relaxed flex items-start gap-2">
        <HelpCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
        <span>
          <strong>Sandbox Demo Checkout:</strong> Real Stripe gateway keys are missing. You can enter any mock card number (e.g. `4242 4242...`) to pay this invoice immediately.
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Settle Payment ₹{amount.toLocaleString('en-IN')}
      </button>
    </form>
  );
};

// ----------------------------------------------------
// Main Component: PublicPayPage
// ----------------------------------------------------
function PublicPayPage({ linkId }) {
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Checkout States
  const [step, setStep] = useState('payer_info'); // payer_info, checkout, success
  const [payerName, setPayerName] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Stripe details returned by backend
  const [intentData, setIntentData] = useState(null);

  const fetchLinkDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/links/public/${linkId}`);
      const data = await res.json();
      if (data.success) {
        setLink(data.link);
      } else {
        setError(data.error || 'Payment link has expired or is invalid.');
      }
    } catch (err) {
      setError('Connection failure: could not connect to payment gateway.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkDetails();
  }, [linkId]);

  const handlePayerSubmit = async (e) => {
    e.preventDefault();
    if (!payerName.trim()) return setPaymentError('Please enter your name.');

    setLoadingPayment(true);
    setPaymentError('');

    try {
      const res = await fetch(`${API_BASE}/api/links/public/${linkId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payerName })
      });
      const data = await res.json();

      if (data.success) {
        setIntentData(data);
        if (data.mode === 'demo') {
          // Bypassed checkout elements in demo, directly show success
          setStep('success');
        } else {
          setStep('checkout');
        }
      } else {
        setPaymentError(data.error || 'Failed to initialize checkout.');
      }
    } catch (err) {
      setPaymentError('Connection failure: checkout server is down.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleCheckoutSuccess = () => {
    setStep('success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gpay-main-bg">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
          <span className="text-xs text-slate-500 font-mono">Loading Payment Request...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen gpay-main-bg px-4">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-red-500/10 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
          <h2 className="font-heading font-bold text-lg text-slate-200">Deactivated or Invalid</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen gpay-main-bg px-4 py-8">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        
        {/* Accent Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl"></div>

        {/* Brand Node */}
        <div className="flex items-center justify-center gap-2 mb-6 border-b border-slate-800/40 pb-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">A</div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">AuraPay Gateway</span>
        </div>

        {/* STEP 1: Payer Identity */}
        {step === 'payer_info' && (
          <div className="space-y-6">
            
            {/* Request Summary Box */}
            <div className="bg-[#0c101d]/60 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PAYMENT REQUEST</span>
              <div className="space-y-1">
                <span className="text-xs text-slate-400">Paying Beneficiary</span>
                <h4 className="text-sm font-heading font-bold text-indigo-400">{link.creatorName}</h4>
              </div>
              <div className="border-t border-slate-800/40 pt-2.5 space-y-0.5">
                <span className="text-2xl font-bold font-heading text-emerald-400">₹{link.amount.toLocaleString('en-IN')}</span>
                <p className="text-[10px] text-slate-500 italic">Description: {link.description}</p>
              </div>
            </div>

            {/* Payer Info Form */}
            <form onSubmit={handlePayerSubmit} className="space-y-4">
              {paymentError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  ⚠️ {paymentError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Your Name (Payer)</label>
                <input
                  type="text"
                  placeholder="e.g. Amit Sen"
                  required
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPayment}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 disabled:opacity-50"
              >
                {loadingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                Proceed to Checkout Sheet
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Checkout card payment */}
        {step === 'checkout' && intentData && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">Invoicing: {link.id}</span>
              <h3 className="text-lg font-heading font-bold text-slate-200">Submit Payment Card</h3>
              <p className="text-xs text-slate-400">Receiver: <strong className="text-slate-300">{link.creatorName}</strong></p>
            </div>

            {intentData.mode === 'stripe' && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret: intentData.clientSecret }}>
                <PublicStripeForm 
                  clientSecret={intentData.clientSecret}
                  amount={link.amount}
                  beneficiary={link.creatorName}
                  payerName={payerName}
                  onSuccess={handleCheckoutSuccess}
                  onCancel={() => setStep('payer_info')}
                />
              </Elements>
            ) : (
              <PublicDemoForm 
                amount={link.amount}
                onConfirm={handleCheckoutSuccess}
              />
            )}
          </div>
        )}

        {/* STEP 3: Checkout success */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto glow-emerald">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-heading font-bold text-lg text-slate-200">Settle Complete!</h2>
              <p className="text-xs text-slate-400">
                ₹{link.amount.toLocaleString('en-IN')} successfully settled to **{link.creatorName}**'s wallet.
              </p>
            </div>

            <div className="border-t border-slate-800/40 pt-4 flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>AuraPay Core Audits Completed</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PublicPayPage;
