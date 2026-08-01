const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const { User, MissingPerson, FoundPerson, Notification } = require('../models/index');

// GET /api/admin/stats
// Returns dashboard statistics from MongoDB
router.get('/stats', async (req, res) => {
  try {
    const activeMissing = await MissingPerson.countDocuments({
      status: { $in: ['active'] }
    });

    const unidentifiedFound = await FoundPerson.countDocuments({
      $or: [
        { status: 'unidentified' },
        { matchedMissingPersonId: null }
      ]
    });

    const reunited = await FoundPerson.countDocuments({
      status: 'reunited'
    });

    res.json({
      activeMissing,
      unidentifiedFound,
      reunited
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/pending-police
// Returns all police users with pending approval status from MongoDB
router.get('/pending-police', authenticate, async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: 'police',
      approvalStatus: 'pending'
    }).sort({ createdAt: -1 }).lean();

    const result = pendingUsers.map(u => ({
      id: u._id.toString(),
      full_name: u.fullName,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      approval_status: u.approvalStatus,
      badge_number: u.badgeNumber || '',
      department: u.department || '',
      avatar_url: u.avatarUrl || '',
      created_at: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
      updated_at: u.updatedAt ? u.updatedAt.toISOString() : new Date().toISOString(),
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching pending police:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/approve-police
// Approve a police officer registration — updates MongoDB User document by _id
router.post('/approve-police', authenticate, async (req, res) => {
  try {
    const { police_id } = req.body;
    if (!police_id) {
      return res.status(400).json({ error: 'police_id is required' });
    }

    const user = await User.findById(police_id);
    if (!user) {
      return res.status(404).json({ error: 'Police user not found in database' });
    }

    user.approvalStatus = 'approved';
    user.approvedAt = new Date();
    await user.save();

    try {
      await Notification.create({
        userId: user._id,
        title: 'Police Registration Approved',
        message: 'Your police registration has been approved. You can now access the police dashboard.',
        type: 'approval',
      });
    } catch (notifErr) {
      console.warn('Notification creation skipped (non-blocking):', notifErr);
    }

    res.json({ success: true, message: 'Police officer approved successfully' });
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reject-police
// Reject a police officer registration — updates MongoDB User document by _id
router.post('/reject-police', authenticate, async (req, res) => {
  try {
    const { police_id } = req.body;
    if (!police_id) {
      return res.status(400).json({ error: 'police_id is required' });
    }

    const user = await User.findById(police_id);
    if (!user) {
      return res.status(404).json({ error: 'Police user not found in database' });
    }

    user.approvalStatus = 'rejected';
    await user.save();

    try {
      await Notification.create({
        userId: user._id,
        title: 'Police Registration Rejected',
        message: 'Your police registration has been rejected. Please contact support for more information.',
        type: 'approval',
      });
    } catch (notifErr) {
      console.warn('Notification creation skipped (non-blocking):', notifErr);
    }

    res.json({ success: true, message: 'Police officer rejected' });
  } catch (err) {
    console.error('Rejection error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
