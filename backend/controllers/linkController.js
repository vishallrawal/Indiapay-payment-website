import Stripe from 'stripe';
import { db } from '../config/db.js';

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// 1. Create Payment Link
export const createPaymentLink = async (req, res) => {
  const { amount, description } = req.body;
  const creator = req.user;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Please enter a valid amount for the payment link.' });
  }

  const linkId = 'LNK-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  try {
    const newLink = await db.create('links', {
      id: linkId,
      creatorEmail: creator.email,
      amount: Number(amount),
      description: description || `Payment request created by ${creator.name}`,
      isActive: true
    });

    res.status(201).json({ success: true, link: newLink });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Retrieve My Links
export const getMyLinks = async (req, res) => {
  const user = req.user;

  try {
    const links = await db.find('links');
    const myLinks = links.filter(l => l.creatorEmail.toLowerCase() === user.email.toLowerCase());
    
    // Sort newest first
    const sortedLinks = [...myLinks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, links: sortedLinks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Public: Get Payment Link Details (No auth required)
export const getLinkDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const link = await db.findOne('links', { id });
    if (!link) {
      return res.status(404).json({ success: false, error: 'Payment link not found.' });
    }

    if (!link.isActive) {
      return res.status(400).json({ success: false, error: 'This payment link has been deactivated.' });
    }

    // Find creator's name to display on paypage
    const creator = await db.findOne('users', { email: link.creatorEmail });
    const creatorName = creator ? creator.name : 'IndiaPay Merchant';

    res.status(200).json({
      success: true,
      link: {
        id: link.id,
        amount: link.amount,
        description: link.description,
        creatorName,
        creatorEmail: link.creatorEmail
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Public: Complete Payment via Payment Link (No auth required)
export const payPaymentLink = async (req, res) => {
  const { id } = req.params;
  const { payerName, forceMode } = req.body; // forceMode allows simulated checkouts

  try {
    const link = await db.findOne('links', { id });
    if (!link || !link.isActive) {
      return res.status(404).json({ success: false, error: 'Payment link is invalid or inactive.' });
    }

    const creator = await db.findOne('users', { email: link.creatorEmail });
    if (!creator) {
      return res.status(404).json({ success: false, error: 'Beneficiary account not found.' });
    }

    const txnId = 'TXN-LNK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // If Stripe is active and not bypassed by mock form, setup payment intent
    if (stripe && forceMode !== 'demo') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(link.amount * 100),
        currency: 'inr',
        metadata: {
          linkId: link.id,
          creatorEmail: link.creatorEmail,
          payerName: payerName || 'anonymous',
          transactionId: txnId
        }
      });

      // Log transaction as pending
      await db.create('transactions', {
        id: txnId,
        type: 'payment_link',
        senderEmail: `link_payer_${payerName || 'anon'}`,
        receiverEmail: link.creatorEmail,
        amount: link.amount,
        currency: 'INR',
        status: 'pending',
        gateway: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        description: `Payment via link ${link.id} from ${payerName || 'Anonymous'}`
      });

      return res.status(200).json({
        success: true,
        mode: 'stripe',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transactionId: txnId
      });
    }

    // FALLBACK DEMO ROUTING: Settle immediately
    // Credit creator's wallet
    const updatedCreator = await db.update('users', { id: creator.id }, {
      balance: Math.round((creator.balance + link.amount) * 100) / 100
    });

    // Create success transaction record
    const savedTxn = await db.create('transactions', {
      id: txnId,
      type: 'payment_link',
      senderEmail: `link_payer_${payerName || 'anon'}`,
      receiverEmail: link.creatorEmail,
      amount: link.amount,
      currency: 'INR',
      status: 'success',
      gateway: 'demo_fallback',
      description: `Payment via link ${link.id} from ${payerName || 'Anonymous'} (Demo Mode)`
    });

    res.status(200).json({
      success: true,
      mode: 'demo',
      transaction: savedTxn
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
