// mockInterceptor.js
// Intercepts window.fetch calls to simulate a full backend in memory/localStorage when the real backend is offline.

const IS_MOCK_MODE = window.location.hostname.includes('github.io') || window.location.hostname.includes('vercel') || window.location.hostname.includes('netlify');

// Keep track of original fetch
const originalFetch = window.fetch;

// Initialize mock database in localStorage if not present
const initializeMockDB = () => {
  if (!localStorage.getItem('mock_db_initialized')) {
    const defaultUser = {
      name: 'IndiaPay User',
      email: 'recruiter@juspay.com',
      balance: 75000,
      cardNumber: '4532718293810293',
      cardExpiry: '12/29',
      cardCvv: '831',
      cardPin: '9988',
      linkedBanks: [
        { id: 'bank-1', bankName: 'HDFC Bank', accountNumber: 'XXXXXX8890', isDefault: true, upiPin: '1234' },
        { id: 'bank-2', bankName: 'State Bank of India (SBI)', accountNumber: 'XXXXXX1024', isDefault: false, upiPin: '1234' },
        { id: 'bank-3', bankName: 'ICICI Bank', accountNumber: 'XXXXXX5520', isDefault: false, upiPin: '1234' }
      ]
    };
    
    const defaultContacts = [
      { id: 'c-1', name: 'Rohit Verma', email: 'rohit@indiapay.com' },
      { id: 'c-2', name: 'Sneha Reddy', email: 'sneha@indiapay.com' }
    ];

    const defaultChats = {
      'rohit@indiapay.com': [
        { id: 'm-1', sender: 'rohit@indiapay.com', recipient: 'recruiter@juspay.com', amount: 500, type: 'payment', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'completed' },
        { id: 'm-2', sender: 'recruiter@juspay.com', recipient: 'rohit@indiapay.com', content: 'Hey Rohit, received the payment!', type: 'text', timestamp: new Date(Date.now() - 3600000 * 20).toISOString() }
      ],
      'sneha@indiapay.com': [
        { id: 'm-3', sender: 'sneha@indiapay.com', recipient: 'recruiter@juspay.com', amount: 1200, type: 'request', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), status: 'pending' }
      ]
    };

    const defaultTransactions = [
      { id: 'TXN-MOCK101', type: 'debit', amount: 500, title: 'Send to Rohit Verma', description: 'UPI Payment to Rohit Verma', gateway: 'wallet_p2p', createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'success', category: 'p2p' }
    ];

    const defaultRewards = [
      { id: 'rew-1', rewardMessage: 'Congratulate! You won a scratch card!', rewardValue: 75, isScratched: false, createdAt: new Date().toISOString() },
      { id: 'rew-2', rewardMessage: 'Flat ₹50 cashback on utilities', rewardValue: 50, isScratched: false, createdAt: new Date().toISOString() }
    ];

    localStorage.setItem('mock_user', JSON.stringify(defaultUser));
    localStorage.setItem('mock_contacts', JSON.stringify(defaultContacts));
    localStorage.setItem('mock_chats', JSON.stringify(defaultChats));
    localStorage.setItem('mock_transactions', JSON.stringify(defaultTransactions));
    localStorage.setItem('mock_rewards', JSON.stringify(defaultRewards));
    localStorage.setItem('mock_db_initialized', 'true');
  }
};

const handleMockRequest = async (urlString, options = {}) => {
  initializeMockDB();
  
  // Parse request body if present
  let body = {};
  if (options.body) {
    try {
      body = JSON.parse(options.body);
    } catch (e) {}
  }

  // Helper to read and write DB
  const getDB = (key) => JSON.parse(localStorage.getItem(key));
  const saveDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  // Response helper
  const jsonResponse = (data, status = 200) => {
    return Promise.resolve(new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }));
  };

  // 1. API: /api/auth/login or register
  if (urlString.includes('/api/auth/login') || urlString.includes('/api/auth/register')) {
    const user = getDB('mock_user');
    if (body.email) {
      user.email = body.email;
    }
    if (body.name) {
      user.name = body.name;
    }
    saveDB('mock_user', user);
    return jsonResponse({ success: true, token: 'mock-session-token', user });
  }

  // 2. API: /api/auth/profile
  if (urlString.includes('/api/auth/profile')) {
    const user = getDB('mock_user');
    return jsonResponse({ success: true, user });
  }

  // 3. API: /api/user/update-profile
  if (urlString.includes('/api/user/update-profile')) {
    const user = getDB('mock_user');
    Object.assign(user, body);
    saveDB('mock_user', user);
    return jsonResponse({ success: true, user });
  }

  // 4. API: /api/wallet/transactions
  if (urlString.includes('/api/wallet/transactions')) {
    const txns = getDB('mock_transactions');
    return jsonResponse({ success: true, transactions: txns });
  }

  // 5. API: /api/wallet/load
  if (urlString.includes('/api/wallet/load') || urlString.includes('/api/wallet/confirm-load')) {
    const user = getDB('mock_user');
    const amount = Number(body.amount);
    user.balance += amount;
    saveDB('mock_user', user);

    const txns = getDB('mock_transactions');
    const newTxn = {
      id: `TXN-LD${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      type: 'credit',
      amount,
      title: 'Loaded Money to Wallet',
      description: 'Loaded money via credit/debit card checkout',
      gateway: 'stripe',
      createdAt: new Date().toISOString(),
      status: 'success',
      category: 'wallet'
    };
    txns.unshift(newTxn);
    saveDB('mock_transactions', txns);

    return jsonResponse({ success: true, user, transaction: newTxn });
  }

  // 6. API: /api/bookings/create
  if (urlString.includes('/api/bookings/create')) {
    const user = getDB('mock_user');
    const amount = Number(body.amount);
    if (user.balance < amount) {
      return jsonResponse({ success: false, error: 'Insufficient wallet balance.' }, 400);
    }
    user.balance -= amount;
    saveDB('mock_user', user);

    // Add transaction entry
    const txns = getDB('mock_transactions');
    const newTxn = {
      id: `BKG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      type: 'debit',
      amount,
      title: `${body.serviceType.toUpperCase()} Reservation`,
      description: `Booked ticket paid via ${body.gatewayUsed}`,
      gateway: body.gatewayUsed || 'demo_fallback',
      createdAt: new Date().toISOString(),
      status: 'success',
      category: 'booking'
    };
    txns.unshift(newTxn);
    saveDB('mock_transactions', txns);

    // Award scratch card
    const rewards = getDB('mock_rewards');
    const newCard = {
      id: `rew-${Math.random().toString(36).substring(2, 7)}`,
      rewardMessage: `IndiaPay reward card for ${body.serviceType}`,
      rewardValue: Math.floor(Math.random() * 140) + 10,
      isScratched: false,
      createdAt: new Date().toISOString()
    };
    rewards.unshift(newCard);
    saveDB('mock_rewards', rewards);

    return jsonResponse({
      success: true,
      id: newTxn.id,
      passengerName: user.name,
      serviceType: body.serviceType,
      details: body.details,
      amount: body.amount,
      gatewayUsed: body.gatewayUsed,
      rewardWon: true,
      rewardMessage: 'Congratulate! You won a scratch card!'
    });
  }

  // 7. API: /api/chats/contacts
  if (urlString.includes('/api/chats/contacts')) {
    const contacts = getDB('mock_contacts');
    return jsonResponse({ success: true, contacts });
  }

  // 8. API: /api/chats/history/
  if (urlString.includes('/api/chats/history/')) {
    const parts = urlString.split('/');
    const email = parts[parts.length - 1];
    const chats = getDB('mock_chats');
    const history = chats[email] || [];
    return jsonResponse({ success: true, history });
  }

  // 9. API: /api/chats/send
  if (urlString.includes('/api/chats/send')) {
    const chats = getDB('mock_chats');
    const email = body.recipient;
    const history = chats[email] || [];
    const newMsg = {
      id: `m-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'recruiter@juspay.com',
      recipient: email,
      content: body.content,
      type: body.type || 'text',
      amount: body.amount,
      status: body.type === 'request' ? 'pending' : 'completed',
      timestamp: new Date().toISOString()
    };
    history.push(newMsg);
    chats[email] = history;
    saveDB('mock_chats', chats);
    return jsonResponse({ success: true, message: newMsg });
  }

  // 10. API: /api/wallet/transfer
  if (urlString.includes('/api/wallet/transfer')) {
    const user = getDB('mock_user');
    const amount = Number(body.amount);
    if (user.balance < amount) {
      return jsonResponse({ success: false, error: 'Insufficient wallet balance.' }, 400);
    }
    user.balance -= amount;
    saveDB('mock_user', user);

    // Add to transactions list
    const txns = getDB('mock_transactions');
    const newTxn = {
      id: `TXN-P2P${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      type: 'debit',
      amount,
      title: `Sent money to ${body.recipient}`,
      description: `Sent money to ${body.recipient} via UPI`,
      gateway: 'wallet_p2p',
      createdAt: new Date().toISOString(),
      status: 'success',
      category: 'p2p'
    };
    txns.unshift(newTxn);
    saveDB('mock_transactions', txns);

    // Award scratch card
    const rewards = getDB('mock_rewards');
    const newCard = {
      id: `rew-${Math.random().toString(36).substring(2, 7)}`,
      rewardMessage: 'IndiaPay Reward scratch card won',
      rewardValue: Math.floor(Math.random() * 140) + 10,
      isScratched: false,
      createdAt: new Date().toISOString()
    };
    rewards.unshift(newCard);
    saveDB('mock_rewards', rewards);

    return jsonResponse({
      success: true,
      message: 'Fund transfer completed successfully',
      balance: user.balance,
      rewardWon: true,
      rewardMessage: 'You won a scratch card!'
    });
  }

  // 11. API: /api/chats/request/settle
  if (urlString.includes('/api/chats/request/settle')) {
    const user = getDB('mock_user');
    const amount = Number(body.amount);
    if (user.balance < amount) {
      return jsonResponse({ success: false, error: 'Insufficient balance.' }, 400);
    }
    user.balance -= amount;
    saveDB('mock_user', user);

    // Update message status in chats
    const chats = getDB('mock_chats');
    const email = body.recipient;
    const history = chats[email] || [];
    const msg = history.find(m => m.id === body.requestId);
    if (msg) {
      msg.status = 'completed';
    }
    chats[email] = history;
    saveDB('mock_chats', chats);

    // Register transaction log
    const txns = getDB('mock_transactions');
    const newTxn = {
      id: `TXN-ST${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      type: 'debit',
      amount,
      title: `Paid request from ${email}`,
      description: `Settled chat payment request from ${email}`,
      gateway: 'wallet_p2p',
      createdAt: new Date().toISOString(),
      status: 'success',
      category: 'p2p'
    };
    txns.unshift(newTxn);
    saveDB('mock_transactions', txns);

    return jsonResponse({ success: true, message: 'Request paid successfully', balance: user.balance });
  }

  // 12. API: /api/chats/request/decline
  if (urlString.includes('/api/chats/request/decline')) {
    const chats = getDB('mock_chats');
    const email = body.recipient;
    const history = chats[email] || [];
    const msg = history.find(m => m.id === body.requestId);
    if (msg) {
      msg.status = 'declined';
    }
    chats[email] = history;
    saveDB('mock_chats', chats);
    return jsonResponse({ success: true, message: 'Request declined' });
  }

  // 13. API: /api/rewards
  if (urlString.includes('/api/rewards') && !urlString.includes('/scratch')) {
    const rewards = getDB('mock_rewards');
    return jsonResponse({ success: true, rewards });
  }

  // 14. API: /api/rewards/scratch/
  if (urlString.includes('/api/rewards/scratch/')) {
    const parts = urlString.split('/');
    const id = parts[parts.length - 1];
    const rewards = getDB('mock_rewards');
    const card = rewards.find(r => r.id === id);
    
    if (card && !card.isScratched) {
      card.isScratched = true;
      saveDB('mock_rewards', rewards);

      // Add reward to user profile balance
      const user = getDB('mock_user');
      user.balance += card.rewardValue;
      saveDB('mock_user', user);

      // Register transaction credit log
      const txns = getDB('mock_transactions');
      const newTxn = {
        id: `CB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        type: 'credit',
        amount: card.rewardValue,
        title: 'IndiaPay Reward Cashback',
        description: 'Cashback won by scratching IndiaPay Reward Card',
        gateway: 'rewards_engine',
        createdAt: new Date().toISOString(),
        status: 'success',
        category: 'cashback'
      };
      txns.unshift(newTxn);
      saveDB('mock_transactions', txns);
    }

    return jsonResponse({ success: true, rewardValue: card ? card.rewardValue : 0 });
  }

  // 15. API: /api/banks
  if (urlString.includes('/api/banks') && !urlString.includes('/link')) {
    const user = getDB('mock_user');
    return jsonResponse({ success: true, linkedBanks: user.linkedBanks });
  }

  // 16. API: /api/banks/link
  if (urlString.includes('/api/banks/link')) {
    const user = getDB('mock_user');
    const newBank = {
      id: `bank-${Math.random().toString(36).substring(2, 5)}`,
      bankName: body.bankName,
      accountNumber: `XXXXXX${body.accountNumber.slice(-4)}`,
      isDefault: user.linkedBanks.length === 0,
      upiPin: body.upiPin
    };
    user.linkedBanks.push(newBank);
    saveDB('mock_user', user);
    return jsonResponse({ success: true, linkedBanks: user.linkedBanks });
  }

  // 17. API: /api/wallet/inject-transaction
  if (urlString.includes('/api/wallet/inject-transaction')) {
    const txns = getDB('mock_transactions');
    const newTxn = {
      id: body.id || `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      type: body.type,
      amount: Number(body.amount),
      title: body.title,
      description: body.description || body.desc || 'Manual Ledger Injection',
      gateway: body.gateway || 'console_tool',
      createdAt: body.createdAt || body.timestamp || new Date().toISOString(),
      status: body.status || 'success',
      category: body.category || 'other'
    };
    txns.unshift(newTxn);
    saveDB('mock_transactions', txns);
    return jsonResponse({ success: true, transaction: newTxn });
  }

  // Default mock response for unhandled endpoints
  return jsonResponse({ success: true });
};

// Override window.fetch synchronously to completely avoid race conditions during component mounting
window.fetch = async function (url, options = {}) {
  const urlString = typeof url === 'string' ? url : url.url;
  
  // Check if it's an API request
  if (!urlString.includes('/api/')) {
    return originalFetch.apply(this, arguments);
  }

  // Production static environment bypasses real connection immediately
  if (IS_MOCK_MODE) {
    return handleMockRequest(urlString, options);
  }

  // Local/Dev environment tries real connection, falls back seamlessly to mock database if offline
  try {
    const res = await originalFetch.apply(this, arguments);
    return res;
  } catch (err) {
    console.warn(`[Local Interceptor] Backend offline for ${urlString}. serving from browser local database...`);
    return handleMockRequest(urlString, options);
  }
};

console.log('[Mock Interceptor] Registered synchronously.');
