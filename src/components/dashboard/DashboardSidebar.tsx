import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '../shared/ThemeToggle';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  user: { displayName: string; username: string; profileImage?: string | null } | null;
  navItems: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

export function DashboardSidebar({ user, navItems, collapsed, onToggle, onLogout }: DashboardSidebarProps) {
  const initial = user?.displayName?.charAt(0).toUpperCase() || '?';

  return (
    <aside
      className={`
        hidden md:flex flex-col flex-shrink-0
        bg-bg-card border-r border-border
        transition-[width] duration-300 ease-in-out overflow-hidden
        ${collapsed ? 'w-16' : 'md:w-56 lg:w-64'}
      `}
    >
      <div className={`flex-1 flex flex-col ${collapsed ? 'p-2' : 'p-4 md:p-5'}`}>
        {/* User avatar + name */}
        <div className={`flex items-center gap-3 mb-6 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-purple-soft border border-purple/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-purple text-sm font-bold font-mono">{initial}</span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary font-mono truncate">
                {user?.displayName}
              </p>
              <p className="text-[10px] text-text-muted truncate">@{user?.username}</p>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => `
                ${collapsed ? 'justify-center' : ''}
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${isActive
                  ? 'bg-purple-soft text-purple'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                }
              `}
            >
              <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-border flex items-center justify-center gap-1">
          <NavLink
            to="/"
            title="Back to Home"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
            </svg>
          </NavLink>
          <ThemeToggle />
          <button
            onClick={onLogout}
            title="Logout"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-t border-border text-text-muted hover:text-text-primary transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
}
