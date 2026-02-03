import { AlertCircle } from "lucide-react";

const FormInput = ({
  label,
  name,
  type = "text",
  placeholder,
  register,
  error,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-(--color-text-primary) mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          {...register(name)}
          {...props}
          className={`input-field ${
            error
              ? "border-(--color-error) focus:ring-(--color-error) focus:border-(--color-error)"
              : "border-(--color-border) focus:ring-(--color-primary) focus:border-(--color-primary)"
          } ${disabled ? "bg-(--color-background-alt) cursor-not-allowed" : ""}`}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-(--color-error)" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-(--color-error) animate-fade-in">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default FormInput;
