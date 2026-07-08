import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, db } from './config/db.js';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    database: db.isFallback() ? 'local-json-fallback' : 'mongodb',
    stripeIntegration: process.env.STRIPE_SECRET_KEY ? 'active' : 'inactive_demo'
  });
});

// Diagnostic data reset endpoint (for testing/resetting database)
app.post('/api/diagnostics/reset', async (req, res) => {
  try {
    await db.deleteMany('users');
    await db.deleteMany('transactions');
    await db.deleteMany('links');
    res.status(200).json({ success: true, message: 'Database reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server
const startServer = async () => {
  // Connect to DB (Mongo or file-based fallback)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`AuraPay Server running at http://localhost:${PORT}`);
    console.log(`Environment: Development`);
    console.log(`Database status: ${db.isFallback() ? 'LOCAL JSON FALLBACK' : 'MONGODB'}`);
    console.log(`Stripe status: ${process.env.STRIPE_SECRET_KEY ? 'ACTIVE INTEGRATION' : 'INACTIVE (DEMO FALLBACK)'}`);
    console.log(`======================================================\n`);
  });
};

startServer();
