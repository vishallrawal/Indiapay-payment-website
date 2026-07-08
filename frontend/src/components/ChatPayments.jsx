import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  User, 
  ArrowLeft, 
  Check, 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus,
  Loader2,
  AlertCircle,
  Gift
} from 'lucide-react';

import { API_BASE } from '../config.js';

function ChatPayments({ user, token, refreshUserProfile }) {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState('');
  
  // Pay / Request modal popup states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [txnAmount, setTxnAmount] = useState('');
  const [txnNote, setTxnNote] = useState('');
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState('');
  
  // Scratch card won feedback state
  const [scratchAward, setScratchAward] = useState(null);

  const messagesEndRef = useRef(null);

  // 1. Fetch Contacts
  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chats/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // 2. Fetch Chat History for Active Contact
  const fetchChatHistory = async (email, quiet = false) => {
    if (!email) return;
    if (!quiet) setLoadingChat(true);
    setChatError('');
    try {
      const res = await fetch(`${API_BASE}/api/chats/history/${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      } else {
        setChatError(data.error || 'Failed to sync conversation.');
      }
    } catch (err) {
      setChatError('Connection dropped.');
    } finally {
      if (!quiet) setLoadingChat(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Poll chats history every 4 seconds for live chat feel
  useEffect(() => {
    if (activeContact) {
      fetchChatHistory(activeContact.email, true);
      const interval = setInterval(() => {
        fetchChatHistory(activeContact.email, true);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeContact]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send Text message
  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;

    const messageContent = inputText;
    setInputText('');

    try {
      const res = await fetch(`${API_BASE}/api/chats/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverEmail: activeContact.email,
          text: messageContent
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Execute Instant Pay
  const handleExecutePayment = async (e) => {
    e.preventDefault();
    const amountNum = Number(txnAmount);
    if (!txnAmount || isNaN(amountNum) || amountNum <= 0) return setTxnError('Enter a valid amount.');
    if (amountNum > user.balance) return setTxnError(`Insufficient funds. Your balance: ₹${user.balance}`);

    setTxnLoading(true);
    setTxnError('');

    try {
      // First create transaction
      const res = await fetch(`${API_BASE}/api/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: activeContact.email,
          amount: amountNum,
          description: txnNote || 'Direct payment'
        })
      });
      const data = await res.json();

      if (data.success) {
        // Log transaction bubble in chat feed as a message of type 'payment_send'
        await fetch(`${API_BASE}/api/chats/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverEmail: activeContact.email,
            text: `Sent ₹${amountNum} (${txnNote || 'Direct payment'})`
          })
        });

        setTxnAmount('');
        setTxnNote('');
        setIsPayModalOpen(false);
        refreshUserProfile();
        fetchChatHistory(activeContact.email);
        
        // Show reward won toast alert
        if (data.rewardWon) {
          setScratchAward(`🎉 ${data.rewardMessage || "You won an IndiaPay Scratch Card!"} Check the Rewards tab.`);
          setTimeout(() => setScratchAward(null), 5000);
        }
      } else {
        setTxnError(data.error || 'Transaction declined.');
      }
    } catch (err) {
      setTxnError('Connection failed.');
    } finally {
      setTxnLoading(false);
    }
  };

  // 5. Send Payment Request
  const handleSendRequest = async (e) => {
    e.preventDefault();
    const amountNum = Number(txnAmount);
    if (!txnAmount || isNaN(amountNum) || amountNum <= 0) return setTxnError('Enter a valid amount.');

    setTxnLoading(true);
    setTxnError('');

    try {
      const res = await fetch(`${API_BASE}/api/chats/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverEmail: activeContact.email,
          amount: amountNum,
          text: txnNote || 'Requested payment'
        })
      });
      const data = await res.json();

      if (data.success) {
        setTxnAmount('');
        setTxnNote('');
        setIsRequestModalOpen(false);
        fetchChatHistory(activeContact.email);
      } else {
        setTxnError(data.error || 'Request creation failed.');
      }
    } catch (err) {
      setTxnError('Connection failed.');
    } finally {
      setTxnLoading(false);
    }
  };

  // 6. Action: Settle / Pay Request
  const handleSettleRequest = async (msgId, amount) => {
    if (user.balance < amount) {
      alert(`Insufficient funds. Your balance: ₹${user.balance}. Please load wallet funds.`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/chats/request/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messageId: msgId })
      });
      const data = await res.json();
      if (data.success) {
        refreshUserProfile();
        fetchChatHistory(activeContact.email);
        if (data.rewardInfo?.earned) {
          setScratchAward(`🎉 Won a Scratch Card (Cashback up to ₹${data.rewardInfo.amount})! Go to Rewards.`);
          setTimeout(() => setScratchAward(null), 5500);
        }
      } else {
        alert(data.error || 'Failed to pay request.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Action: Decline Request
  const handleDeclineRequest = async (msgId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chats/request/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messageId: msgId })
      });
      const data = await res.json();
      if (data.success) {
        fetchChatHistory(activeContact.email);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 min-h-[calc(100vh-140px)] glass-panel rounded-3xl overflow-hidden border border-slate-850 shadow-2xl relative">
      
      {/* Earned Scratch card alert banner */}
      {scratchAward && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3 rounded-full text-xs font-bold text-white shadow-xl glow-indigo flex items-center gap-2 animate-bounce">
          <Gift className="w-4 h-4 animate-spin" />
          <span>{scratchAward}</span>
        </div>
      )}

      {/* 1. Left Contact Sidebar (4 cols) */}
      <div className={`md:col-span-4 border-r border-slate-850 bg-[#0d111e]/50 flex flex-col justify-between ${
        activeContact ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-5 border-b border-slate-850 bg-[#0c101d]/60">
          <h3 className="font-heading font-bold text-slate-100 text-sm">GPay Contacts</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Click a contact to pay or chat</p>
        </div>

        {loadingContacts ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mr-2" />
            Loading friends list...
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
            <User className="w-8 h-8 text-slate-600" />
            <p className="text-xs">No contacts available.</p>
            <p className="text-[10px] text-slate-600">Register other users to start chat threads.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-850/40">
            {contacts.map(c => {
              const isActive = activeContact?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveContact(c)}
                  className={`w-full p-4 text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                    isActive 
                      ? 'bg-red-500/10 border-l-4 border-red-500' 
                      : 'hover:bg-red-500/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs">{c.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{c.email}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Right Chat payment Panel (8 cols) */}
      <div className={`md:col-span-8 flex flex-col gpay-panel-bg relative ${
        activeContact ? 'flex' : 'hidden md:flex items-center justify-center text-slate-500 text-center p-12'
      }`}>
        {activeContact ? (
          <>
            {/* Chat header */}
            <div className="h-16 border-b border-slate-850 px-5 bg-[#0c101d]/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveContact(null)} 
                  className="p-1.5 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-colors md:hidden cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  {activeContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs">{activeContact.name}</h4>
                  <span className="text-[9px] text-slate-500 font-mono">{activeContact.email}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-500 block">Bank Settle Mode</span>
                <span className="text-[9px] font-bold text-teal-400 font-mono uppercase bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Active UPI</span>
              </div>
            </div>

            {/* Chat Feed Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-transparent to-[#0a0d17]">
              {loadingChat && messages.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-10">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
                  Loading payment timeline...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  👋 Start conversation. Type a message or send money!
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderEmail.toLowerCase() === user.email.toLowerCase();
                  
                  // Render regular text bubble
                  if (msg.type === 'message') {
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-slate-900 border border-slate-850 text-slate-300 rounded-tl-none'
                        }`}>
                          <p>{msg.text}</p>
                          <span className="text-[8px] text-slate-400/90 text-right block mt-1 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Render payment request card bubble
                  if (msg.type === 'payment_request') {
                    const receivedRequest = msg.receiverEmail.toLowerCase() === user.email.toLowerCase();
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0c101e]/80 p-4 space-y-3.5 shadow-lg relative overflow-hidden">
                          {/* Accent border */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            msg.status === 'pending' ? 'bg-amber-500' : msg.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}></div>

                          <div className="flex justify-between items-start pl-2">
                            <div>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block font-mono">BILL SPLIT / REQUEST</span>
                              <h5 className="text-[11px] font-semibold text-slate-300 mt-0.5">{msg.text}</h5>
                              <span className="text-[9px] text-slate-500">Requested by: {msg.senderEmail}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-200 font-heading">₹{msg.amount.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 pl-2">
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </span>

                            {msg.status === 'pending' ? (
                              receivedRequest ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDeclineRequest(msg.id)}
                                    className="px-3 py-1 rounded-lg border border-slate-800 hover:bg-slate-800/40 text-slate-400 text-[10px] font-bold cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    onClick={() => handleSettleRequest(msg.id, msg.amount)}
                                    className="px-4 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer shadow-md shadow-indigo-500/10"
                                  >
                                    Pay Now
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-mono">PENDING RECEIVAL</span>
                              )
                            ) : msg.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-mono">
                                <Check className="w-3 h-3" /> PAID
                              </span>
                            ) : (
                              <span className="text-[9px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase font-mono">DECLINED</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Actions input */}
            <div className="p-4 border-t border-slate-850 bg-[#0c101d]/60 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {/* Payment trigger buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => { setIsPayModalOpen(true); setTxnError(''); }}
                  className="flex-1 sm:flex-none py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-emerald-500/10 hover:scale-[1.01]"
                >
                  Pay
                </button>
                <button
                  onClick={() => { setIsRequestModalOpen(true); setTxnError(''); }}
                  className="flex-1 sm:flex-none py-2 px-4.5 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Request
                </button>
              </div>

              {/* Text send input */}
              <form onSubmit={handleSendText} className="flex-1 w-full relative flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full pl-4 pr-12 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-xl">
              <Send className="w-8 h-8 rotate-45" />
            </div>
            <h3 className="font-heading font-semibold text-slate-300">Start conversational payment</h3>
            <p className="text-xs text-slate-500 max-w-sm">Select a contact from the sidebar to chat, pay money directly, or split bills.</p>
          </div>
        )}
      </div>

      {/* Pay Modal Overlay */}
      {isPayModalOpen && activeContact && (
        <div className="fixed inset-0 z-50 bg-[#04060b]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-800">
            <button onClick={() => setIsPayModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <form onSubmit={handleExecutePayment} className="space-y-4">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold font-mono">PAY CONTACT</span>
                <h4 className="font-heading font-bold text-slate-200 text-sm mt-0.5">{activeContact.name}</h4>
              </div>
              {txnError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">⚠️ {txnError}</div>}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    required
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="What's this for?"
                  value={txnNote}
                  onChange={(e) => setTxnNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={txnLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {txnLoading && <Loader2 className="w-4 h-4 animate-spin inline mr-1" />}
                Confirm Pay ₹{txnAmount || '0'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Modal Overlay */}
      {isRequestModalOpen && activeContact && (
        <div className="fixed inset-0 z-50 bg-[#04060b]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-800">
            <button onClick={() => setIsRequestModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold font-mono">REQUEST PAYMENT FROM</span>
                <h4 className="font-heading font-bold text-slate-200 text-sm mt-0.5">{activeContact.name}</h4>
              </div>
              {txnError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">⚠️ {txnError}</div>}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    required
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-400">Purpose Note</label>
                <input
                  type="text"
                  placeholder="e.g. Pizza split share"
                  required
                  value={txnNote}
                  onChange={(e) => setTxnNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={txnLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {txnLoading && <Loader2 className="w-4 h-4 animate-spin inline mr-1" />}
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ChatPayments;
