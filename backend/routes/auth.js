const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Notification, MissingPerson, FoundPerson, AIMatchResult } = require('../models/index');

const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'findlink-jwt-secret-change-in-production';

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper: authenticate middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function sanitizeUser(user) {
  return {
    id: user._id,
    email: user.email,
    full_name: user.fullName,
    phone: user.phone,
    role: user.role,
    approval_status: user.approvalStatus,
    badge_number: user.badgeNumber,
    department: user.department,
    avatar_url: user.avatarUrl,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    console.log('=== SIGNUP REQUEST ===');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', JSON.stringify(req.body));
    console.log('Content-Type:', req.headers['content-type']);

    const { email, password, full_name, phone, role, badge_number, department } = req.body;

    console.log('Parsed fields:', { email: !!email, password: !!password, full_name: !!full_name, phone: !!phone, role: role, badge_number: !!badge_number, department: !!department });

    if (!email || !password || !full_name) {
      console.log('Validation FAILED: missing required fields');
      return res.status(400).json({ error: 'email, password, and full_name are required' });
    }
    if (password.length < 6) {
      console.log('Validation FAILED: password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    console.log('Checking for existing email:', email.toLowerCase());
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('Email already exists:', email.toLowerCase());
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    console.log('Email available, proceeding to create user');

    console.log('Creating user with data:', {
      email: email.toLowerCase(),
      passwordLength: password.length,
      fullName: full_name,
      phone: phone || '',
      role: role || 'citizen',
      badgeNumber: badge_number || '',
      department: department || '',
      approvalStatus: 'pending',
    });

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      fullName: full_name,
      phone: phone || '',
      role: role || 'citizen',
      badgeNumber: badge_number || '',
      department: department || '',
      approvalStatus: 'pending',
    });

    console.log('User created successfully. ID:', user._id);
    console.log('User role:', user.role);
    console.log('User approvalStatus:', user.approvalStatus);

    const token = generateToken(user);
    console.log('JWT generated, returning 201');

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('=== SIGNUP ERROR (500) ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full stack trace:');
    console.error(err.stack);
    if (err.errors) {
      console.error('Validation errors:', JSON.stringify(err.errors));
    }
    if (err.keyValue) {
      console.error('Duplicate key:', JSON.stringify(err.keyValue));
    }
    if (err.code === 11000) {
      console.error('This is a MongoDB duplicate key error');
    }
    res.status(500).json({ error: err.message, errorType: err.name, errorCode: err.code });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    console.log("Signin request");
    console.log(req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log("Finding user...");
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log(user);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log("Comparing password");
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log("Generating token");
    const token = generateToken(user);

    console.log("Returning response");
    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("SIGNIN ERROR");
    console.error(err);
    console.error(err.stack);
    return res.status(500).json({
      success:false,
      message:err.message,
      stack:err.stack
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users — list all users (admin only)
router.get('/users', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update a user profile
router.put('/users/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only admin or the user themselves can update
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    const { full_name, phone, avatar_url } = req.body;
    if (full_name !== undefined) user.fullName = full_name;
    if (phone !== undefined) user.phone = phone;
    if (avatar_url !== undefined) user.avatarUrl = avatar_url;

    await user.save();
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingPolice = await User.countDocuments({ role: 'police', approvalStatus: 'pending' });
    const activeMissing = await MissingPerson.countDocuments({ status: 'active' });
    const unidentifiedFound = await FoundPerson.countDocuments({ $or: [{ status: 'unidentified' }, { matchedMissingPersonId: null }] });
    const reunited = await FoundPerson.countDocuments({ status: 'reunited' });
    const pendingMatches = await AIMatchResult.countDocuments({ status: 'pending' });

    res.json({ totalUsers, pendingPolice, activeMissing, foundPersons: unidentifiedFound, reunited, pendingMatches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics — analytics data
router.get('/analytics', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const byRole = {
      family: await User.countDocuments({ role: 'family' }),
      citizen: await User.countDocuments({ role: 'citizen' }),
      police: await User.countDocuments({ role: 'police' }),
      admin: await User.countDocuments({ role: 'admin' }),
    };

    const missingByStatus = {
      active: await MissingPerson.countDocuments({ status: 'active' }),
      found: await MissingPerson.countDocuments({ status: 'found' }),
      closed: await MissingPerson.countDocuments({ status: 'closed' }),
    };

    const foundByStatus = {
      unidentified: await FoundPerson.countDocuments({ status: 'unidentified' }),
      identified: await FoundPerson.countDocuments({ status: 'identified' }),
      reunited: await FoundPerson.countDocuments({ status: 'reunited' }),
    };

    const totalMatches = await AIMatchResult.countDocuments();
    const confirmedMatches = await AIMatchResult.countDocuments({ status: 'confirmed' });

    const avgAgg = await AIMatchResult.aggregate([
      { $group: { _id: null, avg: { $avg: '$confidenceScore' } } },
    ]);
    const avgConfidence = avgAgg.length > 0 ? Math.round(avgAgg[0].avg * 100) / 100 : 0;

    res.json({ byRole, missingByStatus, foundByStatus, totalMatches, confirmedMatches, avgConfidence, missingTrend: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications — list notifications for current user
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs.map(n => ({
      id: n._id,
      user_id: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      related_id: n.relatedId,
      read: n.read,
      created_at: n.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Missing Persons API
// ============================================================

// GET /api/missing-persons — list missing persons (with optional status filter)
router.get('/missing-persons', async (req, res) => {
  try {
    const { status, reporterId } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (reporterId) filter.reporterId = reporterId;

    const persons = await MissingPerson.find(filter)
      .populate('reporterId', 'fullName email phone avatarUrl role')
      .sort({ createdAt: -1 });

    res.json(persons.map(p => ({
      id: p._id,
      reporter_id: p.reporterId?._id,
      full_name: p.fullName,
      age: p.age,
      gender: p.gender,
      photo_url: p.photoUrl,
      last_seen_location_id: p.lastSeenLocationId,
      last_seen_address: p.lastSeenAddress,
      last_seen_date: p.lastSeenDate,
      description: p.description,
      status: p.status,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      reporter: p.reporterId ? {
        id: p.reporterId._id,
        full_name: p.reporterId.fullName,
        phone: p.reporterId.phone,
      } : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/missing-persons/:id — update missing person status
router.put('/missing-persons/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'found', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const person = await MissingPerson.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!person) return res.status(404).json({ error: 'Missing person not found' });

    res.json({ success: true, id: person._id, status: person.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/missing-persons/my — get current user's missing person reports
router.get('/missing-persons/my', authenticate, async (req, res) => {
  try {
    const persons = await MissingPerson.find({ reporterId: req.user.id })
      .populate('reporterId', 'fullName email phone avatarUrl role')
      .sort({ createdAt: -1 });

    res.json(persons.map(p => ({
      id: p._id,
      reporter_id: p.reporterId?._id,
      full_name: p.fullName,
      age: p.age,
      gender: p.gender,
      photo_url: p.photoUrl,
      last_seen_location_id: p.lastSeenLocationId,
      last_seen_address: p.lastSeenAddress,
      last_seen_date: p.lastSeenDate,
      description: p.description,
      status: p.status,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Found Persons API
// ============================================================

// GET /api/found-persons — list found persons (with optional status filter)
router.get('/found-persons', async (req, res) => {
  try {
    const { status, reporterId } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (reporterId) filter.reporterId = reporterId;

    const persons = await FoundPerson.find(filter)
      .populate('reporterId', 'fullName email phone avatarUrl role')
      .sort({ createdAt: -1 });

    res.json(persons.map(p => ({
      id: p._id,
      reporter_id: p.reporterId?._id,
      photo_url: p.photoUrl,
      found_location_id: p.foundLocationId,
      found_address: p.foundAddress,
      found_date: p.foundDate,
      description: p.description,
      status: p.status,
      matched_missing_person_id: p.matchedMissingPersonId,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      reporter: p.reporterId ? {
        id: p.reporterId._id,
        full_name: p.reporterId.fullName,
        phone: p.reporterId.phone,
      } : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/found-persons/:id — update found person status
router.put('/found-persons/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['unidentified', 'identified', 'reunited'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const person = await FoundPerson.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!person) return res.status(404).json({ error: 'Found person not found' });

    res.json({ success: true, id: person._id, status: person.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/found-persons/my — get current user's found person reports
router.get('/found-persons/my', authenticate, async (req, res) => {
  try {
    const persons = await FoundPerson.find({ reporterId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(persons.map(p => ({
      id: p._id,
      photo_url: p.photoUrl,
      found_address: p.foundAddress,
      found_date: p.foundDate,
      description: p.description,
      status: p.status,
      created_at: p.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Face Matches API
// ============================================================

// GET /api/face-matches — list face matches (with optional filters)
router.get('/face-matches', async (req, res) => {
  try {
    const { status, missingPersonIds } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (missingPersonIds) {
      const ids = missingPersonIds.split(',');
      filter.missingPersonId = { $in: ids };
    }

    const matches = await AIMatchResult.find(filter)
      .populate('missingPersonId')
      .populate('foundPersonId')
      .sort({ confidenceScore: -1 });

    res.json(matches.map(m => ({
      id: m._id,
      found_person_id: m.foundPersonId?._id,
      missing_person_id: m.missingPersonId?._id,
      confidence_score: m.confidenceScore,
      match_rank: m.matchRank,
      status: m.status,
      created_at: m.createdAt,
      missing_person: m.missingPersonId ? {
        id: m.missingPersonId._id,
        full_name: m.missingPersonId.fullName,
        photo_url: m.missingPersonId.photoUrl,
        status: m.missingPersonId.status,
      } : null,
      found_person: m.foundPersonId ? {
        id: m.foundPersonId._id,
        photo_url: m.foundPersonId.photoUrl,
        found_address: m.foundPersonId.foundAddress,
        found_date: m.foundPersonId.foundDate,
        description: m.foundPersonId.description,
      } : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/face-matches/:id — update match status
router.put('/face-matches/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const match = await AIMatchResult.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    match.status = status;
    match.reviewedBy = req.user.id;
    await match.save();

    // If confirmed, also update found person and missing person
    if (status === 'confirmed') {
      await FoundPerson.findByIdAndUpdate(match.foundPersonId, {
        status: 'identified',
        matchedMissingPersonId: match.missingPersonId,
      });
      await MissingPerson.findByIdAndUpdate(match.missingPersonId, {
        status: 'found',
      });
    }

    res.json({ success: true, id: match._id, status: match.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Reports API (Admin)
// ============================================================

// GET /api/reports — list all reports (admin)
router.get('/reports', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const missing = await MissingPerson.find()
      .populate('reporterId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    const found = await FoundPerson.find()
      .populate('reporterId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    const reports = [
      ...missing.map(p => ({
        id: p._id,
        reporter_id: p.reporterId?._id,
        report_type: 'missing',
        reference_id: p._id,
        created_at: p.createdAt,
        reporter: p.reporterId || null,
      })),
      ...found.map(p => ({
        id: p._id,
        reporter_id: p.reporterId?._id,
        report_type: 'found',
        reference_id: p._id,
        created_at: p.createdAt,
        reporter: p.reporterId || null,
      })),
    ];

    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Audit Logs API (Admin)
// ============================================================

// GET /api/audit-logs — list audit logs (admin)
router.get('/audit-logs', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Use CaseHistory as audit logs
    const CaseHistory = require('../models/index').CaseHistory;
    const logs = await CaseHistory.find()
      .populate('actionBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs.map(l => ({
      id: l._id,
      actor_id: l.actionBy?._id,
      action: l.action,
      target_type: l.missingPersonId ? 'missing_person' : 'found_person',
      target_id: l.missingPersonId || l.foundPersonId,
      details: { description: l.description, statusBefore: l.statusBefore, statusAfter: l.statusAfter },
      created_at: l.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, authenticate };