import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/httpError.js";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import { ButtonLoading } from "../components/Loader.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const successMessage = location.state?.message || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Welcome back</h2>
      <p className="mt-1 text-sm text-slate-400">Sign in to your workspace</p>
      {successMessage && <p className="mt-3 text-sm text-emerald-400">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-400">Email</span>
          <input className="input-field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Password</span>
            <Link to="/forgot-password" className="text-xs text-electric-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input className="input-field mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-glow w-full" disabled={loading} aria-busy={loading}>
          {loading ? <ButtonLoading>Signing in…</ButtonLoading> : "Sign in"}
        </button>
      </form>
      <GoogleSignInButton onSuccess={() => navigate(from, { replace: true })} />
      <p className="mt-4 text-center text-sm text-slate-500">
        New here? <Link to="/signup" className="text-electric-400 hover:underline">Create account</Link>
      </p>
    </div>
  );
}
