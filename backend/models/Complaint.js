const mongoose = require('mongoose');

/**
 * Complaint Schema - stores all complaint data including AI analysis results
 */
const ComplaintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Water Supply', 'Electricity', 'Roads', 'Sanitation', 'Public Safety', 'Healthcare', 'Education', 'Other']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  // AI Analysis fields
  aiAnalysis: {
    priority: { type: String, default: null },
    department: { type: String, default: null },
    summary: { type: String, default: null },
    autoResponse: { type: String, default: null },
    analyzedAt: { type: Date, default: null }
  },
  aiStatus: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
