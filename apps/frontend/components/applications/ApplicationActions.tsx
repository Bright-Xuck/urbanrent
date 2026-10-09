"use client";

// ============================================================
// APPLICATION ACTIONS
// ============================================================
// Role-aware action row extracted from the application detail page: what the
// viewer can do depends on who they are AND on the current status. Rendered
// only on pages that already know the application — this component does not
// fetch anything.
//
// The backend is the final judge (it refuses illegal transitions), so these
// buttons are a convenience — hiding an impossible action is UX, not security.
// ============================================================

import Button from "../ui/Button";
import type { Application, Role } from "../../api/types";

export type ApplicationAction = "withdraw" | "review" | "approve" | "reject";

type ApplicationActionsProps = {
  application: Application;
  userId: string;
  role: Role;
  busy: boolean;
  onAction: (action: ApplicationAction) => void;
};

export default function ApplicationActions({
  application,
  userId,
  role,
  busy,
  onAction,
}: ApplicationActionsProps) {
  function isApplicationClosed(): boolean {
    return (
      application.status === "APPROVED" ||
      application.status === "REJECTED" ||
      application.status === "WITHDRAWN"
    );
  }

  function tenantCanWithdraw(): boolean {
    return (
      application.tenantId === userId &&
      !isApplicationClosed() &&
      (application.status === "SUBMITTED" ||
        application.status === "UNDER_REVIEW")
    );
  }

  function landlordCanDecide(): boolean {
    return (
      !!application.property?.owner?.id &&
      application.property.owner.id === userId &&
      !isApplicationClosed()
    );
  }

  if (isApplicationClosed()) {
    return (
      <p className="alert alert-info mt-8">
        This application is closed — no further changes are possible.
      </p>
    );
  }

  const tenant = role === "TENANT";
  const showReview =
    application.status === "SUBMITTED" &&
    (landlordCanDecide() || role === "ADMIN");
  const showDecide = landlordCanDecide() || role === "ADMIN";

  return (
    <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6 text-sm">
      {showReview && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => onAction("review")}
        >
          Move to review
        </Button>
      )}

      {showDecide && !tenant && (
        <>
          <Button
            variant="success"
            disabled={busy}
            onClick={() => onAction("approve")}
          >
            Approve
          </Button>
          <Button
            variant="danger-outline"
            disabled={busy}
            onClick={() => onAction("reject")}
          >
            Reject
          </Button>
        </>
      )}

      {tenantCanWithdraw() && (
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => onAction("withdraw")}
        >
          Withdraw application
        </Button>
      )}
    </div>
  );
}