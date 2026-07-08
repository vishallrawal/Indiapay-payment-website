import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let isFallbackMode = false;
const DATA_DIR = path.resolve('./.data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readLocalFile = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading local database file for ${collection}:`, err);
    return [];
  }
};

const writeLocalFile = (collection, data) => {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing local database file for ${collection}:`, err);
  }
};

// Mongoose Schema Definitions
const Schemas = {
  users: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    upiPin: { type: String, default: '1234' },
    cardNumber: { type: String, default: '4532 8821 9012 3456' },
    cardExpiry: { type: String, default: '12/30' },
    cardCvv: { type: String, default: '321' },
    linkedBanks: [{
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      upiPin: { type: String, default: '1234' },
      isDefault: { type: Boolean, default: false }
    }],
    scratchCards: [{
      id: { type: String, required: true },
      status: { type: String, default: 'unscratched' }, // unscratched, scratched
      amount: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }),

  messages: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    senderEmail: { type: String, required: true },
    receiverEmail: { type: String, required: true },
    type: { type: String, required: true }, // message, payment_send, payment_request
    amount: { type: Number, default: 0 },
    status: { type: String, default: 'success' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }),

  groups: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    creatorEmail: { type: String, required: true },
    members: [String],
    totalAmount: { type: Number, required: true },
    splits: [{
      email: { type: String, required: true },
      amount: { type: Number, required: true },
      status: { type: String, default: 'pending' }
    }],
    createdAt: { type: Date, default: Date.now }
  }),

  transactions: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // load, transfer, booking, split_settle, reward_credit
    senderEmail: { type: String },
    receiverEmail: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'success' },
    gateway: { type: String }, // stripe, razorpay, paytm, braintree, wallet_p2p, demo_fallback
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
  }),

  bookings: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true },
    serviceType: { type: String, required: true }, // flight, train, bus, movie
    details: { type: Object, required: true }, // e.g. flight details or seat numbers
    amount: { type: Number, required: true },
    status: { type: String, default: 'success' },
    createdAt: { type: Date, default: Date.now }
  }),

  gateways: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    successRate: { type: Number, required: true }, // out of 100
    latency: { type: Number, required: true }, // in milliseconds
    costPercent: { type: Number, required: true }, // fee percentage e.g. 1.8%
    isActive: { type: Boolean, default: true }
  })
};

const Models = {};
try {
  Models.users = mongoose.model('User', Schemas.users);
  Models.messages = mongoose.model('Message', Schemas.messages);
  Models.groups = mongoose.model('Group', Schemas.groups);
  Models.transactions = mongoose.model('Transaction', Schemas.transactions);
  Models.bookings = mongoose.model('Booking', Schemas.bookings);
  Models.gateways = mongoose.model('Gateway', Schemas.gateways);
} catch (e) {
  Models.users = mongoose.models.User;
  Models.messages = mongoose.models.Message;
  Models.groups = mongoose.models.Group;
  Models.transactions = mongoose.models.Transaction;
  Models.bookings = mongoose.models.Booking;
  Models.gateways = mongoose.models.Gateway;
}

// Database helper functions
export const db = {
  isFallback: () => isFallbackMode,

  find: async (collection) => {
    if (!isFallbackMode) {
      try {
        const docs = await Models[collection].find({}).lean();
        return docs;
      } catch (err) {
        console.error(`MongoDB error on find in ${collection}, falling back locally:`, err);
      }
    }
    return readLocalFile(collection);
  },

  findOne: async (collection, query) => {
    if (!isFallbackMode) {
      try {
        const doc = await Models[collection].findOne(query).lean();
        return doc;
      } catch (err) {
        console.error(`MongoDB error on findOne in ${collection}, falling back locally:`, err);
      }
    }
    const data = readLocalFile(collection);
    return data.find(item => {
      return Object.entries(query).every(([key, val]) => item[key] === val);
    }) || null;
  },

  create: async (collection, doc) => {
    const timestampedDoc = {
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString()
    };
    if (!isFallbackMode) {
      try {
        const newDoc = new Models[collection](timestampedDoc);
        await newDoc.save();
        return newDoc.toObject();
      } catch (err) {
        console.error(`MongoDB error on create in ${collection}, falling back locally:`, err);
      }
    }
    const data = readLocalFile(collection);
    data.push(timestampedDoc);
    writeLocalFile(collection, data);
    return timestampedDoc;
  },

  update: async (collection, query, updateFields) => {
    if (!isFallbackMode) {
      try {
        const updated = await Models[collection].findOneAndUpdate(
          query,
          { $set: updateFields },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.error(`MongoDB error on update in ${collection}, falling back locally:`, err);
      }
    }
    const data = readLocalFile(collection);
    let updatedDoc = null;
    const updatedData = data.map(item => {
      const match = Object.entries(query).every(([key, val]) => item[key] === val);
      if (match) {
        updatedDoc = { ...item, ...updateFields };
        return updatedDoc;
      }
      return item;
    });
    if (updatedDoc) {
      writeLocalFile(collection, updatedData);
    }
    return updatedDoc;
  },

  deleteMany: async (collection, query = {}) => {
    if (!isFallbackMode) {
      try {
        await Models[collection].deleteMany(query);
        return true;
      } catch (err) {
        console.error(`MongoDB error on deleteMany in ${collection}, falling back locally:`, err);
      }
    }
    if (Object.keys(query).length === 0) {
      writeLocalFile(collection, []);
    } else {
      const data = readLocalFile(collection);
      const filtered = data.filter(item => {
        return !Object.entries(query).every(([key, val]) => item[key] === val);
      });
      writeLocalFile(collection, filtered);
    }
    return true;
  }
};

// Seed mock data for GPay checkout nodes & default recruiter profile
const seedDatabase = async () => {
  console.log('Checking database seeding requirement...');
  try {
    const users = await db.find('users');
    const hasRecruiter = users.some(u => u.email === 'recruiter@juspay.com');

    if (!hasRecruiter) {
      console.log('Seeding GPay/IndiaPay default user profile...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.create('users', {
        id: 'USR-RECRUITER-GPAY',
        name: 'IndiaPay User',
        email: 'recruiter@juspay.com',
        password: hashedPassword,
        balance: 75000,
        upiPin: '1234',
        cardNumber: '4532 8821 9012 3456',
        cardExpiry: '12/30',
        cardCvv: '321',
        linkedBanks: [
          { bankName: 'HDFC Bank', accountNumber: '•••• 8821', upiPin: '1234', isDefault: true },
          { bankName: 'State Bank of India', accountNumber: '•••• 5821', upiPin: '1234', isDefault: false }
        ],
        scratchCards: [
          { id: 'SCR-SEED-01', status: 'unscratched', amount: 85 },
          { id: 'SCR-SEED-02', status: 'scratched', amount: 15 }
        ]
      });
    }

    // Seed Rohit Verma
    const hasRohit = users.some(u => u.email === 'rohit@indiapay.com');
    if (!hasRohit) {
      console.log('Seeding Rohit Verma profile...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.create('users', {
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
      });
    }

    // Seed Sneha Reddy
    const hasSneha = users.some(u => u.email === 'sneha@indiapay.com');
    if (!hasSneha) {
      console.log('Seeding Sneha Reddy profile...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.create('users', {
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
      });
    }

    // Seed mock gateways health parameters
    const gateways = await db.find('gateways');
    if (gateways.length === 0) {
      console.log('Seeding mock payment gateways metadata...');
      const seeds = [
        { id: 'GW-RAZORPAY', name: 'Razorpay', successRate: 98.4, latency: 180, costPercent: 1.8 },
        { id: 'GW-STRIPE', name: 'Stripe API', successRate: 99.1, latency: 140, costPercent: 2.9 },
        { id: 'GW-PAYTM', name: 'Paytm Business', successRate: 93.8, latency: 260, costPercent: 1.2 },
        { id: 'GW-BRAINTREE', name: 'Braintree', successRate: 96.5, latency: 210, costPercent: 2.4 }
      ];
      for (const item of seeds) {
        await db.create('gateways', item);
      }
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aurapay';
  console.log(`Connecting to MongoDB at: ${mongoURI}`);
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB connected successfully.');
    isFallbackMode = false;
  } catch (err) {
    console.warn('\n======================================================');
    console.warn('WARNING: Failed to connect to MongoDB.');
    console.warn('Reason:', err.message);
    console.warn('Falling back to LOCAL JSON FILE-BASED DATABASE mode.');
    console.warn(`Files will be saved in: ${DATA_DIR}`);
    console.warn('======================================================\n');
    isFallbackMode = true;
  }
  
  // Always trigger seed check on connection
  await seedDatabase();
};
