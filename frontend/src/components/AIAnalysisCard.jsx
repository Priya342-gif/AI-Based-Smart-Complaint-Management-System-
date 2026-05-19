import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { Brain, AlertTriangle, Building2, MessageSquare, FileText, Loader2, RefreshCw } from 'lucide-react';

const priorityColors = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#22c55e'
};

const AIAnalysisCard = ({ complaint }) => {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState(complaint.aiStatus || 'pending');
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (complaint.aiStatus === 'completed' && complaint.aiAnalysis?.priority) {
      setAnalysis(complaint.aiAnalysis);
      setStatus('completed');
    } else if (complaint.aiStatus === 'analyzing' || complaint.aiStatus === 'pending') {
      startPolling();
    }
    return () => clearInterval(intervalRef.current);
  }, [complaint._id]);

  const startPolling = () => {
    setPolling(true);
    setStatus('analyzing');
    intervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/ai/status/${complaint._id}`);
        if (res.data.aiStatus === 'completed' && res.data.aiAnalysis?.priority) {
          setAnalysis(res.data.aiAnalysis);
          setStatus('completed');
          setPolling(false);
          clearInterval(intervalRef.current);
        } else if (res.data.aiStatus === 'failed') {
          // Trigger fresh analysis
          triggerAnalysis();
          clearInterval(intervalRef.current);
        }
      } catch (err) {
        console.error('Polling error:', err.message);
      }
    }, 4000);
  };

  const triggerAnalysis = async () => {
    setStatus('analyzing');
    setPolling(true);
    try {
      const res = await api.post('/api/ai/analyze', {
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        location: complaint.location,
        complaintId: complaint._id
      });
      if (res.data.analysis?.priority) {
        setAnalysis(res.data.analysis);
        setStatus('completed');
        setPolling(false);
      }
    } catch (err) {
      console.error('Analysis trigger error:', err.message);
      setStatus('failed');
      setPolling(false);
    }
  };

  if (status === 'analyzing' || polling) {
    return (
      <div className="ai-card analyzing">
        <div className="ai-card-header">
          <Brain size={20} />
          <h3>AI Analysis</h3>
        </div>
        <div className="ai-analyzing">
          <Loader2 size={24} className="spin" />
          <p>AI is analyzing your complaint...</p>
          <span className="ai-note">This may take a few seconds</span>
        </div>
      </div>
    );
  }

  if (status === 'failed' && !analysis) {
    return (
      <div className="ai-card failed">
        <div className="ai-card-header">
          <Brain size={20} />
          <h3>AI Analysis</h3>
        </div>
        <div className="ai-failed">
          <AlertTriangle size={20} />
          <p>Analysis unavailable</p>
          <button onClick={triggerAnalysis} className="btn-retry">
            <RefreshCw size={14} /> Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="ai-card completed">
      <div className="ai-card-header">
        <Brain size={20} />
        <h3>AI Analysis Results</h3>
      </div>
      <div className="ai-results">
        <div className="ai-item">
          <AlertTriangle size={16} />
          <div>
            <label>Priority</label>
            <span
              className="priority-badge"
              style={{ backgroundColor: priorityColors[analysis.priority] || '#6b7280' }}
            >
              {analysis.priority}
            </span>
          </div>
        </div>
        <div className="ai-item">
          <Building2 size={16} />
          <div>
            <label>Responsible Department</label>
            <p>{analysis.department}</p>
          </div>
        </div>
        <div className="ai-item">
          <FileText size={16} />
          <div>
            <label>Summary</label>
            <p>{analysis.summary}</p>
          </div>
        </div>
        <div className="ai-item">
          <MessageSquare size={16} />
          <div>
            <label>Auto Response</label>
            <p className="auto-response">{analysis.autoResponse}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisCard;
