import Loader from "./Loader.jsx";

/** Full-screen spinner while auth session is being restored (avoids login redirect flicker). */
export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight-950">
      <Loader size="lg" label="Restoring session…" center />
    </div>
  );
}
