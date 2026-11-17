const mongoose = require('mongoose');

const failedSubjectRecordSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  code: { type: String, required: true },
  name: { type: String, required: true },
  semester: { type: Number, required: true },
  credits: { type: Number, default: 0 },
  type: { type: String, default: 'Theory' },
  isTheory: { type: Boolean, default: true },
  grade: { type: String, default: 'F' },
  internalMarks: { type: Number, default: null },
  externalMarks: { type: Number, default: null },
  totalMarks: { type: Number, default: null },
  maxMarks: { type: Number, default: 100 },
  sourceFile: { type: String, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  rollNumber: { type: String, uppercase: true, trim: true },
  department: { type: String, required: true, trim: true },
  program: { type: String, default: 'B.Tech' },
  batchYear: { type: Number },
  currentSemester: { type: Number, default: 1 },
  phone: { type: String, default: '' },
  eligibleBacklogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  failedSubjectRecords: [failedSubjectRecordSchema]
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
