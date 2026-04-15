const express = require('express');
const router = express.Router();
const { getTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTasks);

module.exports = router;
