import { STATUS_META } from "../../data/learningPlans.js";

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.upcoming;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${meta.className}`}>
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
