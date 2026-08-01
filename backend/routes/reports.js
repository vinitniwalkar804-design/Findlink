const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const { MissingPerson, FoundPerson, City, State, District } = require('../models/index');
const { computeEmbedding, addToIndex } = require('../services/faceMatching');

// POST /api/reports/missing
// Save a missing person report to MongoDB and precompute face embedding
// Helper: validate an ObjectId reference exists in the given collection
async function validateLocationId(id, Model, label) {
  if (!id) return null; // null/undefined is allowed (optional field)
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${label} ID format: ${id}`);
  }
  const doc = await Model.findById(id);
  if (!doc) {
    throw new Error(`${label} with ID ${id} not found in database`);
  }
  return doc;
}

router.post('/missing', async (req, res) => {
  try {
    const {
      reporterId,
      fullName,
      age,
      gender,
      photoUrl,
      lastSeenLocationId,
      lastSeenAddress,
      lastSeenDate,
      description,
    } = req.body;

    if (!reporterId) {
      return res.status(400).json({ error: 'reporterId is required' });
    }
    if (!fullName) {
      return res.status(400).json({ error: 'fullName is required' });
    }

    // Validate location IDs if provided
    if (lastSeenLocationId) {
      try {
        await validateLocationId(lastSeenLocationId, City, 'City');
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const missingPerson = await MissingPerson.create({
      reporterId,
      fullName,
      age: age || null,
      gender: gender || null,
      photoUrl: photoUrl || '',
      lastSeenLocationId: lastSeenLocationId || null,
      lastSeenAddress: lastSeenAddress || '',
      lastSeenDate: lastSeenDate || null,
      description: description || '',
      status: 'active',
    });

    // Precompute face embedding asynchronously (non-blocking)
    if (photoUrl) {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      const photoName = path.basename(photoUrl);
      const photoPath = path.join(uploadsDir, photoName);

      try {
        const result = await computeEmbedding(photoPath);
        if (result.embedding && result.embedding.length === 512) {
          await MissingPerson.findByIdAndUpdate(missingPerson._id, {
            faceEmbedding: result.embedding,
          });
          missingPerson.faceEmbedding = result.embedding;
          console.log('[EMBEDDING] Stored for ' + fullName + ' (' + missingPerson._id + ')');

          // Add to FAISS index for AI matching
          try {
            const addResult = await addToIndex(
              missingPerson._id.toString(),
              [result.embedding],
              fullName
            );
            console.log('[FAISS] Added to index: ' + addResult.added_count + ' vectors (total: ' + addResult.total_vectors + ')');
          } catch (faissErr) {
            console.warn('[FAISS] Could not add to index for ' + fullName + ': ' + faissErr.message);
            // Non-fatal: matching will skip this person if not in FAISS
          }
        }
      } catch (embErr) {
        console.warn('[EMBEDDING] Could not compute for ' + fullName + ': ' + embErr.message);
        // Non-fatal: matching will skip this person if no embedding
      }
    }

    res.status(201).json(missingPerson);
  } catch (err) {
    console.error('Error creating missing person report:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/found
// Save a found person report to MongoDB
router.post('/found', async (req, res) => {
  try {
    const {
      reporterId,
      photoUrl,
      foundLocationId,
      foundAddress,
      foundDate,
      description,
    } = req.body;

    if (!reporterId) {
      return res.status(400).json({ error: 'reporterId is required' });
    }

    // Validate location IDs if provided
    if (foundLocationId) {
      try {
        await validateLocationId(foundLocationId, City, 'City');
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const foundPerson = await FoundPerson.create({
      reporterId,
      photoUrl: photoUrl || '',
      foundLocationId: foundLocationId || null,
      foundAddress: foundAddress || '',
      foundDate: foundDate || null,
      description: description || '',
      status: 'unidentified',
    });

    res.status(201).json(foundPerson);
  } catch (err) {
    console.error('Error creating found person report:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
