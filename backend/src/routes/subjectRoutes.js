const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', subjectController.getAllSubjects);
router.get('/eligible-backlogs', protect, subjectController.getEligibleBacklogs);
router.post('/', protect, adminOnly, subjectController.createSubject);
router.put('/:id', protect, adminOnly, subjectController.updateSubject);
router.delete('/:id', protect, adminOnly, subjectController.deleteSubject);

module.exports = router;
