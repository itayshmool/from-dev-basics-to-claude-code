import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Profile', end: true },
  { to: '/dashboard/settings', label: 'Settings', end: false },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const initial = user?.displayName?.charAt(0).toUpperCase() || '?';

  return (
    <div className="h-full flex flex-col md:flex-row bg-bg-primary">
      {/* Sidebar */}
      <aside className="w-full md:w-56 lg:w-64 bg-bg-card border-b md:border-b-0 md:border-r border-border flex-shrink-0">
        <div className="p-4 md:p-5">
          {/* User avatar + name */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-soft border border-purple/20 flex items-center justify-center flex-shrink-0">
              <span className="text-purple text-sm font-bold font-mono">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary font-mono truncate">
                {user?.displayName}
              </p>
              <p className="text-[10px] text-text-muted truncate">@{user?.username}</p>
            </div>
          </div>

          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${isActive
                    ? 'bg-purple-soft text-purple'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  }
                `}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:block mt-8 pt-4 border-t border-border">
            <NavLink to="/" className="block px-3 py-2 text-xs text-text-muted hover:text-text-primary transition-colors">
              Back to Home
            </NavLink>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-5 md:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
