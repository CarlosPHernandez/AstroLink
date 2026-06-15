export function FormAlert({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="bg-error-container/70 text-on-error-container text-label-sm rounded-lg px-3 py-2.5"
      role="alert"
    >
      {message}
    </div>
  );
}