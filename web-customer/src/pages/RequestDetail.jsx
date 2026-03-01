import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequest } from '../api/requestService';
import Card from '../components/Card';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRequest(id)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setRequest(data);
      })
      .catch(() => setRequest(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-6 flex justify-center items-center">
      <div className="spinner" />
    </div>
  );
  if (!request) return <div className="p-6 text-red-500">Request not found</div>;

  const statusColors = { pending: 'var(--color-secondary)', assigned: 'var(--color-primary)', completed: 'var(--color-success)' };

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium transition-colors"
        style={{ color: 'var(--color-text-muted)', hover: { color: 'var(--color-primary)' } }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Request #{request.id}</h1>
      <Card>
        <div className="space-y-2">
          <p><strong>Status:</strong> <span style={{ color: statusColors[request.status] }}>{request.status}</span></p>
          <p><strong>Customer:</strong> {request.customer_name}</p>
          <p><strong>Location:</strong> {request.pickup_address || `${request.pickup_lat}, ${request.pickup_lng}`}</p>
          {request.note && <p><strong>Note:</strong> {request.note}</p>}
          {request.assigned_driver_name && <p><strong>Driver:</strong> {request.assigned_driver_name}</p>}
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Created: {new Date(request.created_at).toLocaleString()}</p>
        </div>
      </Card>
    </div>
  );
}
