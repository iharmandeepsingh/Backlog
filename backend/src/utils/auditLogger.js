const { AuditLog } = require('../models');

const logAudit = async ({ action, performedBy, details, req }) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : 'system';
    const logEntry = {
      action,
      performedBy: performedBy ? {
        id: performedBy._id || performedBy.id,
        name: performedBy.name,
        email: performedBy.email,
        role: performedBy.role
      } : { role: 'system', name: 'System' },
      details: typeof details === 'object' ? details : { message: details },
      ip,
      timestamp: new Date().toISOString()
    };

    return await AuditLog.create(logEntry);
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

module.exports = { logAudit };
