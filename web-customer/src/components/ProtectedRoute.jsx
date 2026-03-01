import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireCustomer }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireCustomer && user.role !== 'customer') return <Navigate to="/" replace />;

  return children;
}
