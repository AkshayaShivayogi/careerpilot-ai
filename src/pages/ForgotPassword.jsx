import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { getErrorMessage } from "../utils/httpError.js";
import { ButtonLoading } from "../components/Loader.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setMessage(
        data?.message ||
          "If an account exists with that email, you will receive password reset instructions shortly."
      );
      setEmail("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not send reset email"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Forgot password</h2>
      <p className="mt-1 text-sm text-slate-400">
        Enter your email and we&apos;ll send you a secure reset link.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-400">Email</span>
          <input
            className="input-field mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <button type="submit" className="btn-glow w-full" disabled={loading} aria-busy={loading}>
          {loading ? <ButtonLoading>Sending link…</ButtonLoading> : "Send reset link"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Remember your password?{" "}
        <Link to="/login" className="text-electric-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
