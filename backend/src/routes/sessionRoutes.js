const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', sessionController.getSessions);
router.get('/active', sessionController.getActiveSession);
router.post('/', protect, adminOnly, sessionController.createSession);
router.put('/:id', protect, adminOnly, sessionController.updateSession);
router.patch('/:id/extend', protect, adminOnly, sessionController.extendSessionDeadline);
router.delete('/:id', protect, adminOnly, sessionController.deleteSession);

module.exports = router;
