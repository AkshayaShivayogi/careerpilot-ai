import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/httpError.js";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import { ButtonLoading } from "../components/Loader.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({ fullName: fullName.trim(), email: email.trim(), password });
      toast.success("Account created!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Create account</h2>
      <p className="mt-1 text-sm text-slate-400">Start your career cockpit</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-400">Full name</span>
          <input className="input-field mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">Email</span>
          <input className="input-field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">Password (8+ chars)</span>
          <input className="input-field mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-glow w-full" disabled={loading} aria-busy={loading}>
          {loading ? <ButtonLoading>Creating account…</ButtonLoading> : "Sign up"}
        </button>
      </form>
      <GoogleSignInButton onSuccess={() => navigate("/dashboard", { replace: true })} />
      <p className="mt-4 text-center text-sm text-slate-500">
        Have an account? <Link to="/login" className="text-electric-400 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
