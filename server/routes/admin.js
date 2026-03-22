const express = require('express');
const router = express.Router();
const { getAnalytics, getFlaggedDetails, getSlotDetails } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require admin role
router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/flagged', getFlaggedDetails);
router.get('/slots/:id', getSlotDetails);

module.exports = router;
