const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  xHandle: { type: String, required: true, unique: true },
  telegramHandle: { type: String, required: false, unique: false },
  xHandleReferral: { type: String, required: false },
  hasKaitoYaps: { type: Boolean, default: false },
  joinTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
