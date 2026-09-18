// ============================================================
// STATUS BADGE
// ============================================================
// Shows an application / viewing / property status as a small coloured
// pill. The backend sends SCREAMING_SNAKE_CASE ("UNDER_REVIEW"); we
// lowercase it and look it up, so the component works straight off API
// data without any mapping in the pages.
//
// The pill itself is `.status-pill` from globals.css, tinted by data-tone
// (ok / warn / bad / muted) so the colour rules stay in the stylesheet.
// ============================================================

const TONES: Record<string, "ok" | "warn" | "bad" | "muted"> = {
  submitted: "muted",
  under_review: "warn",
  approved: "ok",
  confirmed: "ok",
  published: "ok",
  rejected: "bad",
  declined: "bad",
  no_show: "bad",
  withdrawn: "muted",
  requested: "muted",
  completed: "ok",
  draft: "muted",
  unpublished: "muted",
  archived: "muted",
};

const LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  confirmed: "Confirmed",
  published: "Published",
  rejected: "Rejected",
  declined: "Declined",
  no_show: "No-show",
  withdrawn: "Withdrawn",
  requested: "Requested",
  completed: "Completed",
  draft: "Draft",
  unpublished: "Unpublished",
  archived: "Archived",
};

export default function StatusBadge({ status }: { status?: string }) {
  const key = status?.toLowerCase() ?? "";

  return (
    <span className="status-pill" data-tone={TONES[key] ?? "muted"}>
      {LABELS[key] ?? status}
    </span>
  );
}