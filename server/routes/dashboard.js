const express = require('express');
const router = express.Router();
const { getMyRegistrations, getStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/my-registrations', protect, getMyRegistrations);
router.get('/stats', protect, getStats);

module.exports = router;
