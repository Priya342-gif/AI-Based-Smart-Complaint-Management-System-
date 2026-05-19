const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  addComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  searchByLocation
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/complaints/search?location=...  (must be before /:id)
router.get('/search', searchByLocation);

// POST /api/complaints - Add complaint (public)
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('location').notEmpty().withMessage('Location is required')
  ],
  addComplaint
);

// GET /api/complaints - Get all complaints
router.get('/', getAllComplaints);

// GET /api/complaints/:id - Get single complaint
router.get('/:id', getComplaintById);

// PUT /api/complaints/:id - Update status (protected)
router.put('/:id', protect, updateComplaintStatus);

// DELETE /api/complaints/:id - Delete complaint (protected)
router.delete('/:id', protect, deleteComplaint);

module.exports = router;
