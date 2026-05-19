const { validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const { analyzeComplaintAsync } = require('./aiController');

/**
 * @route   POST /api/complaints
 * @desc    Add a new complaint
 * @access  Public
 */
const addComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation error', errors: errors.array() });
  }

  const { name, email, title, description, category, location } = req.body;

  try {
    const complaint = await Complaint.create({
      name,
      email,
      title,
      description,
      category,
      location,
      status: 'Pending',
      aiStatus: 'analyzing'
    });

    // Trigger AI analysis asynchronously (non-blocking)
    analyzeComplaintAsync(complaint._id, title, description, category, location);

    res.status(201).json({
      message: 'Complaint submitted successfully. AI analysis is in progress.',
      complaint
    });
  } catch (error) {
    console.error('Add complaint error:', error);
    res.status(500).json({ message: 'Failed to submit complaint', error: error.message });
  }
};

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints with optional filters
 * @access  Public
 */
const getAllComplaints = async (req, res) => {
  try {
    const { category, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Failed to fetch complaints', error: error.message });
  }
};

/**
 * @route   GET /api/complaints/:id
 * @desc    Get a single complaint by ID
 * @access  Public
 */
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ complaint });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ message: 'Failed to fetch complaint', error: error.message });
  }
};

/**
 * @route   PUT /api/complaints/:id
 * @desc    Update complaint status
 * @access  Private (Admin)
 */
const updateComplaintStatus = async (req, res) => {
  const { status } = req.body;

  if (!['Pending', 'In Progress', 'Resolved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Status updated successfully', complaint });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete a complaint
 * @access  Private (Admin)
 */
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ message: 'Failed to delete complaint', error: error.message });
  }
};

/**
 * @route   GET /api/complaints/search
 * @desc    Search complaints by location
 * @access  Public
 */
const searchByLocation = async (req, res) => {
  const { location } = req.query;

  if (!location) {
    return res.status(400).json({ message: 'Location query parameter is required' });
  }

  try {
    const complaints = await Complaint.find({
      location: { $regex: location, $options: 'i' }
    }).sort({ createdAt: -1 });

    res.json({ complaints, total: complaints.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

module.exports = {
  addComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  searchByLocation
};
