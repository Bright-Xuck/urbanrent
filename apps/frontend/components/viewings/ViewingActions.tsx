"use client";

// ============================================================
// VIEWING ACTIONS
// ============================================================
// The landlord's controls for one viewing request — the viewing parallel
// of components/applications/ApplicationActions.tsx.
//
// The moves below mirror the backend's transition matrix exactly:
//
//   REQUESTED → CONFIRMED (needs a confirmedTime) | DECLINED
//   CONFIRMED → COMPLETED | NO_SHOW
//   DECLINED / COMPLETED / NO_SHOW are final
//
// Confirming requires a time, and the tenant already proposed some, so
// those are offered as one-click fillers. The datetime input stays editable
// because a landlord may well agree on a time nobody proposed.
//
// The backend also refuses a time that overlaps another CONFIRMED viewing
// for the same landlord (409, "…overlaps another confirmed viewing"). That
// applies across ALL of their properties — a landlord can only be in one
// place at a time — and the message is shown as-is.
// ============================================================

import { useState } from "react";
import { formatDateTime, toDateTimeLocal } from "../../lib/format";
import type { Role, ViewingRequest } from "../../api/types";
import Button from "../ui/Button";
import { Input } from "../ui/Fields";

export type ViewingAction = "confirm" | "decline" | "complete" | "no_show";

/** DECLINED / COMPLETED / NO_SHOW have no outgoing transitions. */
export function viewingIsClosed(request: ViewingRequest): boolean {
  return (
    request.status === "DECLINED" ||
    request.status === "COMPLETED" ||
    request.status === "NO_SHOW"
  );
}

/** Only the property owner (or an admin) may drive the status. */
export function landlordCanManageViewing(
  request: ViewingRequest,
  userId: string,
  role: Role
): boolean {
  if (role === "ADMIN") return true;
  return !!request.property?.owner?.id && request.property.owner.id === userId;
}

type ViewingActionsProps = {
  request: ViewingRequest;
  userId: string;
  role: Role;
  busy: boolean;
  onAction: (action: ViewingAction, confirmedTime?: string) => void;
};

export default function ViewingActions({
  request,
  userId,
  role,
  busy,
  onAction,
}: ViewingActionsProps) {
  const proposed = request.proposedTimes ?? [];

  // Default the confirm box to the first time the tenant proposed, so the
  // common case ("yes, the first one works") is a single click.
  const [confirmedTime, setConfirmedTime] = useState(
    proposed[0] ? toDateTimeLocal(proposed[0]) : ""
  );

  if (viewingIsClosed(request)) {
    return (
      <p className="alert alert-info mt-6">
        This viewing request is closed — a {request.status.toLowerCase()}{" "}
        viewing can&apos;t be changed.
      </p>
    );
  }

  if (!landlordCanManageViewing(request, userId, role)) {
    return (
      <p className="alert alert-info mt-6">
        Only the landlord decides whether this viewing goes ahead. You&apos;ll
        see the confirmed time here once they do.
      </p>
    );
  }

  return (
    <div className="mt-6 border-t border-line pt-6">
      {request.status === "REQUESTED" && (
        <>
          {proposed.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-ink">Times the tenant proposed</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {proposed.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setConfirmedTime(toDateTimeLocal(time))}
                    className="border border-line px-3 py-1.5 text-sm text-ink hover:border-navy"
                  >
                    {formatDateTime(time)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Confirmed time"
            type="datetime-local"
            required
            value={confirmedTime}
            onChange={(event) => setConfirmedTime(event.target.value)}
            className="max-w-xs"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="success"
              disabled={busy || confirmedTime === ""}
              onClick={() =>
                onAction("confirm", new Date(confirmedTime).toISOString())
              }
            >
              Confirm viewing
            </Button>
            <Button
              variant="danger-outline"
              disabled={busy}
              onClick={() => onAction("decline")}
            >
              Decline
            </Button>
          </div>
        </>
      )}

      {request.status === "CONFIRMED" && (
        <div className="flex flex-wrap gap-3">
          <p className="w-full">
            After the viewing, record what happened — it&apos;s part of the
            record.
          </p>
          <Button variant="success" disabled={busy} onClick={() => onAction("complete")}>
            Mark completed
          </Button>
          <Button
            variant="danger-outline"
            disabled={busy}
            onClick={() => onAction("no_show")}
          >
            Mark no-show
          </Button>
        </div>
      )}

      {busy && <p className="mt-3 text-xs text-ink-soft">Saving…</p>}
    </div>
  );
}