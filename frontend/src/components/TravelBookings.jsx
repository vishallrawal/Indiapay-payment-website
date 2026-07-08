import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Train, 
  Bus, 
  Search, 
  Loader2, 
  CheckCircle, 
  ArrowRight,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';

import UPIPaymentModal from './UPIPaymentModal.jsx';

const MOCK_FLIGHTS = [
  { id: 'FL-INDIGO-101', company: 'Indigo Airlines', logo: '✈️', price: 4800, time: '09:15 am', duration: '2h 15m' },
  { id: 'FL-AIRINDIA-202', company: 'Air India', logo: '✈️', price: 5400, time: '06:00 am', duration: '2h 10m' },
  { id: 'FL-VISTARA-303', company: 'Vistara', logo: '✈️', price: 6200, time: '02:30 pm', duration: '2h 10m' }
];

const MOCK_TRAINS = [
  { id: 'TR-SHATABDI-12', company: 'Shatabdi Express', logo: '🚂', price: 1200, time: '06:15 am', duration: '4h 30m' },
  { id: 'TR-RAJDHANI-24', company: 'Rajdhani Express', logo: '🚂', price: 2100, time: '04:30 pm', duration: '16h 15m' },
  { id: 'TR-GARIBRATH-36', company: 'Garib Rath Express', logo: '🚂', price: 750, time: '11:00 pm', duration: '12h 45m' }
];

const MOCK_BUSES = [
  { id: 'BS-INTRCITY-01', company: 'IntrCity SmartBus', logo: '🚌', price: 950, time: '08:00 pm', duration: '8h 00m' },
  { id: 'BS-ZINGBUS-02', company: 'Zingbus Platinum', logo: '🚌', price: 800, time: '09:30 pm', duration: '8h 30m' },
  { id: 'BS-VRL-03', company: 'VRL Travels Multi-Axle', logo: '🚌', price: 1100, time: '10:00 pm', duration: '9h 00m' }
];

function TravelBookings({ token, user, refreshUserProfile }) {
  const [activeSubTab, setActiveSubTab] = useState('flight'); // flight, train, bus
  
  // Search parameters
  const [fromCity, setFromCity] = useState('Delhi (DEL)');
  const [toCity, setToCity] = useState('Mumbai (BOM)');
  const [date, setDate] = useState('2026-07-15');
  const [passengerName, setPassengerName] = useState(user?.name || 'IndiaPay Member');
  
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Checkout modal trigger state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    if (user?.name) {
      setPassengerName(user.name);
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
      alert("Source and Destination city cannot be same.");
      return;
    }

    setSearching(true);
    setSearchResults([]);
    setSuccessBooking(null);

    // Simulate search latency (1 second)
    setTimeout(() => {
      setSearching(false);
      if (activeSubTab === 'flight') setSearchResults(MOCK_FLIGHTS);
      if (activeSubTab === 'train') setSearchResults(MOCK_TRAINS);
      if (activeSubTab === 'bus') setSearchResults(MOCK_BUSES);
    }, 900);
  };

  const handleConfirmBooking = (resData, gatewayUsed) => {
    setSuccessBooking({
      ...resData.booking,
      gatewayUsed,
      passengerName,
      rewardWon: resData.rewardWon,
      rewardMessage: resData.rewardMessage
    });
    setSelectedTicket(null);
    setSearchResults([]);
    refreshUserProfile();
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      
      {/* Travel Category Tabs selector */}
      <div className="glass-panel rounded-3xl p-4 border border-slate-850 flex items-center justify-center gap-3 shadow-lg">
        {[
          { id: 'flight', label: 'Flights', icon: Plane },
          { id: 'train', label: 'Trains', icon: Train },
          { id: 'bus', label: 'Buses', icon: Bus }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id); setSearchResults([]); setSuccessBooking(null); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Success Confirmation view */}
      {successBooking && (
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4 max-w-xl mx-auto shadow-xl animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-slate-200 text-sm">Ticket Confirmed Successfully!</h3>
            <p className="text-xs text-slate-400">Your travel seat reservation is confirmed and ticket is issued.</p>
          </div>

          <div className="border border-slate-800 bg-[#0c101d]/60 rounded-2xl p-4 text-left text-[10.5px] space-y-2 font-mono text-slate-400 max-w-md mx-auto leading-relaxed">
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span>BOOKING ID:</span>
              <strong className="text-slate-200">{successBooking.id}</strong>
            </div>
            <div className="flex justify-between">
              <span>PASSENGER:</span>
              <strong className="text-slate-200">{successBooking.passengerName}</strong>
            </div>
            <div className="flex justify-between">
              <span>SERVICE TYPE:</span>
              <strong className="text-indigo-400 uppercase font-bold">{successBooking.serviceType}</strong>
            </div>
            <div className="flex justify-between">
              <span>ROUTE:</span>
              <strong className="text-slate-350">{successBooking.details.origin} ➔ {successBooking.details.destination}</strong>
            </div>
            <div className="flex justify-between">
              <span>FARE PAID:</span>
              <strong className="text-emerald-400">₹{successBooking.amount}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-800/40 pt-2 text-[9px] text-slate-500">
              <span>UPI BANKING:</span>
              <span>{successBooking.gatewayUsed.toUpperCase()}</span>
            </div>
          </div>

          {successBooking.rewardWon && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center space-y-1.5 max-w-md mx-auto animate-scaleUp">
              <span className="text-xl block">🎁</span>
              <h4 className="text-[11px] font-bold text-red-500 font-heading">{successBooking.rewardMessage}</h4>
              <p className="text-[9.5px] text-slate-400 leading-relaxed">A cashback reward scratch card has been added to your profile! Go to the Rewards tab to claim your cashback.</p>
            </div>
          )}

          <button
            onClick={() => setSuccessBooking(null)}
            className="py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-500/10"
          >
            Book Another Ticket
          </button>
        </div>
      )}

      {/* Booking Search Form */}
      {!successBooking && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Search Form (5 cols) */}
          <form onSubmit={handleSearch} className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-850 space-y-4 shadow-lg h-fit">
            <div className="space-y-1">
              <h3 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Search Travel Routes</h3>
              <p className="text-[10px] text-slate-500">Specify details to query live available schedules.</p>
            </div>

            {/* From City */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Source City</label>
              <input
                type="text"
                required
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            {/* To City */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Destination City</label>
              <input
                type="text"
                required
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Departure date */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Departure Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Passenger Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Lead Passenger Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
            >
              {searching && <Loader2 className="w-4 h-4 animate-spin" />}
              Search Routes
            </button>

          </form>

          {/* Right panel: Search results (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Available Tickets</h4>

            {searching ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                Fetching active travel manifests...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs border border-dashed border-slate-850 rounded-3xl">
                Awaiting search triggers... Specify route and click "Search Routes".
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map(ticket => (
                  <div key={ticket.id} className="glass-panel rounded-2xl p-5 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md hover:border-slate-800 transition-all">
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-2xl">
                        {ticket.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-200 text-xs">{ticket.company}</h4>
                          <span className="text-[8px] font-mono text-slate-500 px-1 bg-slate-900 rounded border border-slate-850">{ticket.id}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Departs: {ticket.time} • Duration: {ticket.duration}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 border-slate-850/60 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold font-mono">Total Fare</span>
                        <strong className="text-emerald-400 font-heading text-sm">₹{ticket.price.toLocaleString()}</strong>
                      </div>

                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Book Seat
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* Settle checkouts modal overlay */}
      {selectedTicket && (
        <UPIPaymentModal 
          amount={selectedTicket.price}
          serviceType={activeSubTab}
          details={{
            ticketId: selectedTicket.id,
            carrierName: selectedTicket.company,
            origin: fromCity,
            destination: toCity,
            date
          }}
          token={token}
          user={user}
          onSettleSuccess={handleConfirmBooking}
          onCancel={() => setSelectedTicket(null)}
        />
      )}

    </div>
  );
}

export default TravelBookings;
