interface StreakHeatmapProps {
  activityMap: Record<string, number>;
}

function getIntensity(count: number): string {
  if (count === 0) return 'bg-bg-elevated';
  if (count === 1) return 'bg-purple/20 border border-purple/15';
  if (count <= 3) return 'bg-purple/45 border border-purple/30';
  return 'bg-purple/75 border border-purple/50';
}

function getDaysInRange(weeks: number): { date: Date; dateStr: string }[] {
  const days: { date: Date; dateStr: string }[] = [];
  const today = new Date();
  const totalDays = weeks * 7;

  // Start from the beginning of the week (Sunday) `weeks` weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - totalDays + (7 - today.getDay()));

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    if (d > today) break;
    days.push({
      date: d,
      dateStr: d.toISOString().slice(0, 10),
    });
  }

  return days;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function StreakHeatmap({ activityMap }: StreakHeatmapProps) {
  const weeks = 20;
  const days = getDaysInRange(weeks);

  // Group days into weeks (columns)
  const columns: { date: Date; dateStr: string }[][] = [];
  let currentWeek: { date: Date; dateStr: string }[] = [];

  for (const day of days) {
    const dow = day.date.getDay();
    if (dow === 0 && currentWeek.length > 0) {
      columns.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) columns.push(currentWeek);

  // Month labels along top
  const monthLabels: { label: string; colIdx: number }[] = [];
  let lastMonth = -1;
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const firstDay = columns[colIdx][0];
    const month = firstDay.date.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTH_LABELS[month], colIdx });
      lastMonth = month;
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-0">
        {/* Month labels */}
        <div className="flex gap-[3px] ml-[28px]">
          {columns.map((_, colIdx) => {
            const ml = monthLabels.find(m => m.colIdx === colIdx);
            return (
              <div key={colIdx} className="w-[13px] text-[9px] font-mono text-text-muted leading-none">
                {ml?.label || ''}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1 flex-shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="w-[24px] h-[13px] text-[9px] font-mono text-text-muted flex items-center justify-end pr-1">
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex gap-[3px]">
            {columns.map((week, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-[3px]">
                {/* Pad if first week doesn't start on Sunday */}
                {colIdx === 0 && week[0] && Array.from({ length: week[0].date.getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-[13px] h-[13px]" />
                ))}
                {week.map(day => {
                  const count = activityMap[day.dateStr] || 0;
                  return (
                    <div
                      key={day.dateStr}
                      className={`w-[13px] h-[13px] rounded-[2px] ${getIntensity(count)} transition-colors`}
                      title={`${day.dateStr}: ${count} lesson${count !== 1 ? 's' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 ml-[28px]">
          <span className="text-[9px] font-mono text-text-muted">Less</span>
          <div className="w-[11px] h-[11px] rounded-[2px] bg-bg-elevated" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-purple/20 border border-purple/15" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-purple/45 border border-purple/30" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-purple/75 border border-purple/50" />
          <span className="text-[9px] font-mono text-text-muted">More</span>
        </div>
      </div>
    </div>
  );
}
