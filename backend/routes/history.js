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
          avgScore: { $avg: '$score' },
          totalTokens: { $sum: '$tokensUsed' },
          avgDuration: { $avg: '$durationMs' },
          byMode: { $push: '$mode' },
          byLanguage: { $push: '$language' }
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