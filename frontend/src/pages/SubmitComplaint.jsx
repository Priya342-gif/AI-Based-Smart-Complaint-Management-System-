import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Send, MapPin, Tag, AlignLeft, Mail, User } from 'lucide-react';

const CATEGORIES = [
  'Water Supply',
  'Electricity',
  'Roads',
  'Sanitation',
  'Public Safety',
  'Healthcare',
  'Education',
  'Other'
];

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    description: '',
    category: '',
    location: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Enter a valid email';
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/complaints', form);
      toast.success('Complaint submitted successfully! AI analysis is running...');
      navigate(`/complaints/${res.data.complaint._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint';
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const errMap = {};
        serverErrors.forEach((e) => { errMap[e.path] = e.msg; });
        setErrors(errMap);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Submit a Complaint</h1>
        <p>Fill in the details below. AI will analyze your complaint automatically.</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">
                <User size={14} /> Full Name *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={14} /> Email Address *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">
              <Tag size={14} /> Complaint Title *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Brief title of your complaint"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <AlignLeft size={14} /> Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your complaint in detail..."
              rows={5}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">
                <Tag size={14} /> Category *
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="location">
                <MapPin size={14} /> Location *
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Ghaziabad, Sector 5"
                className={errors.location ? 'error' : ''}
              />
              {errors.location && <span className="field-error">{errors.location}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/complaints')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Send size={16} />
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
