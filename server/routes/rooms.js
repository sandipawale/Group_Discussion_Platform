const express = require('express');
const router = express.Router();
const { getRoomToken, getRoomDetails } = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.get('/:id/token', protect, getRoomToken);
router.get('/:id', protect, getRoomDetails);

module.exports = router;
