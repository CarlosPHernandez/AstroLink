export function FieldError({ id, message }: { id?: string; message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-label-sm text-error mt-1.5" role="alert">
      {message}
    </p>
  );
}