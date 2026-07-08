import { db } from '../config/db.js';

// 1. Create Service Ticket Booking
export const createBooking = async (req, res) => {
  const { serviceType, details, amount, gatewayUsed } = req.body;
  const user = req.user;

  if (!serviceType || !details || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Service type, amount, and booking details are required.' });
  }

  try {
    const userProfile = await db.findOne('users', { id: user.id });
    if (userProfile.balance < amount) {
      return res.status(400).json({ success: false, error: `Insufficient wallet balance to book. Available: ₹${userProfile.balance}` });
    }

    // Generate reward scratch card automatically
    const cardId = 'SCR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const rewardAmt = Math.floor(Math.random() * 91) + 10; // random reward ₹10 - ₹100
    const cards = userProfile.scratchCards || [];
    cards.push({
      id: cardId,
      status: 'unscratched',
      amount: rewardAmt,
      createdAt: new Date()
    });

    // Deduct user wallet balance and save cards
    const updatedUser = await db.update('users', { id: user.id }, {
      balance: Math.round((userProfile.balance - Number(amount)) * 100) / 100,
      scratchCards: cards
    });

    const bookingId = 'BKG-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Save Booking details
    const newBooking = await db.create('bookings', {
      id: bookingId,
      userEmail: user.email,
      serviceType,
      details,
      amount: Number(amount),
      status: 'success'
    });

    // Save transaction ledger audit
    const txnId = 'TXN-BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await db.create('transactions', {
      id: txnId,
      type: 'booking',
      senderEmail: user.email,
      receiverEmail: `${serviceType}_vendor`,
      amount: Number(amount),
      currency: 'INR',
      status: 'success',
      gateway: gatewayUsed || 'demo_fallback',
      description: `${serviceType.toUpperCase()} ticket purchase: ${bookingId}`
    });

    res.status(201).json({
      success: true,
      booking: newBooking,
      balance: updatedUser.balance,
      rewardWon: true,
      rewardMessage: `Congratulations! You won an IndiaPay Scratch Card!`
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Get User Bookings
export const getMyBookings = async (req, res) => {
  const user = req.user;

  try {
    const allBookings = await db.find('bookings');
    const userBookings = allBookings.filter(b => b.userEmail.toLowerCase() === user.email.toLowerCase());
    
    // Sort descending by date
    const sortedBookings = [...userBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, bookings: sortedBookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
