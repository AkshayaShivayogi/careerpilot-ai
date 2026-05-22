const SIZE_CLASS = {
  sm: "h-4 w-4 border",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-2",
};

/** Reusable spinner — electric/navy theme, smooth Tailwind animation. */
export default function Loader({ size = "md", label, center = false, className = "" }) {
  const spinner = (
    <div
      className={`animate-spin-smooth rounded-full border-electric-500 border-t-transparent ${SIZE_CLASS[size]} ${className}`}
      role="status"
      aria-hidden={label ? undefined : true}
      aria-label={label || "Loading"}
    />
  );

  if (!label && !center) return spinner;

  return (
    <div
      className={
        center
          ? "flex flex-col items-center justify-center gap-3"
          : "inline-flex items-center gap-2"
      }
    >
      {spinner}
      {label ? <p className="text-sm text-slate-400">{label}</p> : null}
    </div>
  );
}

/** Inline spinner + label for disabled submit buttons. */
export function ButtonLoading({ children }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader size="sm" />
      <span>{children}</span>
    </span>
  );
}

/** Centered page/section loading placeholder. */
export function PageLoader({ label = "Loading…", minHeight = "min-h-48" }) {
  return (
    <div className={`flex ${minHeight} items-center justify-center`}>
      <Loader size="md" label={label} center />
    </div>
  );
}
