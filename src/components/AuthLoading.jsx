/** Full-screen spinner while auth session is being restored (avoids login redirect flicker). */
export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Restoring session…</p>
      </div>
    </div>
  );
}
