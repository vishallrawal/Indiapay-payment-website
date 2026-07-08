import express from 'express';
import { 
  registerUser, 
  loginUser, 
  authenticateToken, 
  getProfile,
  updateProfile 
} from '../controllers/userController.js';
import { 
  initiateLoadMoney, 
  confirmLoadMoney, 
  transferMoney, 
  getTransactions,
  linkBankAccount,
  getLinkedBanks,
  getScratchCards,
  scratchCardReward,
  injectTransaction
} from '../controllers/walletController.js';
import { 
  createPaymentLink, 
  getMyLinks, 
  getLinkDetails, 
  payPaymentLink 
} from '../controllers/linkController.js';
import {
  getContacts,
  getChatHistory,
  sendChatMessage,
  createPaymentRequest,
  settlePaymentRequest,
  declinePaymentRequest
} from '../controllers/chatController.js';
import {
  createSplitGroup,
  getMyGroups
} from '../controllers/groupController.js';
import {
  createBooking,
  getMyBookings
} from '../controllers/bookingController.js';


const router = express.Router();

// Auth Endpoints
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/profile', authenticateToken, getProfile);
router.post('/user/update-profile', authenticateToken, updateProfile);

// Wallet & Telemetry
router.post('/wallet/load', authenticateToken, initiateLoadMoney);
router.post('/wallet/confirm-load', authenticateToken, confirmLoadMoney);
router.post('/wallet/transfer', authenticateToken, transferMoney);
router.get('/wallet/transactions', authenticateToken, getTransactions);
router.post('/wallet/inject-transaction', authenticateToken, injectTransaction);

// Payment Links
router.post('/links/create', authenticateToken, createPaymentLink);
router.get('/links/my-links', authenticateToken, getMyLinks);
router.get('/links/public/:id', getLinkDetails);
router.post('/links/public/:id/pay', payPaymentLink);

// GPay Chat Payments
router.get('/chats/contacts', authenticateToken, getContacts);
router.get('/chats/history/:recipientEmail', authenticateToken, getChatHistory);
router.post('/chats/send', authenticateToken, sendChatMessage);
router.post('/chats/request', authenticateToken, createPaymentRequest);
router.post('/chats/request/settle', authenticateToken, settlePaymentRequest);
router.post('/chats/request/decline', authenticateToken, declinePaymentRequest);

// GPay Split Bill Groups
router.post('/groups/split', authenticateToken, createSplitGroup);
router.get('/groups', authenticateToken, getMyGroups);

// GPay Bank Linking & Scratch Card Rewards
router.post('/banks/link', authenticateToken, linkBankAccount);
router.get('/banks', authenticateToken, getLinkedBanks);
router.get('/rewards', authenticateToken, getScratchCards);
router.post('/rewards/scratch/:cardId', authenticateToken, scratchCardReward);

// Ticket Bookings (Flight, Train, Bus, Movie)
router.post('/bookings/create', authenticateToken, createBooking);
router.get('/bookings', authenticateToken, getMyBookings);



export default router;
