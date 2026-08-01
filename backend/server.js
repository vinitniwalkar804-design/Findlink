require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const locationRoutes = require('./routes/locations');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const { router: authRoutes } = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink';

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files from backend/uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);
app.use('/api', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Seed default admin user on startup
async function seedAdmin() {
  const bcrypt = require('bcryptjs');
  const { User } = require('./models/index');

  const adminEmail = 'vinitniwalkar@gmail.com';
  const existing = await User.findOne({ email: adminEmail.toLowerCase() });

  if (existing) {
    console.log(`Admin user already exists: ${existing.email} (ID: ${existing._id})`);
    return;
  }

  const hashedPassword = await bcrypt.hash('vinit@2006', 12);
  const admin = await User.create({
    email: adminEmail.toLowerCase(),
    password: hashedPassword,
    fullName: 'Vinit Niwalkar',
    phone: '',
    role: 'admin',
    approvalStatus: 'approved',
    badgeNumber: '',
    department: '',
    avatarUrl: '',
  });

  console.log(`Admin user created successfully: ${admin.email} (ID: ${admin._id})`);
}

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();