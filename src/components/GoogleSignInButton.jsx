import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../utils/httpError.js";
import Loader from "./Loader.jsx";

export default function GoogleSignInButton({ onSuccess }) {
  const { googleLogin } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-center text-xs text-slate-500">or continue with</p>
      <div className={`relative flex justify-center ${loading ? "pointer-events-none opacity-60" : ""}`}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Loader size="sm" label="Signing in…" center />
          </div>
        )}
        <GoogleLogin
          theme="filled_black"
          size="large"
          shape="pill"
          text="continue_with"
          onSuccess={async (res) => {
            setLoading(true);
            try {
              await googleLogin(res.credential);
              toast.success("Signed in with Google");
              onSuccess?.();
            } catch (err) {
              toast.error(getErrorMessage(err, "Google sign-in failed"));
            } finally {
              setLoading(false);
            }
          }}
          onError={() => toast.error("Google sign-in was cancelled")}
        />
      </div>
    </div>
  );
}
