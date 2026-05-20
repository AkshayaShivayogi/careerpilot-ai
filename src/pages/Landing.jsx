import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-grid-pattern bg-[length:40px_40px]"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <span className="font-display text-xl font-bold text-electric-400">CareerPilot AI</span>
        <div className="flex gap-3">
          <Link to="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link to="/signup" className="btn-glow">
            Get started
          </Link>
        </div>
      </nav>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-display text-4xl font-bold leading-tight md:text-6xl"
        >
          Navigate your career with{" "}
          <span className="bg-gradient-to-r from-electric-400 to-cyan-300 bg-clip-text text-transparent">
            AI precision
          </span>
        </motion.h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Roadmaps, interview prep, resume insights, DSA tracking, and learning plans — all in one futuristic
          workspace.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/signup" className="btn-glow text-lg px-8 py-3">
            Launch workspace
          </Link>
          <Link to="/login" className="btn-ghost text-lg px-8 py-3">
            I have an account
          </Link>
        </div>
      </section>
    </div>
  );
}
