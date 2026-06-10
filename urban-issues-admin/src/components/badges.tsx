const STATUS: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  in_review: { label: "In Review", cls: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  classified: { label: "Classified", cls: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 ring-red-600/20" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-600 ring-gray-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

const CATEGORY_EMOJI: Record<string, string> = {
  waste: "🗑️",
  road: "🚧",
  lighting: "💡",
  water: "💧",
  safety: "⚠️",
  other: "📋",
};

export function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return <span className="text-xs text-gray-400">—</span>;
  const emoji = CATEGORY_EMOJI[category] ?? "📋";
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      {emoji} {label}
    </span>
  );
}
