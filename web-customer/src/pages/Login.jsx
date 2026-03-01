import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ email, password });
      const data = res.data?.data || res.data;
      authLogin(data.user, data.token);
      navigate(data.user.role === 'customer' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center">
                <div className="spinner spinner-sm btn-spinner" />
                <span>Signing in...</span>
              </div>
            ) : 'Sign In'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Don't have an account? <Link to="/register" className="link-primary font-medium">Register</Link>
        </p>
      </Card>
    </div>
  );
}
