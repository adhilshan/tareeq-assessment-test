export default function Button({ children, variant = 'primary', disabled, className = '', ...props }) {
  const variantClass = {
    primary: 'btn btn-primary',
    success: 'btn btn-success',
    secondary: 'btn btn-secondary',
  }[variant] || 'btn btn-primary';
  return (
    <button className={`${variantClass} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
