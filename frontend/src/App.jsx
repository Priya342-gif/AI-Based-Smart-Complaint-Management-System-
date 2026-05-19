import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute, { PublicOnlyRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ComplaintList from './pages/ComplaintList';
import SubmitComplaint from './pages/SubmitComplaint';
import ComplaintDetail from './pages/ComplaintDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Guest-only routes — redirect to /complaints if already logged in */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />

              {/* Protected routes — redirect to /login if not logged in */}
              <Route
                path="/complaints"
                element={
                  <ProtectedRoute>
                    <ComplaintList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints/:id"
                element={
                  <ProtectedRoute>
                    <ComplaintDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submit"
                element={
                  <ProtectedRoute>
                    <SubmitComplaint />
                  </ProtectedRoute>
                }
              />

              {/* Default — guests go to /login, logged-in go to /complaints */}
              <Route path="/" element={<Navigate to="/complaints" replace />} />
              <Route path="*" element={<Navigate to="/complaints" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155'
            }
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
