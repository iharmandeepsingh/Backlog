const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats', protect, adminOnly, adminController.getDashboardStats);
router.get('/audit-logs', protect, adminOnly, adminController.getAuditLogs);
router.get('/students', protect, adminOnly, adminController.getAllStudents);
router.put('/students/:studentId/backlogs', protect, adminOnly, adminController.updateStudentBacklogs);

module.exports = router;
