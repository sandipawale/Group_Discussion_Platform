const express = require('express');
const router = express.Router();
const { getRoomToken, getRoomDetails, submitTranscript, leaveRoom, transcribeAudio } = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.get('/:id/token', protect, getRoomToken);
router.post('/:id/transcript', protect, submitTranscript);
router.post('/:id/leave', protect, leaveRoom);
router.post('/:id/transcribe', protect, express.raw({ type: 'application/octet-stream', limit: '50mb' }), transcribeAudio);
router.get('/:id', protect, getRoomDetails);

module.exports = router;
