type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className = "", label }: SpinnerProps) {
  return (
    <span
      className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-content/20 border-t-content/55 ${className}`}
      role="status"
      aria-label={label ?? "Laden"}
    />
  );
}
