import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRequests } from '../api/requestService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import RequestsTabs from '../components/RequestsTabs';

export default function RequestHistory() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await getRequests();
      const payload = res.data?.data ?? res.data;
      const arr = Array.isArray(payload) ? payload : (payload?.data ?? []);
      setRequests(arr);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);


  if (!user || user.role !== 'customer') {
    return <div className="p-6" style={{ color: 'var(--color-text-muted)' }}>Customer only.</div>;
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="spinner" />
      </div>
    );
  }

  const statusColors = { pending: 'var(--color-secondary)', assigned: 'var(--color-primary)', completed: 'var(--color-success)' };

  return (
    <div className="space-y-4">
      <RequestsTabs active="past" />
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>My Requests</h1>
      {requests.length === 0 ? (
        <Card><p style={{ color: 'var(--color-text-muted)' }}>No requests yet. <Link to="/requests/new" className="link-primary">Create one</Link>.</p></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="flex items-center justify-between">
              <div>
                <span className="font-semibold">#{r.id}</span>
                <span className="text-sm text-white" style={{ background: statusColors[r.status] || statusColors, padding: '5px 10px', marginLeft: '8px', borderRadius: '60px' }}>{r.status}</span>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{r.pickup_address || `${r.pickup_lat}, ${r.pickup_lng}`}</p>
                {r.assigned_driver_name && <p className="text-sm mt-1">Driver: {r.assigned_driver_name}</p>}
              </div>
              <Link to={`/requests/${r.id}`} className="link-primary text-sm font-medium">View</Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
