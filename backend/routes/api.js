

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate } = require('./auth');

const {
  User,
  Notification,
  MissingPerson,
  FoundPerson,
  AIMatchResult,
  CaseHistory,
} = require('../models/index');

// GET /api/stats — dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingPolice = await User.countDocuments({ role: 'police', approvalStatus: 'pending' });
    const activeMissing = await MissingPerson.countDocuments({ status: 'active' });
    const unidentifiedFound = await FoundPerson.countDocuments({
      $or: [{ status: 'unidentified' }, { matchedMissingPersonId: null }],
    });
    const reunited = await FoundPerson.countDocuments({ status: 'reunited' });
    const pendingMatches = await AIMatchResult.countDocuments({ status: 'pending' });

    res.json({ totalUsers, pendingPolice, activeMissing, foundPersons: unidentifiedFound, reunited, pendingMatches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics — analytics data (admin)
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

// GET /api/users — list all users (admin only)
router.get('/users', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find().sort({ createdAt: -1 });
    res.json(
      users.map((u) => ({
        id: u._id,
        email: u.email,
        full_name: u.fullName,
        phone: u.phone,
        role: u.role,
        approval_status: u.approvalStatus,
        badge_number: u.badgeNumber,
        department: u.department,
        avatar_url: u.avatarUrl,
        created_at: u.createdAt,
        updated_at: u.updatedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update a user profile
router.put('/users/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    const { full_name, phone, avatar_url } = req.body;
    if (full_name !== undefined) user.fullName = full_name;
    if (phone !== undefined) user.phone = phone;
    if (avatar_url !== undefined) user.avatarUrl = avatar_url;

    await user.save();
    res.json({
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
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/missing-persons — list missing persons
router.get('/missing-persons', async (req, res) => {
  try {
    const { status, reporterId } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (reporterId) filter.reporterId = reporterId;

    const persons = await MissingPerson.find(filter)
      .populate('reporterId', 'fullName phone')
      .sort({ createdAt: -1 });

    res.json(
      persons.map((p) => ({
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
        reporter: p.reporterId
          ? { id: p.reporterId._id, full_name: p.reporterId.fullName, phone: p.reporterId.phone }
          : null,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/missing-persons/:id — delete a missing person report
router.delete('/missing-persons/:id', authenticate, async (req, res) => {
  try {
    const person = await MissingPerson.findByIdAndDelete(req.params.id);
    if (!person) return res.status(404).json({ error: 'Missing person not found' });

    // Keep the FAISS index in sync: remove the deleted person's vectors
    try {
      const result = await removeFromIndex(person._id.toString());
      if (result && result.removed_count > 0) {
        console.log(`[FAISS] Removed ${result.removed_count} vector(s) for deleted missing person ${person._id}`);
      }
    } catch (err) {
      console.warn(`[FAISS] Could not remove ${person._id} from index: ${err.message}`);
      // Non-fatal: index cleanup is best-effort
    }

    res.json({ success: true, message: 'Missing person report deleted' });
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
      return res.status(400).json({ error: 'Status must be one of: ' + validStatuses.join(', ') });
    }

    const person = await MissingPerson.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!person) return res.status(404).json({ error: 'Missing person not found' });

    res.json({ success: true, id: person._id, status: person.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/missing-persons/my — get current user's reports
router.get('/missing-persons/my', authenticate, async (req, res) => {
  try {
    const persons = await MissingPerson.find({ reporterId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(
      persons.map((p) => ({
        id: p._id,
        full_name: p.fullName,
        age: p.age,
        gender: p.gender,
        photo_url: p.photoUrl,
        last_seen_address: p.lastSeenAddress,
        last_seen_date: p.lastSeenDate,
        description: p.description,
        status: p.status,
        created_at: p.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Found Persons API
// ============================================================

// GET /api/found-persons — list found persons (public)
router.get('/found-persons', async (req, res) => {
  try {
    const { status, reporterId } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (reporterId) filter.reporterId = reporterId;

    const persons = await FoundPerson.find(filter)
      .populate('reporterId', 'fullName phone')
      .sort({ createdAt: -1 });

    res.json(
      persons.map((p) => ({
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
        reporter: p.reporterId
          ? { id: p.reporterId._id, full_name: p.reporterId.fullName, phone: p.reporterId.phone }
          : null,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/found-persons/:id — delete a found person report
router.delete('/found-persons/:id', authenticate, async (req, res) => {
  try {
    const person = await FoundPerson.findByIdAndDelete(req.params.id);
    if (!person) return res.status(404).json({ error: 'Found person not found' });
    res.json({ success: true, message: 'Found person report deleted' });
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
      return res.status(400).json({ error: 'Status must be one of: ' + validStatuses.join(', ') });
    }

    const person = await FoundPerson.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!person) return res.status(404).json({ error: 'Found person not found' });

    res.json({ success: true, id: person._id, status: person.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/found-persons/my — get current user's reports
router.get('/found-persons/my', authenticate, async (req, res) => {
  try {
    const persons = await FoundPerson.find({ reporterId: req.user.id }).sort({ createdAt: -1 });
    res.json(
      persons.map((p) => ({
        id: p._id,
        photo_url: p.photoUrl,
        found_address: p.foundAddress,
        found_date: p.foundDate,
        description: p.description,
        status: p.status,
        created_at: p.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Face Matches API
// ============================================================

// GET /api/face-matches — list face matches
router.get('/face-matches', async (req, res) => {
  try {
    const { status, missingPersonIds } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (missingPersonIds) {
      filter.missingPersonId = { $in: missingPersonIds.split(',') };
    }

    const matches = await AIMatchResult.find(filter)
      .populate('missingPersonId')
      .populate('foundPersonId')
      .sort({ confidenceScore: -1 });

    res.json(
      matches.map((m) => ({
        id: m._id,
        found_person_id: m.foundPersonId?._id,
        missing_person_id: m.missingPersonId?._id,
        confidence_score: m.confidenceScore,
        match_rank: m.matchRank,
        status: m.status,
        created_at: m.createdAt,
        missing_person: m.missingPersonId
          ? {
              id: m.missingPersonId._id,
              full_name: m.missingPersonId.fullName,
              photo_url: m.missingPersonId.photoUrl,
              status: m.missingPersonId.status,
            }
          : null,
        found_person: m.foundPersonId
          ? {
              id: m.foundPersonId._id,
              photo_url: m.foundPersonId.photoUrl,
              found_address: m.foundPersonId.foundAddress,
              found_date: m.foundPersonId.foundDate,
              description: m.foundPersonId.description,
            }
          : null,
      }))
    );
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
      return res.status(400).json({ error: 'Status must be one of: ' + validStatuses.join(', ') });
    }

    const match = await AIMatchResult.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    match.status = status;
    match.reviewedBy = req.user.id;
    await match.save();

    if (status === 'confirmed') {
      await FoundPerson.findByIdAndUpdate(match.foundPersonId, {
        status: 'identified',
        matchedMissingPersonId: match.missingPersonId,
      });
      await MissingPerson.findByIdAndUpdate(match.missingPersonId, { status: 'found' });
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
      ...missing.map((p) => ({
        id: p._id,
        reporter_id: p.reporterId?._id,
        report_type: 'missing',
        reference_id: p._id,
        created_at: p.createdAt,
        reporter: p.reporterId || null,
      })),
      ...found.map((p) => ({
        id: p._id,
        reporter_id: p.reporterId?._id,
        report_type: 'found',
        reference_id: p._id,
        created_at: p.createdAt,
        reporter: p.reporterId || null,
      })),
    ];

    reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

    const logs = await CaseHistory.find()
      .populate('actionBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(
      logs.map((l) => ({
        id: l._id,
        actor_id: l.actionBy?._id,
        action: l.action,
        target_type: l.missingPersonId ? 'missing_person' : 'found_person',
        target_id: l.missingPersonId || l.foundPersonId,
        details: { description: l.description, statusBefore: l.statusBefore, statusAfter: l.statusAfter },
        created_at: l.createdAt,
        actor: l.actionBy || null,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Notifications API
// ============================================================

// GET /api/notifications — list notifications for current user
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(
      notifs.map((n) => ({
        id: n._id,
        user_id: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        related_id: n.relatedId,
        read: n.read,
        created_at: n.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read — mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Image Upload API
// ============================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported image format. Use JPG, JPEG, PNG, or WEBP.'));
    }
  },
});

// POST /api/upload — upload an image
router.post('/upload', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const url = '/uploads/' + req.file.filename;
  res.json({ url, error: null });
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || (err.message && err.message.includes('image'))) {
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
  next(err);
});

// ============================================================
// Police: Upload Found Person + AI Match (using stored embeddings)
// ============================================================

const { findMatches, computeEmbedding, addToIndex, removeFromIndex, getDebugInfo, getThreshold } = require('../services/faceMatching');

// ============================================================
// Debug endpoint for face recognition system
// ============================================================

// GET /api/debug/face — face recognition system debug info
router.get('/debug/face', authenticate, async (req, res) => {
  try {
    const debugInfo = await getDebugInfo();
    res.json(debugInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/police/upload-found — police uploads found person, runs AI matching
router.post('/police/upload-found', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'police') {
      return res.status(403).json({ error: 'Only police officers can upload found persons' });
    }

    const { photoUrl, possibleName, gender, estimatedAge, description } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'Photo URL is required. Upload a photo first.' });
    }

    // Create FoundPerson record
    const foundPerson = await FoundPerson.create({
      reporterId: req.user.id,
      photoUrl,
      fullName: possibleName || undefined,
      gender: gender || undefined,
      age: estimatedAge ? parseInt(estimatedAge) : undefined,
      description: description || '',
      foundDate: new Date(),
      status: 'unidentified',
    });

    // Fetch active missing persons and filter for those with stored embeddings in Node.
    const activeMissing = await MissingPerson.find(
      { status: 'active' },
      { _id: 1, fullName: 1, photoUrl: 1, faceEmbedding: 1, lastSeenAddress: 1, lastSeenDate: 1, age: 1, gender: 1, description: 1, status: 1, reporterId: 1 }
    ).lean();

    const activeMissingWithEmbeddings = activeMissing.filter((person) =>
      Array.isArray(person.faceEmbedding) && person.faceEmbedding.length > 0
    ).map((person) => ({
      ...person,
      _id: person._id && person._id.toString ? person._id.toString() : person._id,
      fullName: person.fullName || person.full_name || '',
      faceEmbedding: person.faceEmbedding,
    }));

    // Run face matching using stored embeddings (no per-image re-processing)
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const result = await findMatches(photoUrl, activeMissingWithEmbeddings, uploadsDir);

    // Save AI match results to database
    const allCandidates = result.candidates || [];
    const savedMatches = [];
    const candidateMatches = allCandidates.filter((candidate) => {
      const score = Number(candidate.similarity || 0);
      return Number.isFinite(score) && score > 0;
    });

    const activeMissingById = new Map(
      activeMissingWithEmbeddings.map((person) => [person._id, person])
    );

    for (const candidate of candidateMatches) {
      const missingPersonId = candidate.missingPersonId || candidate.person_id || candidate.missing_person_id;
      const normalizedId = typeof missingPersonId === 'string' ? missingPersonId : missingPersonId?.toString?.();
      const candidateName = candidate.fullName || candidate.full_name || candidate.person_name || '';

      let matchingPerson = null;
      if (normalizedId && mongoose.Types.ObjectId.isValid(normalizedId)) {
        matchingPerson = activeMissingById.get(normalizedId);
      }

      if (!matchingPerson && candidateName) {
        matchingPerson = activeMissingWithEmbeddings.find((person) =>
          (person.fullName || '').toLowerCase() === candidateName.toLowerCase()
        );
      }

      if (!matchingPerson) {
        console.warn('[MATCH] Skipping candidate with no matching active missing person:', { normalizedId, candidateName });
        continue;
      }

      const persistedId = matchingPerson._id;

      const saved = await AIMatchResult.create({
        foundPersonId: foundPerson._id,
        missingPersonId: persistedId,
        confidenceScore: candidate.similarity || 0,
        matchRank: candidate.match_rank || candidate.matchRank || 0,
        status: 'pending',
      });
      savedMatches.push(saved);
    }

    // Populate match results with missing person data for the response
    const populatedMatches = [];
    for (const sm of savedMatches) {
      const populated = await AIMatchResult.findById(sm._id)
        .populate('missingPersonId')
        .populate('foundPersonId');

      if (populated && populated.missingPersonId) {
        let reporterInfo = null;
        if (populated.missingPersonId.reporterId) {
          try {
            const rep = await User.findById(populated.missingPersonId.reporterId, 'fullName phone');
            if (rep) {
              reporterInfo = { id: rep._id, full_name: rep.fullName, phone: rep.phone };
            }
          } catch (e) { /* ignore */ }
        }

        populatedMatches.push({
          id: populated._id,
          found_person_id: populated.foundPersonId?._id,
          missing_person_id: populated.missingPersonId._id,
          confidence_score: populated.confidenceScore,
          match_rank: populated.matchRank,
          status: populated.status,
          created_at: populated.createdAt,
          missing_person: {
            id: populated.missingPersonId._id,
            full_name: populated.missingPersonId.fullName,
            photo_url: populated.missingPersonId.photoUrl,
            last_seen_address: populated.missingPersonId.lastSeenAddress,
            last_seen_date: populated.missingPersonId.lastSeenDate,
            age: populated.missingPersonId.age,
            gender: populated.missingPersonId.gender,
            description: populated.missingPersonId.description,
            status: populated.missingPersonId.status,
            reporter: reporterInfo,
          },
        });
      }
    }

    populatedMatches.sort((a, b) => b.confidence_score - a.confidence_score);
    populatedMatches.forEach((m, i) => { m.match_rank = i + 1; });

    res.status(201).json({
      found_person: {
        id: foundPerson._id,
        photo_url: foundPerson.photoUrl,
        possible_name: foundPerson.fullName || null,
        gender: foundPerson.gender || null,
        estimated_age: foundPerson.age || null,
        description: foundPerson.description || '',
        status: foundPerson.status,
        found_date: foundPerson.foundDate,
        created_at: foundPerson.createdAt,
      },
      matches: populatedMatches,
      match_count: populatedMatches.length,
    });
  } catch (err) {
    console.error('Error in police upload-found:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
