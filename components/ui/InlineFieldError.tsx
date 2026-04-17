type InlineFieldErrorProps = {
  message: string | null;
  className?: string;
};

export function InlineFieldError({ message, className = "" }: InlineFieldErrorProps) {
  if (!message) return null;
  return (
    <p className={`mt-1 text-xs text-red-700 ${className}`} role="alert">
      {message}
    </p>
  );
}
