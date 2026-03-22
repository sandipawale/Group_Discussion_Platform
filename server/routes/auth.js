const express = require('express');
const router = express.Router();
const { register, login, adminLogin, setupProfile, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/setup-profile', protect, setupProfile);
router.put('/profile', protect, setupProfile);
router.get('/me', protect, getMe);

module.exports = router;
