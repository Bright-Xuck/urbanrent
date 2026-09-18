"use client";

// ============================================================
// PROPERTY ADMIN ACTIONS
// ============================================================
// The owner's controls for one listing: publish, unpublish, archive and
// delete (plus a link to the edit page).
//
// There is no dedicated publish endpoint on the backend, and there does
// not need to be — `status` is just a column, so all three status moves
// are an ordinary PATCH. propertyApi exposes publishProperty /
// unpublishProperty / archiveProperty for exactly that.
//
// The component performs the calls itself and reports the result upward
// (`onChanged` with the updated row, `onDeleted` with the id), so the
// dashboard list and the listing detail page can both use it without
// duplicating any of this.
//
// The backend is the real gate: it refuses to touch a property you don't
// own (403). These buttons are convenience, not security.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import {
  archiveProperty,
  deleteProperty,
  publishProperty,
  unpublishProperty,
} from "../../api/propertyApi";
import type { Property } from "../../api/types";
import Alert from "../ui/Alert";
import Button from "../ui/Button";

type PropertyAdminActionsProps = {
  property: Property;
  /** Hide the Edit link where the current page already is the editor. */
  showEdit?: boolean;
  onChanged: (property: Property) => void;
  onDeleted: (id: string) => void;
};

// Every button in the row is a `.btn` from globals.css, one size down so
// four of them still fit side by side.
const BUTTON_CLASS = "btn-sm";

export default function PropertyAdminActions({
  property,
  showEdit = true,
  onChanged,
  onDeleted,
}: PropertyAdminActionsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // One helper for the three status moves — they differ only in which
  // API function they call.
  async function runStatusChange(action: () => Promise<Property>) {
    setBusy(true);
    setError(null);

    try {
      onChanged(await action());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the listing");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);

    try {
      await deleteProperty(property.id);
      onDeleted(property.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the listing");
      setConfirming(false);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showEdit && (
        <Link
          href={`/dashboard/properties/${property.id}/edit`}
          className={`btn btn-light ${BUTTON_CLASS}`}
        >
          <Pencil className="h-4 w-4" aria-hidden /> Edit
        </Link>
      )}

      {property.status === "PUBLISHED" ? (
        <Button
          variant="outline"
          className={BUTTON_CLASS}
          disabled={busy}
          onClick={() => runStatusChange(() => unpublishProperty(property.id))}
        >
          Unpublish
        </Button>
      ) : (
        <Button
          variant="success"
          className={BUTTON_CLASS}
          disabled={busy}
          onClick={() => runStatusChange(() => publishProperty(property.id))}
        >
          Publish
        </Button>
      )}

      {property.status !== "ARCHIVED" && (
        <Button
          variant="outline"
          className={BUTTON_CLASS}
          disabled={busy}
          onClick={() => runStatusChange(() => archiveProperty(property.id))}
        >
          Archive
        </Button>
      )}

      {/* Delete is a two-step button instead of window.confirm() — easier
          to style, and it can't be dismissed by accident. */}
      {confirming ? (
        <span className="inline-flex flex-wrap items-center gap-2 text-sm">
          <span>Delete permanently?</span>
          <Button
            variant="danger-outline"
            className={BUTTON_CLASS}
            disabled={busy}
            onClick={handleDelete}
          >
            {busy ? "Deleting…" : "Yes, delete"}
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </span>
      ) : (
        <Button
          variant="danger-outline"
          className={BUTTON_CLASS}
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Delete
        </Button>
      )}

      {error && (
        <div className="w-full">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
    </div>
  );
}
