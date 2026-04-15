const express = require('express');
const router = express.Router();
const { submitTask, getMySubmissions } = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('proofFile'), submitTask);
router.get('/me', protect, getMySubmissions);

module.exports = router;
