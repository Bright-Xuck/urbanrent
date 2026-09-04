const STYLES: Record<string, string> = {
  submitted: "border-line text-ink-soft",
  under_review: "border-ochre text-ochre-dark",
  approved: "border-verified text-verified",
  confirmed: "border-verified text-verified",
  rejected: "border-danger text-danger",
  declined: "border-danger text-danger",
  withdrawn: "border-line text-ink-soft",
  requested: "border-line text-ink-soft",
  completed: "border-verified text-verified",
  no_show: "border-danger text-danger",
  published: "border-verified text-verified",
  draft: "border-line text-ink-soft",
};

const LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  confirmed: "Confirmed",
  rejected: "Rejected",
  declined: "Declined",
  withdrawn: "Withdrawn",
  requested: "Requested",
  completed: "Completed",
  no_show: "No-show",
  published: "Published",
  draft: "Draft",
};

export default function StatusBadge({ status }: { status?: string }) {
  const key = status?.toLowerCase() ?? "";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        STYLES[key] ?? "border-line text-ink-soft"
      }`}
    >
      {LABELS[key] ?? status}
    </span>
  );
}
