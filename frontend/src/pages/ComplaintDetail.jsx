import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import AIAnalysisCard from '../components/AIAnalysisCard';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, MapPin, Tag, Calendar, Edit2, Trash2 } from 'lucide-react';

const statusOptions = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

const statusColors = {
  Pending: '#f59e0b',
  'In Progress': '#3b82f6',
  Resolved: '#22c55e',
  Rejected: '#ef4444'
};

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/complaints/${id}`);
      setComplaint(res.data.complaint);
      setNewStatus(res.data.complaint.status);
    } catch (err) {
      toast.error('Failed to load complaint');
      navigate('/complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === complaint.status) {
      toast('Status is already ' + newStatus);
      return;
    }
    setUpdating(true);
    try {
      const res = await api.put(`/api/complaints/${id}`, { status: newStatus });
      setComplaint(res.data.complaint);
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this complaint permanently?')) return;
    try {
      await api.delete(`/api/complaints/${id}`);
      toast.success('Complaint deleted');
      navigate('/complaints');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading complaint...</p>
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="page-container">
      <button className="btn-back" onClick={() => navigate('/complaints')}>
        <ArrowLeft size={16} /> Back to Complaints
      </button>

      <div className="detail-layout">
        {/* Main complaint info */}
        <div className="detail-main">
          <div className="detail-card">
            <div className="detail-card-header">
              <div>
                <span className="category-tag">{complaint.category}</span>
                <h2>{complaint.title}</h2>
              </div>
              <span
                className="status-badge large"
                style={{ backgroundColor: statusColors[complaint.status] || '#6b7280' }}
              >
                {complaint.status}
              </span>
            </div>

            <div className="detail-meta-grid">
              <div className="meta-item">
                <User size={14} />
                <div>
                  <label>Submitted By</label>
                  <p>{complaint.name}</p>
                </div>
              </div>
              <div className="meta-item">
                <Mail size={14} />
                <div>
                  <label>Email</label>
                  <p>{complaint.email}</p>
                </div>
              </div>
              <div className="meta-item">
                <MapPin size={14} />
                <div>
                  <label>Location</label>
                  <p>{complaint.location}</p>
                </div>
              </div>
              <div className="meta-item">
                <Calendar size={14} />
                <div>
                  <label>Submitted On</label>
                  <p>{new Date(complaint.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="detail-description">
              <label><Tag size={14} /> Description</label>
              <p>{complaint.description}</p>
            </div>
          </div>

          {/* AI Analysis */}
          <AIAnalysisCard complaint={complaint} />
        </div>

        {/* Sidebar - Status Update */}
        <div className="detail-sidebar">
          <div className="sidebar-card">
            <h3><Edit2 size={16} /> Update Status</h3>
            {user ? (
              <>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="status-select"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  className="btn-primary full-width"
                  onClick={handleStatusUpdate}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  className="btn-danger full-width"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} /> Delete Complaint
                </button>
              </>
            ) : (
              <p className="auth-note">Login to update status or delete this complaint.</p>
            )}
          </div>

          <div className="sidebar-card">
            <h3>Complaint ID</h3>
            <p className="complaint-id">{complaint._id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
