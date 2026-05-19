import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, FileText, PlusCircle, List, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <FileText size={22} />
        <span>Smart Complaint System</span>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/complaints" className={isActive('/complaints') ? 'active' : ''}>
              <List size={16} /> All Complaints
            </Link>
            <Link to="/submit" className={isActive('/submit') ? 'active' : ''}>
              <PlusCircle size={16} /> Submit
            </Link>
            <span className="navbar-user">
              <User size={16} /> {user.name}
            </span>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive('/login') ? 'active' : ''}>Login</Link>
            <Link to="/register" className={`btn-register ${isActive('/register') ? 'active' : ''}`}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
