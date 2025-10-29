const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  xHandle: { type: String, required: true, unique: true },
  telegramHandle: { type: String, required: false, unique: false },
  xHandleReferral: { type: String, required: false },
  hasKaitoYaps: { type: Boolean, default: false },
  // Ethereum wallet address connected by the user (MetaMask)
  // sparse allows unique constraint with many nulls
  walletAddress: { type: String, required: false, unique: true, sparse: true },
  joinTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
