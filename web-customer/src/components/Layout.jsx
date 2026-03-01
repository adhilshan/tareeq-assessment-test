import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[var(--color-bg-elevated)] border-b p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            TowAssist
          </Link>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.name}</span>
              <Button variant="secondary" onClick={logout}>Logout</Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
