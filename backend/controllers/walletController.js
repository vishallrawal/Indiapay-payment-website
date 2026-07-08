import Stripe from 'stripe';
import { db } from '../config/db.js';

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe SDK initialized for AuraPay backend.');
} else {
  console.warn('WARNING: STRIPE_SECRET_KEY is missing in environmental variables. Backend will execute in Demo Fallback Mode.');
}

// 1. Initialize Balance Load
export const initiateLoadMoney = async (req, res) => {
  const { amount } = req.body; // amount in INR
  const user = req.user;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Please specify a valid numeric amount to load.' });
  }

  const transactionId = 'TXN-LD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  try {
    // If Stripe credentials are set, create a real Payment Intent
    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amounts in paise (sub-units for INR)
        currency: 'inr',
        metadata: {
          userId: user.id,
          email: user.email,
          transactionId
        }
      });

      // Save a pending transaction
      await db.create('transactions', {
        id: transactionId,
        type: 'load',
        senderEmail: 'card_checkout',
        receiverEmail: user.email,
        amount: Number(amount),
        currency: 'INR',
        status: 'pending',
        gateway: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        description: 'Loaded funds via card (Stripe Intent)'
      });

      return res.status(200).json({
        success: true,
        mode: 'stripe',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transactionId
      });
    }

    // FALLBACK DEMO MODE: Instantly complete the load
    console.log(`Demo Load: Automatically crediting ₹${amount} to user wallet.`);
    
    // Update user balance
    const updatedUser = await db.update('users', { id: user.id }, {
      balance: Math.round((user.balance + Number(amount)) * 100) / 100
    });

    // Create success transaction ledger
    const savedTxn = await db.create('transactions', {
      id: transactionId,
      type: 'load',
      senderEmail: 'card_checkout',
      receiverEmail: user.email,
      amount: Number(amount),
      currency: 'INR',
      status: 'success',
      gateway: 'demo_fallback',
      description: 'Loaded funds via Demo card checkout sheet'
    });

    res.status(200).json({
      success: true,
      mode: 'demo',
      user: { balance: updatedUser.balance },
      transaction: savedTxn
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Confirm Load (Stripe verification endpoint)
export const confirmLoadMoney = async (req, res) => {
  const { paymentIntentId, transactionId } = req.body;
  const user = req.user;

  if (!stripe) {
    return res.status(400).json({ success: false, error: 'Stripe is disabled. Demo mode requires no manual confirmations.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const tx = await db.findOne('transactions', { stripePaymentIntentId: paymentIntentId });
      
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Transaction record not found.' });
      }

      if (tx.status === 'success') {
        // Already processed
        return res.status(200).json({ success: true, message: 'Already credited.', balance: user.balance });
      }

      // Update Transaction status to success
      await db.update('transactions', { id: tx.id }, { status: 'success' });

      // Add to user balance
      const updatedUser = await db.update('users', { id: user.id }, {
        balance: Math.round((user.balance + tx.amount) * 100) / 100
      });

      return res.status(200).json({
        success: true,
        user: { balance: updatedUser.balance },
        message: 'Funds loaded and credited successfully.'
      });
    } else {
      await db.update('transactions', { stripePaymentIntentId: paymentIntentId }, { status: 'failed' });
      return res.status(400).json({ success: false, error: `Payment failed with status: ${paymentIntent.status}` });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. P2P Wallet Transfer
export const transferMoney = async (req, res) => {
  const { recipientEmail, amount, description } = req.body;
  const sender = req.user;

  if (!recipientEmail || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Recipient email and numeric transfer amount are required.' });
  }

  if (sender.email.toLowerCase() === recipientEmail.toLowerCase()) {
    return res.status(400).json({ success: false, error: 'Cannot transfer money to your own email address.' });
  }

  if (sender.balance < amount) {
    return res.status(400).json({ success: false, error: `Insufficient wallet balance. Available: ₹${sender.balance.toLocaleString()}` });
  }

  try {
    // Look up recipient
    const recipient = await db.findOne('users', { email: recipientEmail.toLowerCase() });
    if (!recipient) {
      return res.status(404).json({ success: false, error: `Recipient user with email [${recipientEmail}] not found on AuraPay.` });
    }

    // Generate reward scratch card automatically for the sender
    const cardId = 'SCR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const rewardAmt = Math.floor(Math.random() * 91) + 10; // random reward ₹10 - ₹100
    const cards = sender.scratchCards || [];
    cards.push({
      id: cardId,
      status: 'unscratched',
      amount: rewardAmt,
      createdAt: new Date()
    });

    // Atomic debit & credit operations
    const updatedSender = await db.update('users', { id: sender.id }, {
      balance: Math.round((sender.balance - Number(amount)) * 100) / 100,
      scratchCards: cards
    });

    const updatedRecipient = await db.update('users', { id: recipient.id }, {
      balance: Math.round((recipient.balance + Number(amount)) * 100) / 100
    });

    // Create Transfer Ledger Records
    const txnId = 'TXN-P2P-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const transaction = await db.create('transactions', {
      id: txnId,
      type: 'transfer',
      senderEmail: sender.email,
      receiverEmail: recipient.email,
      amount: Number(amount),
      currency: 'INR',
      status: 'success',
      gateway: 'wallet_p2p',
      description: description || `Wallet transfer to ${recipient.name}`
    });

    res.status(200).json({
      success: true,
      transaction,
      senderBalance: updatedSender.balance,
      rewardWon: true,
      rewardMessage: `Congratulations! You won an IndiaPay Scratch Card!`
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Get Transactions History
export const getTransactions = async (req, res) => {
  const user = req.user;

  try {
    const txns = await db.find('transactions');
    // Filter transactions involving this user (either as sender or receiver)
    const userTxns = txns.filter(t => 
      t.senderEmail.toLowerCase() === user.email.toLowerCase() ||
      t.receiverEmail.toLowerCase() === user.email.toLowerCase()
    );

    // Sort descending by date
    const sortedTxns = [...userTxns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, transactions: sortedTxns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. Link Bank Account
export const linkBankAccount = async (req, res) => {
  const { bankName, accountNumber } = req.body;
  const user = req.user;

  if (!bankName || !accountNumber) {
    return res.status(400).json({ success: false, error: 'Bank name and account number are required.' });
  }

  try {
    const userProfile = await db.findOne('users', { id: user.id });
    const banks = userProfile.linkedBanks || [];
    
    // Check if bank already linked
    const alreadyLinked = banks.some(b => b.bankName === bankName && b.accountNumber === accountNumber);
    if (alreadyLinked) {
      return res.status(400).json({ success: false, error: 'This bank account is already linked.' });
    }

    banks.push({
      bankName,
      accountNumber,
      isDefault: banks.length === 0
    });

    await db.update('users', { id: user.id }, { linkedBanks: banks });
    res.status(200).json({ success: true, linkedBanks: banks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. Get Linked Bank Accounts
export const getLinkedBanks = async (req, res) => {
  const user = req.user;
  try {
    const userProfile = await db.findOne('users', { id: user.id });
    res.status(200).json({ success: true, linkedBanks: userProfile.linkedBanks || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 7. Get Scratch Cards
export const getScratchCards = async (req, res) => {
  const user = req.user;
  try {
    const userProfile = await db.findOne('users', { id: user.id });
    res.status(200).json({ success: true, scratchCards: userProfile.scratchCards || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 8. Scratch Card (Claim Reward)
export const scratchCardReward = async (req, res) => {
  const { cardId } = req.params;
  const user = req.user;

  try {
    const userProfile = await db.findOne('users', { id: user.id });
    const cards = userProfile.scratchCards || [];
    
    const cardIndex = cards.findIndex(c => c.id === cardId && c.status === 'unscratched');
    if (cardIndex === -1) {
      return res.status(404).json({ success: false, error: 'Scratch card not found or already scratched.' });
    }

    const card = cards[cardIndex];
    card.status = 'scratched';

    // Credit balance
    const updatedUser = await db.update('users', { id: user.id }, {
      balance: Math.round((userProfile.balance + card.amount) * 100) / 100,
      scratchCards: cards
    });

    // Write reward credit transaction
    const txnId = 'TXN-RW-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await db.create('transactions', {
      id: txnId,
      type: 'reward_credit',
      senderEmail: 'aurapay_rewards',
      receiverEmail: user.email,
      amount: card.amount,
      currency: 'INR',
      status: 'success',
      gateway: 'rewards_engine',
      description: `GPay Scratch Card Cashback Winner [Ref: ${cardId}]`
    });

    res.status(200).json({ 
      success: true, 
      card, 
      balance: updatedUser.balance 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const injectTransaction = async (req, res) => {
  const { description, amount, type, gateway } = req.body;
  const user = req.user;

  if (!description || !amount || isNaN(amount)) {
    return res.status(400).json({ success: false, error: 'Description and numeric amount are required.' });
  }

  const transactionId = 'TXN-INJ-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  try {
    const savedTxn = await db.create('transactions', {
      id: transactionId,
      type: type || 'load',
      senderEmail: type === 'load' ? 'custom_inject' : user.email,
      receiverEmail: type === 'load' ? user.email : 'custom_inject',
      amount: Number(amount),
      currency: 'INR',
      status: 'success',
      gateway: gateway || 'custom_injected',
      description
    });

    res.status(200).json({
      success: true,
      transaction: savedTxn
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
