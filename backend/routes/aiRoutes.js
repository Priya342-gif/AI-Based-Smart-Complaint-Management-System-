const express = require('express');
const router = express.Router();
const { analyzeComplaint, getAnalysisStatus } = require('../controllers/aiController');

// POST /api/ai/analyze - Analyze a complaint
router.post('/analyze', analyzeComplaint);

// GET /api/ai/status/:complaintId - Poll analysis status
router.get('/status/:complaintId', getAnalysisStatus);

module.exports = router;
