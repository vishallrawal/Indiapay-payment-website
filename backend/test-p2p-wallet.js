import bcrypt from 'bcryptjs';
import { db, connectDB } from './config/db.js';
import { registerUser } from './controllers/userController.js';
import { createBooking, getMyBookings } from './controllers/bookingController.js';

// Simple mock for Express response object
const createMockResponse = (callback) => {
  return {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      callback(this.statusCode, data);
    }
  };
};

const runDiagnostics = async () => {
  console.log('--- STARTING GOOGLE PAY CLONE INTEGRATION DIAGNOSTICS ---');

  // 1. Database Connection
  await connectDB();

  // 2. Clear previous entries
  console.log('\nCleaning existing database entries...');
  await db.deleteMany('users');
  await db.deleteMany('bookings');
  await db.deleteMany('transactions');

  // 3. Register Recruiter Profile (Bypasses manual auth blocks)
  console.log('\n[Step 1] Registering GPay Default Recruiter Profile...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const seedRecruiter = {
    id: 'USR-RECRUITER-GPAY',
    name: 'IndiaPay User',
    email: 'recruiter@juspay.com',
    password: hashedPassword,
    balance: 75000,
    linkedBanks: [
      { bankName: 'HDFC Bank', accountNumber: '•••• 8821', isDefault: true }
    ],
    scratchCards: []
  };

  await db.create('users', seedRecruiter);
  console.log(`✅ Default Recruiter Profile created: ${seedRecruiter.email} (Wallet Balance: ₹${seedRecruiter.balance})`);

  // Seed Rohit Verma
  const seedRohit = {
    id: 'USR-ROHIT',
    name: 'Rohit Verma',
    email: 'rohit@indiapay.com',
    password: hashedPassword,
    balance: 15000,
    upiPin: '1234',
    cardNumber: '4532 8821 9012 9999',
    cardExpiry: '10/29',
    cardCvv: '999',
    linkedBanks: [
      { bankName: 'ICICI Bank', accountNumber: '•••• 9999', upiPin: '1234', isDefault: true }
    ],
    scratchCards: []
  };
  await db.create('users', seedRohit);
  console.log('✅ Temporary user 1 seeded: rohit@indiapay.com');

  // Seed Sneha Reddy
  const seedSneha = {
    id: 'USR-SNEHA',
    name: 'Sneha Reddy',
    email: 'sneha@indiapay.com',
    password: hashedPassword,
    balance: 20000,
    upiPin: '1234',
    cardNumber: '4532 8821 9012 8888',
    cardExpiry: '08/30',
    cardCvv: '888',
    linkedBanks: [
      { bankName: 'Axis Bank', accountNumber: '•••• 8888', upiPin: '1234', isDefault: true }
    ],
    scratchCards: []
  };
  await db.create('users', seedSneha);
  console.log('✅ Temporary user 2 seeded: sneha@indiapay.com');

  // 4. Create Flight Ticket Booking via UPI HDFC Bank
  console.log('\n[Step 2] Creating Flight Booking Ticket via UPI (HDFC Bank) checkout...');
  const reqBooking = {
    user: seedRecruiter,
    body: {
      serviceType: 'flight',
      details: {
        flightNo: '6E-501',
        origin: 'Delhi (DEL)',
        destination: 'Mumbai (BOM)',
        passenger: 'Juspay Recruiter'
      },
      amount: 4800,
      gatewayUsed: 'UPI (HDFC Bank)'
    }
  };

  await createBooking(reqBooking, createMockResponse(async (code, data) => {
    if (data.success) {
      const dbRecruiter = await db.findOne('users', { id: seedRecruiter.id });
      console.log(`✅ Booking transaction completed successfully! Ticket ID: ${data.booking.id}`);
      console.log(`   User wallet debited. New balance: ₹${dbRecruiter.balance}`);
      
      if (dbRecruiter.balance === 70200) { // 75000 - 4800 = 70200
        console.log('   ASSERT PASS: Wallet debited exactly ₹4,800 for the flight.');
      } else {
        console.error('   ASSERT FAIL: Wallet balance mismatch after flight booking.');
        process.exit(1);
      }
    } else {
      console.error('❌ Flight booking settlement failed:', data.error);
      process.exit(1);
    }
  }));

  // 5. Create Movie Booking via UPI SBI Bank
  console.log('\n[Step 3] Simulating Movie seat booking checkout via UPI (SBI Bank)...');
  const reqMovieBooking = {
    user: seedRecruiter,
    body: {
      serviceType: 'movie',
      details: {
        movieTitle: 'Avatar: The Way of Water',
        showtime: '03:30 pm',
        seats: ['F5', 'F6']
      },
      amount: 500,
      gatewayUsed: 'UPI (SBI Bank)'
    }
  };

  await createBooking(reqMovieBooking, createMockResponse(async (code, data) => {
    if (data.success) {
      const dbRecruiter = await db.findOne('users', { id: seedRecruiter.id });
      console.log(`✅ Movie Seats Booking completed! Ticket ID: ${data.booking.id}`);
      console.log(`   User wallet debited. New balance: ₹${dbRecruiter.balance}`);
      
      if (dbRecruiter.balance === 69700) { // 70200 - 500 = 69700
        console.log('   ASSERT PASS: Wallet debited exactly ₹500 for the movie tickets.');
      } else {
        console.error('   ASSERT FAIL: Wallet balance mismatch after movie booking.');
        process.exit(1);
      }
    } else {
      console.error('❌ Movie booking settlement failed:', data.error);
      process.exit(1);
    }
  }));

  // 6. Verify Passbook statements list
  console.log('\n[Step 4] Verifying final ledger statement logs...');
  const reqBookingsList = {
    user: seedRecruiter
  };

  await getMyBookings(reqBookingsList, createMockResponse((code, data) => {
    if (data.success) {
      console.log(`✅ Bookings history fetched. Found ${data.bookings.length} ticket reservations:`);
      data.bookings.forEach(b => {
        console.log(`   - [${b.id}] ${b.serviceType.toUpperCase()} Booking: ₹${b.amount} (${b.details.origin || b.details.movieTitle})`);
      });
      console.log('\n🎉 ALL GOOGLE PAY CLONE DIAGNOSTICS PASSED!');
      process.exit(0);
    } else {
      console.error('❌ Failed to fetch bookings:', data.error);
      process.exit(1);
    }
  }));
};

runDiagnostics().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
