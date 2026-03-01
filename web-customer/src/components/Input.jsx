export default function Input({ label, error, as = 'input', className = '', ...props }) {
  const Component = as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
          {label}
        </label>
      )}
      <Component
        className={`input-field ${error ? 'border-red-500' : ''}`}
        rows={as === 'textarea' ? 3 : undefined}
        {...props}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
