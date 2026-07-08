import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aurapay-secret-token-key-12345';

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
  }

  try {
    const existingUser = await db.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email address already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'USR-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const newUser = await db.create('users', {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      balance: 0 // starting wallet balance INR 0
    });

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        balance: newUser.balance
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const user = await db.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Middleware to authenticate JWT tokens
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findOne('users', { id: decoded.userId });
    
    if (!user) {
      return res.status(403).json({ success: false, error: 'Session expired or user deleted.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ success: false, error: 'Invalid token.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await db.findOne('users', { id: req.user.id });
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        upiPin: user.upiPin || '1234',
        cardNumber: user.cardNumber || '4532 8821 9012 3456',
        cardExpiry: user.cardExpiry || '12/30',
        cardCvv: user.cardCvv || '321'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { name, balance, upiPin, cardNumber, cardExpiry, cardCvv, linkedBanks } = req.body;
  try {
    const updateObj = {
      name,
      balance: Number(balance),
      upiPin,
      cardNumber,
      cardExpiry,
      cardCvv
    };
    if (linkedBanks) {
      updateObj.linkedBanks = linkedBanks;
    }
    const updatedUser = await db.update('users', { id: req.user.id }, updateObj);
    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        balance: updatedUser.balance,
        upiPin: updatedUser.upiPin,
        cardNumber: updatedUser.cardNumber,
        cardExpiry: updatedUser.cardExpiry,
        cardCvv: updatedUser.cardCvv,
        linkedBanks: updatedUser.linkedBanks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
