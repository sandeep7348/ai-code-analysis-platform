const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true },
  mode: { type: String, enum: ['review', 'explain', 'refactor', 'test'], required: true },
  language: { type: String, required: true },
  codeHash: { type: String, required: true },
  codeSnippet: { type: String, required: true, maxlength: 50000 },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  tokensUsed: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  cached: { type: Boolean, default: false },
  score: { type: Number, min: 0, max: 100 }
}, { timestamps: true });

analysisSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
