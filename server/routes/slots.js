const express = require('express');
const router = express.Router();
const {
    createSlot,
    updateSlot,
    getTodaySlots,
    registerSlot,
    cancelRegistration,
    getAllSlots,
    deleteSlot,
} = require('../controllers/slotController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getTodaySlots);
router.get('/today', protect, getTodaySlots);
router.post('/', protect, adminOnly, createSlot);
router.put('/:id', protect, adminOnly, updateSlot);
router.get('/all', protect, adminOnly, getAllSlots);
router.delete('/:id', protect, adminOnly, deleteSlot);
router.post('/:id/register', protect, registerSlot);
router.delete('/:id/register', protect, cancelRegistration);

module.exports = router;
