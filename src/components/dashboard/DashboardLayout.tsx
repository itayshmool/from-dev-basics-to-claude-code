import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardSidebar } from './DashboardSidebar';

const SIDEBAR_KEY = 'dashboard-sidebar-collapsed';

const NAV_ITEMS = [
  {
    to: '/dashboard', label: 'Overview', end: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
      </svg>
    ),
  },
  {
    to: '/dashboard/stats', label: 'Stats', end: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/achievements', label: 'Achievements', end: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/profile', label: 'Profile', end: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/settings', label: 'Settings', end: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  };

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const initial = user?.displayName?.charAt(0).toUpperCase() || '?';

  return (
    <div className="h-full flex flex-col md:flex-row bg-bg-primary">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-bg-card border-b border-border flex-shrink-0">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-purple-soft border border-purple/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-purple text-xs font-bold font-mono">{initial}</span>
            )}
          </div>
          <span className="text-sm font-mono font-semibold text-text-primary truncate">
            {user?.displayName}
          </span>
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          md:hidden fixed inset-y-0 left-0 z-50 w-64
          bg-bg-card border-r border-border
          transition-transform duration-300 ease-in-out
          ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Close + user */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-purple-soft border border-purple/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-purple text-sm font-bold font-mono">{initial}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary font-mono truncate">
                  {user?.displayName}
                </p>
                <p className="text-[10px] text-text-muted truncate">@{user?.username}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${isActive
                    ? 'bg-purple-soft text-purple'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  }
                `}
              >
                <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-border flex flex-col gap-1">
            <NavLink to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
              <span className="flex-shrink-0 w-5 h-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
                </svg>
              </span>
              <span>Back to Home</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <span className="flex-shrink-0 w-5 h-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                </svg>
              </span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <DashboardSidebar
        user={user}
        navItems={NAV_ITEMS}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
      />

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-5 md:p-8 lg:p-10">
        <div className="max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
