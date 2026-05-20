import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/profile", label: "Profile", icon: "👤" },
  { to: "/roadmap", label: "Roadmap", icon: "🛣️" },
  { to: "/interview", label: "AI Interview", icon: "🎯" },
  { to: "/resume", label: "AI Resume Analyzer", icon: "🧠" },
  { to: "/dsa", label: "Skill Analytics", icon: "📊" },
  { to: "/achievements", label: "Achievements", icon: "🏆" },
  { to: "/progress", label: "Progress", icon: "📈" },
  { to: "/planner", label: "Planner", icon: "📅" },
  { to: "/trending", label: "Trending", icon: "🔥" },
  { to: "/saved", label: "Saved", icon: "★" },
  { to: "/guidance", label: "Guidance", icon: "◎" },
];

export default function Sidebar() {
  return (
    <aside className="glass-card hidden w-64 shrink-0 flex-col p-4 lg:flex">
      <div className="mb-8 px-2">
        <p className="font-display text-lg font-bold text-electric-400">CareerPilot</p>
        <p className="text-xs text-slate-500">AI Career OS</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
          >
            <span className="text-electric-500">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
