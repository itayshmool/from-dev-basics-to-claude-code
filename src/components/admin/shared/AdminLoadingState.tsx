interface AdminLoadingStateProps {
  message?: string;
}

export function AdminLoadingState({ message = 'Loading...' }: AdminLoadingStateProps) {
  return (
    <p className="text-text-muted text-sm font-mono animate-pulse">{message}</p>
  );
}
