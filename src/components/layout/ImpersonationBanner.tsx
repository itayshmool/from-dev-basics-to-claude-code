import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function ImpersonationBanner() {
  const { impersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!impersonating) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-mono z-50 relative">
      <span className="opacity-80">Viewing as</span>
      <span className="font-semibold">{impersonating.displayName || impersonating.username}</span>
      <button
        onClick={() => {
          stopImpersonation();
          navigate('/admin');
        }}
        className="ml-2 px-3 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors"
      >
        Exit Impersonation
      </button>
    </div>
  );
}
