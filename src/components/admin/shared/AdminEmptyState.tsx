interface AdminEmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export function AdminEmptyState({ message = 'No data found', icon }: AdminEmptyStateProps) {
  const defaultIcon = (
    <span className="text-2xl text-text-muted">—</span>
  );

  return (
    <div className="bg-bg-card rounded-xl border border-border p-8 text-center">
      <div className="mb-2">{icon ?? defaultIcon}</div>
      <p className="text-text-muted text-sm font-mono">{message}</p>
    </div>
  );
}
