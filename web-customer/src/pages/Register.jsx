import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register({ ...form, role: 'customer' });
      const data = res.data?.data || res.data;
      authLogin(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      setError(errData?.message || 'Registration failed');
      if (errData?.errors) {
        const first = Object.values(errData.errors).flat()[0];
        if (first) setError(first);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
          <Input label="Confirm Password" name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleChange} placeholder="••••••••" required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center">
                <div className="spinner spinner-sm btn-spinner" />
                <span>Creating...</span>
              </div>
            ) : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" className="link-primary font-medium">Sign In</Link>
        </p>
      </Card>
    </div>
  );
}
