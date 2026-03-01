import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRequest from './pages/CreateRequest';
import RequestHistory from './pages/RequestHistory';
import RequestDetail from './pages/RequestDetail';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-hero">
      <div className="home-card">
        <div className="home-badge">Towing management</div>
        <h1 className="home-title">TowAssist</h1>
        <p className="home-subtitle">
          Seamless towing requests for customers and real‑time assignment for drivers.
        </p>
        <div className="home-actions">
          <button
            type="button"
            className="btn btn-primary home-primary"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className="btn btn-secondary home-secondary"
            onClick={() => navigate('/register')}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}

function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/requests/new" replace />;
  }

  return (
    <Layout>
      <Home />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<RootRoute />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Navigate to="/requests/new" replace />} />
          <Route path="/requests" element={<ProtectedRoute requireCustomer><Layout><RequestHistory /></Layout></ProtectedRoute>} />
          <Route path="/requests/new" element={<ProtectedRoute requireCustomer><Layout><CreateRequest /></Layout></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute requireCustomer><Layout><RequestDetail /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
