const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-(--color-border-highlight) border-t-(--color-primary) rounded-full animate-spin`}
      />
    </div>
  );
};

export default LoadingSpinner;
