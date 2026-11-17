const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  semester: { type: Number, required: true },
  credits: { type: Number, default: 3 },
  department: { type: String, required: true, trim: true },
  program: { type: String, default: 'B.Tech' },
  type: { type: String, default: 'Theory' },
  isTheory: { type: Boolean, default: true }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
