import { Link, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const mobileLinks = [
  ["/dashboard", "Home"],
  ["/roadmap", "Map"],
  ["/interview", "Prep"],
  ["/profile", "You"],
];

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-grid-pattern bg-[length:40px_40px] p-4 pb-24 lg:p-6 lg:pb-6">
      <div className="mx-auto flex max-w-7xl gap-6">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Navbar />
          <main>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <nav className="glass-card fixed bottom-4 left-4 right-4 flex justify-around p-2 lg:hidden">
        {mobileLinks.map(([to, label]) => (
          <Link key={to} to={to} className="text-xs text-slate-400 hover:text-electric-400">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
