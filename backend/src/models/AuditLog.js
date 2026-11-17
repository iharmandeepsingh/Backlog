const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: {
    id: { type: mongoose.Schema.Types.Mixed },
    userId: { type: mongoose.Schema.Types.Mixed },
    name: { type: String, default: 'System' },
    email: { type: String, default: '' },
    role: { type: String, default: 'system' }
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String, default: '127.0.0.1' },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
