const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', configController.getConfig);
router.put('/', protect, adminOnly, configController.updateConfig);

module.exports = router;
