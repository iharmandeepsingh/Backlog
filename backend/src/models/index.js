const dbStore = require('../utils/dbStore');

module.exports = {
  User: dbStore.User,
  Subject: dbStore.Subject,
  Session: dbStore.Session,
  Config: dbStore.Config,
  Registration: dbStore.Registration,
  AuditLog: dbStore.AuditLog
};
