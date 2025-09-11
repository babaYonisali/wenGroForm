const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  xHandle: { type: String, required: true },
  tweetId: { type: String, required: true },
  tweetUrl: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);
