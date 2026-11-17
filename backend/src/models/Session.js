const mongoose = require('mongoose');

const extensionEntrySchema = new mongoose.Schema({
  extendedAt: { type: Date, default: Date.now },
  oldEndDate: { type: Date, required: true },
  newEndDate: { type: Date, required: true },
  reason: { type: String, default: '' },
  extendedBy: { type: String, default: 'Admin' }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['ODD', 'EVEN', 'SPECIAL'], required: true },
  academicYear: { type: String, default: '2026-2027' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  isSpecialExam: { type: Boolean, default: false },
  allowAllSemesters: { type: Boolean, default: false },
  description: { type: String, default: '' },
  theoryFeeOverride: { type: Number, default: null },
  nonTheoryFeeOverride: { type: Number, default: null },
  baseFeeOverride: { type: Number, default: null },
  maxTheorySubjectsOverride: { type: Number, default: null },
  isExtended: { type: Boolean, default: false },
  extendedDate: { type: Date, default: null },
  extensionReason: { type: String, default: '' },
  extensionHistory: [extensionEntrySchema]
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.Session || mongoose.model('Session', sessionSchema);
