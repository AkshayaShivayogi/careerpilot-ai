const VARIANTS = {
  default: { label: "Powered by Gemini AI", icon: "✨" },
  generated: { label: "AI Generated", icon: "🤖" },
  dynamic: { label: "Dynamic Response", icon: "⚡" },
  evaluating: { label: "Gemini evaluating…", icon: "🔮" },
};

export default function AiBadge({ variant = "default", className = "" }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-violet-500/35 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-200 ${className}`}
      title={v.label}
    >
      <span aria-hidden>{v.icon}</span>
      {v.label}
    </span>
  );
}
