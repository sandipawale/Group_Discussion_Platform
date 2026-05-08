const express = require('express');
const router = express.Router();
const { getAnalytics, getFlaggedDetails, getSlotDetails, getSessionDetails, triggerAnalysis, forceCompleteSession } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require admin role
router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/flagged', getFlaggedDetails);
router.get('/slots/:id', getSlotDetails);
router.get('/sessions/:id', getSessionDetails);
router.post('/sessions/:id/analyze', triggerAnalysis);
router.post('/sessions/:id/force-complete', forceCompleteSession);

module.exports = router;
