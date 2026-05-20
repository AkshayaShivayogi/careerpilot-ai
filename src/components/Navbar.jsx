import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { resolveMediaUrl } from "../utils/mediaUrl.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const avatarUrl = resolveMediaUrl(user?.profileImage || user?.profilePicture);

  return (
    <header className="glass-card mb-6 flex items-center justify-between px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full border border-electric-500/30 bg-navy-800">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-electric-400">
              {user?.fullName?.[0] || "?"}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Workspace</p>
          <p className="font-medium text-white">{user?.fullName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/roadmap?tab=daily" className="btn-ghost hidden text-sm sm:inline-block">
          📅 Daily targets
        </Link>
        <Link to="/profile" className="btn-ghost text-sm">
          Profile
        </Link>
        <button type="button" onClick={logout} className="btn-ghost text-sm text-red-300">
          Logout
        </button>
      </div>
    </header>
  );
}
