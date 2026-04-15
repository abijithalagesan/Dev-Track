const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getMyAttendance } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Registration is handled strictly through the Admin dashboard (/api/admin/users)
// router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/attendance', protect, getMyAttendance);

module.exports = router;
