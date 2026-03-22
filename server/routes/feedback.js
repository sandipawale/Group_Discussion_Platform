const express = require('express');
const router = express.Router();
const { submitFeedback, getMyFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

router.post('/', protect, submitFeedback);
router.get('/my-history', protect, getMyFeedback);

module.exports = router;
