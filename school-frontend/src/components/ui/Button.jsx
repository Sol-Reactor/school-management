import LoadingSpinner from "./LoadingSpinner";

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  loadingText = "Loading...",
  className = "",
  ...props
}) => {
  const baseClasses =
    "font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center";

  const variants = {
    primary: "text-white focus:ring-opacity-50",
    secondary: "text-white focus:ring-opacity-50",
    danger: "text-white focus:ring-opacity-50",
    success: "text-white focus:ring-opacity-50",
    outline: "border-2 focus:ring-opacity-50",
  };

  const sizes = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: 'var(--color-primary)' };
      case 'secondary':
        return { backgroundColor: 'var(--color-textSecondary)' };
      case 'danger':
        return { backgroundColor: 'var(--color-error)' };
      case 'success':
        return { backgroundColor: 'var(--color-success)' };
      case 'outline':
        return { 
          borderColor: 'var(--color-primary)', 
          color: 'var(--color-primary)',
          backgroundColor: 'transparent'
        };
      default:
        return { backgroundColor: 'var(--color-primary)' };
    }
  };

  const classes = `${baseClasses} ${variants[variant]} ${
    sizes[size]
  } ${className} ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}`;

  return (
    <button 
      className={classes} 
      disabled={disabled || loading} 
      style={getVariantStyle()}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" />
          <span className="ml-2">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
