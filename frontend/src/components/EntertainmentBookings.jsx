import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Clock, 
  MapPin, 
  Loader2, 
  CheckCircle,
  X,
  CreditCard,
  Building
} from 'lucide-react';

import { API_BASE } from '../config.js';
import UPIPaymentModal from './UPIPaymentModal.jsx';

const MOCK_MOVIES = [
  { id: 'MV-AVATAR', title: 'Avatar: The Way of Water', genre: 'Sci-Fi / Action', format: 'IMAX 3D', duration: '3h 12m', rating: '9.2/10', cost: 250, image: '🎬' },
  { id: 'MV-KALKI', title: 'Kalki 2898 AD', genre: 'Mythology / Action', format: '3D', duration: '3h 01m', rating: '8.9/10', cost: 220, image: '🎬' },
  { id: 'MV-SHIDDAT', title: 'Shiddat 2', genre: 'Romance / Drama', format: '2D', duration: '2h 15m', rating: '8.1/10', cost: 180, image: '🎬' }
];

const SHOWTIMES = ['12:00 pm', '03:30 pm', '07:00 pm', '10:30 pm'];

function EntertainmentBookings({ token, user, refreshUserProfile }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Interactive seat grid states (10x10)
  const [reservedSeats, setReservedSeats] = useState([]);
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Generate random reserved seats when movie/showtime is selected
  useEffect(() => {
    if (selectedMovie && selectedShowtime) {
      const reserved = [];
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      
      // Randomly block ~25 seats
      for (let i = 0; i < 25; i++) {
        const randRow = rows[Math.floor(Math.random() * rows.length)];
        const randCol = Math.floor(Math.random() * 10) + 1;
        const seatId = `${randRow}${randCol}`;
        if (!reserved.includes(seatId)) {
          reserved.push(seatId);
        }
      }
      setReservedSeats(reserved);
      setSelectedSeats([]);
      setConfirmedBooking(null);
    }
  }, [selectedMovie, selectedShowtime]);

  const handleSeatClick = (seatId) => {
    if (reservedSeats.includes(seatId)) return; // blocked
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(s => s !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handleOpenCheckout = () => {
    if (selectedSeats.length === 0) return alert('Please select at least one seat.');
    
    setCheckoutBooking({
      price: selectedSeats.length * selectedMovie.cost,
      seats: selectedSeats,
      movieTitle: selectedMovie.title,
      showtime: selectedShowtime
    });
  };

  const handleConfirmMovieBooking = (resData, gatewayUsed) => {
    setConfirmedBooking({
      ...resData.booking,
      gatewayUsed,
      seats: selectedSeats.join(', '),
      rewardWon: resData.rewardWon,
      rewardMessage: resData.rewardMessage
    });
    setCheckoutBooking(null);
    setSelectedSeats([]);
    refreshUserProfile();
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      
      {/* Movie listing landing */}
      {!selectedMovie && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-heading font-semibold text-slate-200 text-sm">Now Showing In Cinemas</h3>
              <p className="text-xs text-slate-400">Select a blockbuster movie release to reserve ticket seats.</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Total releases: {MOCK_MOVIES.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_MOVIES.map(movie => (
              <div key={movie.id} className="glass-panel rounded-3xl overflow-hidden border border-slate-850 flex flex-col justify-between shadow-xl group hover:border-slate-800 transition-all">
                {/* Visual cover block */}
                <div className="h-40 bg-gradient-to-tr from-[#1e1b4b] to-[#4c1d95] flex items-center justify-center text-5xl relative">
                  <div className="absolute top-4 right-4 bg-indigo-600/30 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-indigo-300">
                    {movie.format}
                  </div>
                  {movie.image}
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">{movie.genre}</span>
                    <h4 className="text-sm font-bold text-slate-200 mt-1 truncate">{movie.title}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{movie.duration} • Rating: {movie.rating}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-4">
                    <div>
                      <span className="text-[8px] text-slate-500 block uppercase font-bold font-mono">TICKET RATIO</span>
                      <strong className="text-emerald-400 font-heading text-sm">₹{movie.cost}</strong>
                    </div>

                    <button
                      onClick={() => { setSelectedMovie(movie); setSelectedShowtime(SHOWTIMES[1]); }}
                      className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                    >
                      Book Tickets
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seating Grid Selection Layout */}
      {selectedMovie && !confirmedBooking && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: 10x10 Seat Matrix Map (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-850 flex flex-col items-center justify-between min-h-[440px] shadow-xl relative overflow-hidden">
            
            {/* Movie Title & Showtime selectors */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between border-b border-slate-800/40 pb-4 gap-3">
              <div className="text-center sm:text-left">
                <button onClick={() => setSelectedMovie(null)} className="text-[10px] text-indigo-400 hover:underline font-bold block mb-1">
                  ◀ Back to Movie List
                </button>
                <h3 className="text-xs font-bold text-slate-200 truncate max-w-xs">{selectedMovie.title}</h3>
              </div>

              {/* Showtimes selectors */}
              <div className="flex items-center gap-1.5 overflow-x-auto pr-1">
                {SHOWTIMES.map(time => {
                  const isActive = selectedShowtime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedShowtime(time)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
                        isActive ? 'bg-indigo-600 text-white shadow-md' : 'border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SVG Auditorium Screen */}
            <div className="w-full max-w-xs py-4 text-center">
              <svg className="w-full h-4 text-slate-600/80 filter drop-shadow-[0_2px_4px_rgba(99,102,241,0.2)]" viewBox="0 0 100 10" fill="none">
                <path d="M5 9 Q 50 1, 95 9" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase block mt-1">CINEMA SCREEN</span>
            </div>

            {/* 10x10 Seat Selector Matrix */}
            <div className="space-y-1.5 w-full max-w-sm py-4">
              {rows.map(row => (
                <div key={row} className="flex items-center justify-between gap-1">
                  <span className="w-4 text-center font-mono text-[9px] font-bold text-slate-500">{row}</span>
                  <div className="flex-1 flex justify-between gap-1">
                    {cols.map(col => {
                      const seatId = `${row}${col}`;
                      const isReserved = reservedSeats.includes(seatId);
                      const isSelected = selectedSeats.includes(seatId);

                      let seatColor = 'bg-[#0f1524] border-slate-800 hover:border-indigo-500 text-slate-400';
                      if (isReserved) seatColor = 'bg-slate-800/40 border-transparent text-slate-600/50 cursor-not-allowed';
                      if (isSelected) seatColor = 'bg-blue-600 border-blue-500 text-white shadow-md';

                      return (
                        <button
                          key={col}
                          type="button"
                          disabled={isReserved}
                          onClick={() => handleSeatClick(seatId)}
                          className={`w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-bold font-mono transition-all cursor-pointer select-none ${seatColor}`}
                          title={`Seat ${seatId}`}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Color keys */}
            <div className="w-full border-t border-slate-800/40 pt-4 flex items-center justify-center gap-6 text-[9px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#0f1524] border border-slate-800"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-800/40 border border-transparent"></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-indigo-600"></div>
                <span>Selected</span>
              </div>
            </div>

          </div>

          {/* Right: Selected Seat billing confirmation (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="font-heading font-semibold text-slate-200 text-xs uppercase tracking-wider">Ticket Invoice</h3>

            <div className="glass-panel rounded-3xl p-6 border border-slate-850 space-y-4 shadow-lg">
              <div className="space-y-1.5 border-b border-slate-800/40 pb-3">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">MOVIE SEATS EXPLAINER</span>
                <h4 className="text-xs font-bold text-slate-200">{selectedMovie.title}</h4>
                <span className="text-[10px] text-indigo-400 font-bold block">{selectedShowtime} • {selectedMovie.format}</span>
              </div>

              {/* Seating totals */}
              <div className="space-y-3 py-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Selected Seats:</span>
                  <strong className="text-slate-200 truncate max-w-[140px] font-mono">
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                  </strong>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Price per ticket:</span>
                  <strong className="text-slate-300 font-mono">₹{selectedMovie.cost}</strong>
                </div>

                <div className="flex justify-between border-t border-slate-850 pt-3">
                  <span className="text-xs font-bold text-slate-200">Total Ticket Fare:</span>
                  <strong className="text-emerald-400 font-heading text-base font-extrabold">
                    ₹{(selectedSeats.length * selectedMovie.cost).toLocaleString()}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCheckout}
                disabled={selectedSeats.length === 0}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                Proceed to Checkout
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-5 border border-slate-850 text-[10px] text-slate-500 leading-relaxed font-mono">
              <span className="font-semibold text-slate-350 block mb-1">CANCELLATION POLICY:</span>
              Tickets booked via AuraPay Go are eligible for 100% refund up to 2 hours prior to showtime. Cashback reward scratch cards claimed are non-reversible.
            </div>
          </div>

        </div>
      )}

      {/* Confirmed movie ticket showcase */}
      {confirmedBooking && (
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4 max-w-xl mx-auto shadow-xl animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-bold text-slate-200 text-sm">Movie Tickets Booked!</h3>
            <p className="text-xs text-slate-400">Your cinema seats have been successfully settled and reserved.</p>
          </div>

          <div className="border border-slate-800 bg-[#0c101d]/60 rounded-2xl p-4 text-left text-[10.5px] space-y-2 font-mono text-slate-400 max-w-md mx-auto leading-relaxed">
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span>TICKET ID:</span>
              <strong className="text-slate-200">{confirmedBooking.id}</strong>
            </div>
            <div className="flex justify-between">
              <span>MOVIE:</span>
              <strong className="text-indigo-400 font-bold">{selectedMovie.title}</strong>
            </div>
            <div className="flex justify-between">
              <span>SHOWTIME:</span>
              <strong className="text-slate-350">{selectedShowtime}</strong>
            </div>
            <div className="flex justify-between">
              <span>SEATS:</span>
              <strong className="text-slate-200">{confirmedBooking.seats}</strong>
            </div>
            <div className="flex justify-between">
              <span>FARE CHARGED:</span>
              <strong className="text-emerald-400 font-bold">₹{confirmedBooking.amount}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-800/40 pt-2 text-[9px] text-slate-500">
              <span>UPI BANKING:</span>
              <span>{confirmedBooking.gatewayUsed.toUpperCase()}</span>
            </div>
          </div>

          {confirmedBooking.rewardWon && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center space-y-1.5 max-w-md mx-auto animate-scaleUp">
              <span className="text-xl block">🎁</span>
              <h4 className="text-[11px] font-bold text-red-500 font-heading">{confirmedBooking.rewardMessage}</h4>
              <p className="text-[9.5px] text-slate-400 leading-relaxed">A cashback reward scratch card has been added to your profile! Go to the Rewards tab to claim your cashback.</p>
            </div>
          )}

          <button
            onClick={() => { setConfirmedBooking(null); setSelectedMovie(null); }}
            className="py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-500/10"
          >
            Done & Return
          </button>
        </div>
      )}

      {/* Settle checkout modal triggers */}
      {checkoutBooking && (
        <UPIPaymentModal 
          amount={checkoutBooking.price}
          serviceType="movie"
          details={{
            movieTitle: checkoutBooking.movieTitle,
            showtime: checkoutBooking.showtime,
            seats: checkoutBooking.seats
          }}
          token={token}
          user={user}
          onSettleSuccess={handleConfirmMovieBooking}
          onCancel={() => setCheckoutBooking(null)}
        />
      )}

    </div>
  );
}

export default EntertainmentBookings;
