import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../utils/httpError.js";

export default function GoogleSignInButton({ onSuccess }) {
  const { googleLogin } = useAuth();
  const toast = useToast();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-center text-xs text-slate-500">or continue with</p>
      <div className="flex justify-center">
        <GoogleLogin
          theme="filled_black"
          size="large"
          shape="pill"
          text="continue_with"
          onSuccess={async (res) => {
            try {
              await googleLogin(res.credential);
              toast.success("Signed in with Google");
              onSuccess?.();
            } catch (err) {
              toast.error(getErrorMessage(err, "Google sign-in failed"));
            }
          }}
          onError={() => toast.error("Google sign-in was cancelled")}
        />
      </div>
    </div>
  );
}
