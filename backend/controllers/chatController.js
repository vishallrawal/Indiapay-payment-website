import { db } from '../config/db.js';
import { updateGroupSplitStatus } from './groupController.js';

// Helper to generate a scratch card reward on transactions
export const rewardUser = async (user) => {
  const cardId = 'SCR-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  // Random cashback between ₹5 and ₹150
  const cashbackAmount = Math.floor(Math.random() * 145) + 5;
  
  const userProfile = await db.findOne('users', { id: user.id });
  const cards = userProfile.scratchCards || [];
  cards.push({
    id: cardId,
    status: 'unscratched',
    amount: cashbackAmount
  });
  
  await db.update('users', { id: user.id }, { scratchCards: cards });
  return { earned: true, cardId, amount: cashbackAmount };
};

// 1. Get Chat History
export const getChatHistory = async (req, res) => {
  const { recipientEmail } = req.params;
  const user = req.user;

  if (!recipientEmail) {
    return res.status(400).json({ success: false, error: 'Recipient email is required.' });
  }

  try {
    const allMessages = await db.find('messages');
    
    // Filter messages between user and recipient
    const chatFeed = allMessages.filter(msg => 
      (msg.senderEmail.toLowerCase() === user.email.toLowerCase() && msg.receiverEmail.toLowerCase() === recipientEmail.toLowerCase()) ||
      (msg.senderEmail.toLowerCase() === recipientEmail.toLowerCase() && msg.receiverEmail.toLowerCase() === user.email.toLowerCase())
    );

    // Sort ascending by time
    const sortedFeed = [...chatFeed].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.status(200).json({ success: true, messages: sortedFeed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Send Text Message
export const sendChatMessage = async (req, res) => {
  const { receiverEmail, text } = req.body;
  const user = req.user;

  if (!receiverEmail || !text) {
    return res.status(400).json({ success: false, error: 'Receiver email and text message are required.' });
  }

  try {
    const msgId = 'MSG-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newMsg = await db.create('messages', {
      id: msgId,
      senderEmail: user.email,
      receiverEmail: receiverEmail.toLowerCase(),
      type: 'message',
      text,
      status: 'success'
    });

    res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Create Payment Request
export const createPaymentRequest = async (req, res) => {
  const { receiverEmail, amount, text } = req.body;
  const user = req.user;

  if (!receiverEmail || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Receiver email and numeric request amount are required.' });
  }

  try {
    const msgId = 'REQ-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newRequest = await db.create('messages', {
      id: msgId,
      senderEmail: user.email,
      receiverEmail: receiverEmail.toLowerCase(),
      type: 'payment_request',
      amount: Number(amount),
      text: text || 'Requested money',
      status: 'pending'
    });

    res.status(201).json({ success: true, message: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Settle / Pay Request bubble
export const settlePaymentRequest = async (req, res) => {
  const { messageId } = req.body;
  const payer = req.user; // Payer is the receiver of the original request

  try {
    const requestMsg = await db.findOne('messages', { id: messageId });
    if (!requestMsg) {
      return res.status(404).json({ success: false, error: 'Payment request not found.' });
    }

    if (requestMsg.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'This payment request is already completed or declined.' });
    }

    if (payer.balance < requestMsg.amount) {
      return res.status(400).json({ success: false, error: `Insufficient wallet balance to pay request. Available: ₹${payer.balance}` });
    }

    const beneficiary = await db.findOne('users', { email: requestMsg.senderEmail });
    if (!beneficiary) {
      return res.status(404).json({ success: false, error: 'Beneficiary user account not found.' });
    }

    // Process balances transfer
    const updatedPayer = await db.update('users', { id: payer.id }, {
      balance: Math.round((payer.balance - requestMsg.amount) * 100) / 100
    });

    const updatedBeneficiary = await db.update('users', { id: beneficiary.id }, {
      balance: Math.round((beneficiary.balance + requestMsg.amount) * 100) / 100
    });

    // Update Message status
    const updatedRequestMsg = await db.update('messages', { id: messageId }, { status: 'success' });

    // Update Group Split status if it was a split bill request
    await updateGroupSplitStatus(payer.email, beneficiary.email, requestMsg.amount);

    // Create transaction ledger
    const txnId = 'TXN-P2P-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await db.create('transactions', {
      id: txnId,
      type: 'transfer',
      senderEmail: payer.email,
      receiverEmail: beneficiary.email,
      amount: requestMsg.amount,
      currency: 'INR',
      status: 'success',
      gateway: 'wallet_p2p',
      description: `Settled request [${messageId}]`
    });

    // Reward check
    const rewardInfo = await rewardUser(payer);

    res.status(200).json({
      success: true,
      message: updatedRequestMsg,
      payerBalance: updatedPayer.balance,
      rewardInfo
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. Decline Request bubble
export const declinePaymentRequest = async (req, res) => {
  const { messageId } = req.body;

  try {
    const requestMsg = await db.findOne('messages', { id: messageId });
    if (!requestMsg) {
      return res.status(404).json({ success: false, error: 'Payment request not found.' });
    }

    if (requestMsg.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending requests can be declined.' });
    }

    // Update Message status to declined
    const updatedMsg = await db.update('messages', { id: messageId }, { status: 'declined' });

    res.status(200).json({ success: true, message: updatedMsg });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper: Get user contacts list (based on transactions/chat history)
export const getContacts = async (req, res) => {
  const user = req.user;

  try {
    // Collect all registered users
    const allUsers = await db.find('users');
    
    // Exclude current user
    const contacts = allUsers
      .filter(u => u.email.toLowerCase() !== user.email.toLowerCase())
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
      }));

    res.status(200).json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
