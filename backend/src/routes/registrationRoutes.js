const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Student submits registration (handles manual payment file upload if provided)
router.post(
  '/',
  protect,
  upload.single('receipt'),
  registrationController.createRegistration
);

// Student gets own registrations
router.get('/my-registrations', protect, registrationController.getStudentRegistrations);

// Online payment integration endpoints
router.post('/create-online-order', protect, registrationController.createOnlineOrder);
router.post('/verify-online-payment', protect, registrationController.verifyOnlinePayment);

// Admin reports and management
router.get('/all', protect, adminOnly, registrationController.getAllRegistrations);
router.get('/export-csv', protect, adminOnly, registrationController.exportReportCSV);
router.patch('/:id/verify-payment', protect, adminOnly, registrationController.verifyManualPayment);

// View registration details
router.get('/:id', protect, registrationController.getRegistrationById);

module.exports = router;
