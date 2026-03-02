import type { ReactNode } from 'react';

interface AppLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
}

export function AppLayout({ header, sidebar, main }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-primary">
      {header}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-y-auto bg-dots">
          {main}
        </main>
      </div>
    </div>
  );
}
