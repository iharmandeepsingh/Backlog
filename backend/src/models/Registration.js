const mongoose = require('mongoose');

const registeredSubjectSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  code: { type: String, required: true },
  name: { type: String, required: true },
  semester: { type: Number, required: true },
  type: { type: String, default: 'Theory' },
  isTheory: { type: Boolean, default: true },
  credits: { type: Number, default: 0 },
  fee: { type: Number, default: 0 }
}, { _id: false });

const registrationSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  sessionName: { type: String },
  sessionType: { type: String, enum: ['ODD', 'EVEN', 'SPECIAL'] },
  subjects: [registeredSubjectSchema],
  theoryCount: { type: Number, default: 0 },
  nonTheoryCount: { type: Number, default: 0 },
  feeBreakdown: {
    isSpecialExam: { type: Boolean, default: false },
    theoryCount: { type: Number, default: 0 },
    theoryFeePerSubject: { type: Number, default: 0 },
    theoryTotal: { type: Number, default: 0 },
    nonTheoryCount: { type: Number, default: 0 },
    nonTheoryFeePerSubject: { type: Number, default: 0 },
    nonTheoryTotal: { type: Number, default: 0 },
    baseFee: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 }
  },
  payment: {
    method: { type: String, enum: ['ONLINE', 'MANUAL'], default: 'ONLINE' },
    amount: { type: Number, default: 0 },
    transactionReference: { type: String, default: '' },
    bankName: { type: String, default: '' },
    paymentDate: { type: Date, default: null },
    receiptUrl: { type: String, default: '' },
    receiptOriginalName: { type: String, default: '' },
    status: { type: String, enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'], default: 'PENDING_VERIFICATION' },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verificationRemarks: { type: String, default: '' },
    rejectionRemarks: { type: String, default: '' },
    onlineOrderId: { type: String, default: '' },
    onlinePaymentId: { type: String, default: '' }
  },
  status: { type: String, enum: ['SUBMITTED', 'APPROVED', 'REJECTED'], default: 'SUBMITTED' },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
