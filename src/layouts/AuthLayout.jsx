import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern bg-[length:40px_40px] p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-display text-2xl font-bold text-electric-400">
          CareerPilot AI
        </Link>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8">
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
