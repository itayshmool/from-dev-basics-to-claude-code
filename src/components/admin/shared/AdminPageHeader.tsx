interface AdminPageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function AdminPageHeader({ title, children }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-semibold text-text-primary font-mono">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
