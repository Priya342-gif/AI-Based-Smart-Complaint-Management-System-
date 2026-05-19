import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Filter, Eye, Trash2, RefreshCw, PlusCircle, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Water Supply', 'Electricity', 'Roads', 'Sanitation', 'Public Safety', 'Healthcare', 'Education', 'Other'];
const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

const statusColors = {
  Pending: '#f59e0b',
  'In Progress': '#3b82f6',
  Resolved: '#22c55e',
  Rejected: '#ef4444'
};

const ComplaintList = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [total, setTotal] = useState(0);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/complaints';
      const params = new URLSearchParams();

      if (searchLocation.trim()) {
        // Use search endpoint
        const res = await api.get(`/api/complaints/search?location=${encodeURIComponent(searchLocation)}`);
        let data = res.data.complaints || [];
        if (filterCategory !== 'All') data = data.filter((c) => c.category === filterCategory);
        if (filterStatus !== 'All') data = data.filter((c) => c.status === filterStatus);
        setComplaints(data);
        setTotal(data.length);
        setLoading(false);
        return;
      }

      if (filterCategory !== 'All') params.append('category', filterCategory);
      if (filterStatus !== 'All') params.append('status', filterStatus);
      params.append('limit', '50');

      const res = await api.get(`${url}?${params.toString()}`);
      setComplaints(res.data.complaints || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load complaints');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchLocation, filterCategory, filterStatus]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await api.delete(`/api/complaints/${id}`);
      toast.success('Complaint deleted');
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete complaint');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>All Complaints</h1>
          <p>{total} complaint{total !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/submit" className="btn-primary">
          <PlusCircle size={16} /> New Complaint
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrap">
            <MapPin size={16} />
            <input
              type="text"
              placeholder="Search by location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-icon" aria-label="Search">
            <Search size={16} />
          </button>
        </form>

        <div className="filter-group">
          <Filter size={16} />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-icon" onClick={fetchComplaints} aria-label="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <p>No complaints found.</p>
          <Link to="/submit" className="btn-primary">Submit the first complaint</Link>
        </div>
      ) : (
        <div className="complaints-grid">
          {complaints.map((c) => (
            <div key={c._id} className="complaint-card">
              <div className="complaint-card-header">
                <span className="category-tag">{c.category}</span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: statusColors[c.status] || '#6b7280' }}
                >
                  {c.status}
                </span>
              </div>
              <h3 className="complaint-title">{c.title}</h3>
              <p className="complaint-desc">{c.description.substring(0, 100)}{c.description.length > 100 ? '...' : ''}</p>
              <div className="complaint-meta">
                <span><MapPin size={12} /> {c.location}</span>
                <span><Calendar size={12} /> {new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="complaint-footer">
                <span className="complaint-name">By: {c.name}</span>
                <div className="complaint-actions">
                  <Link to={`/complaints/${c._id}`} className="btn-view">
                    <Eye size={14} /> View
                  </Link>
                  {user && (
                    <button onClick={() => handleDelete(c._id)} className="btn-delete" aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintList;
