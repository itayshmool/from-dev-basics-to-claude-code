interface ActivityItem {
  lessonId: string;
  lessonTitle: string;
  completedAt: string | null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted text-sm font-mono">No activity yet. Start a lesson!</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={`${item.lessonId}-${i}`} className="relative flex items-start gap-3">
            {/* Dot */}
            <div className="absolute -left-6 top-1.5 w-[9px] h-[9px] rounded-full bg-purple border-2 border-bg-card" />

            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{item.lessonTitle}</p>
              <p className="text-[10px] font-mono text-text-muted">
                {item.completedAt ? timeAgo(item.completedAt) : 'Completed'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
