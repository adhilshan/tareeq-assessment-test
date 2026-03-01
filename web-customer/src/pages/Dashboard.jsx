import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user || user.role !== 'customer') {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--color-text-muted)' }}>Customer dashboard. Please log in as a customer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Welcome, {user.name}</h1>
      <div className="flex gap-4 flex-wrap">
        <Link to="/requests/new">
          <Card className="cursor-pointer hover:opacity-95 transition-opacity" style={{ minWidth: 200 }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>New Request</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Request a tow truck</p>
          </Card>
        </Link>
        <Link to="/requests">
          <Card className="cursor-pointer hover:opacity-95 transition-opacity" style={{ minWidth: 200 }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-success)' }}>My Requests</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>View request history</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
