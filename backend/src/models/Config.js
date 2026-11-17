const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  maxTheorySubjects: { type: Number, default: 4 },
  theoryFeePerSubject: { type: Number, default: 500 },
  nonTheoryFeePerSubject: { type: Number, default: 300 },
  baseRegistrationFee: { type: Number, default: 100 },
  specialTheoryFeePerSubject: { type: Number, default: 1000 },
  specialNonTheoryFeePerSubject: { type: Number, default: 600 },
  specialBaseRegistrationFee: { type: Number, default: 200 },
  specialMaxTheorySubjects: { type: Number, default: 6 },
  allowSpecialExamRegistration: { type: Boolean, default: true },
  specialExamInstructions: {
    type: String,
    default: 'Special / Supplementary Examination permits eligible students to clear backlogs across both Odd and Even semesters simultaneously.'
  },
  bankDetails: {
    bankName: { type: String, default: 'State Bank of India (SBI)' },
    accountHolder: { type: String, default: 'University Examination Controller General Fund' },
    accountNumber: { type: String, default: '389201948201' },
    ifscCode: { type: String, default: 'SBIN0001423' },
    branch: { type: String, default: 'Central Campus Branch, New Delhi' },
    upiId: { type: String, default: 'university.exam@sbi' },
    instructions: { type: String, default: 'Please transfer fee via NEFT/RTGS/IMPS/UPI. Upload clear photo/screenshot of receipt showing UTR / Ref Number.' }
  },
  updatedBy: { type: String, default: 'System Seed Initializer' }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.Config || mongoose.model('Config', configSchema);
