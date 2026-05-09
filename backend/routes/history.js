const express = require('express');
const Analysis = require('../src/models/Analysis');
const { authMiddleware } = require('../src/middleware/auth');
const { mongodbOperations } = require('../src/metrics/prometheus');

const router = express.Router();

// GET /api/history — paginated history for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  try {
    const [analyses, total] = await Promise.all([
      Analysis.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('+codeSnippet'),

      Analysis.countDocuments({ userId: req.user.id })
    ]);

    mongodbOperations.inc({
      operation: 'find',
      collection: 'analyses'
    });

    res.json({
      analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch history'
    });
  }
});

// GET /api/history/stats — aggregate stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await Analysis.aggregate([
      {
        $match: {
          userId: req.user.id
        }
      },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgScore: { $avg: { $cond: [{ $ne: ['$score', null] }, '$score', null] } },
          totalScored: { $sum: { $cond: [{ $ne: ['$score', null] }, 1, 0] } },
          totalTokens: { $sum: '$tokensUsed' },
          avgDuration: { $avg: '$durationMs' },
          byMode: { $push: '$mode' },
          byLanguage: { $push: '$language' }
        }
      },
      {
        $project: {
          totalAnalyses: 1,
          avgScore: { $cond: [{ $gt: ['$totalScored', 0] }, '$avgScore', 0] },
          totalTokens: 1,
          avgDuration: 1,
          byMode: 1,
          byLanguage: 1
        }
      }
    ]);

    mongodbOperations.inc({
      operation: 'aggregate',
      collection: 'analyses'
    });

    res.json(
      stats[0] || {
        totalAnalyses: 0,
        avgScore: 0,
        totalTokens: 0
      }
    );

  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch stats'
    });
  }
});

// PUT /api/history/:id/pin — toggle pin status
router.put('/:id/pin', authMiddleware, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      [
        {
          $set: {
            isPinned: { $not: '$isPinned' }
          }
        }
      ],
      { new: true }
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    mongodbOperations.inc({ operation: 'update', collection: 'analyses' });
    res.json({ success: true, isPinned: analysis.isPinned, analysis });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

// PUT /api/history/:id/archive — toggle archive status
router.put('/:id/archive', authMiddleware, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      [
        {
          $set: {
            isArchived: { $not: '$isArchived' }
          }
        }
      ],
      { new: true }
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    mongodbOperations.inc({ operation: 'update', collection: 'analyses' });
    res.json({ success: true, isArchived: analysis.isArchived, analysis });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle archive' });
  }
});

// PUT /api/history/:id/rate — rate analysis quality
router.put('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    // Validate rating: -1 (bad), 0 (neutral), 1 (good)
    if (![  -1, 0, 1].includes(rating)) {
      return res.status(400).json({ error: 'Rating must be -1, 0, or 1' });
    }

    const analysis = await Analysis.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      {
        qualityRating: rating,
        ...(feedback && { userFeedback: feedback })
      },
      { new: true }
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    mongodbOperations.inc({
      operation: 'update',
      collection: 'analyses'
    });

    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ error: 'Failed to rate analysis' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    mongodbOperations.inc({
      operation: 'delete',
      collection: 'analyses'
    });

    res.json({
      message: 'Deleted successfully'
    });

  } catch (err) {
    res.status(500).json({
      error: 'Failed to delete analysis'
    });
  }
});

module.exports = router;