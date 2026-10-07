"use client";

// ============================================================
// REQUEST VIEWING FORM
// ============================================================
// The tenant side of the viewing model: propose one or more times, and the
// landlord confirms one of them (or declines) later. There are no fixed
// slots to book — that was a deliberate design decision on the backend.
//
// POST /api/properties/:propertyId/viewing-requests wants `proposedTimes`
// as an array of ISO strings. Each <input type="datetime-local"> value is
// in the visitor's LOCAL time ("2026-09-18T10:00"), and
// new Date(value).toISOString() converts exactly that moment to UTC —
// which is what the landlord on the other side needs to compare against.
//
// The backend wants JSON, so we still send JSON. The form is a real
// <form> so we can read the times from the DOM instead of juggling a grow/
// shrink state array; the list itself is still controlled because the number
// of rows is the part that React needs to own, not each value.
// ============================================================

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CalendarPlus, Plus, X } from "lucide-react";
import { createViewingRequest } from "../../api/viewingRequestApi";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { Input } from "../ui/Fields";

export default function RequestViewingForm({
  propertyId,
}: {
  propertyId: string;
}) {
  const [rowIds, setRowIds] = useState<string[]>(["r0"]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const nextId = useRef(1);

  function addRow() {
    setRowIds((current) => [...current, `r${nextId.current++}`]);
  }

  function removeRow(id: string) {
    setRowIds((current) => current.filter((rowId) => rowId !== id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    // Collect the non-empty proposed times and convert them to ISO so the backend
    // receives UTC instants (the inputs are local datetime-local values).
    const proposedIso: string[] = [];

    for (const [name, value] of Object.entries(data)) {
      if (!name.startsWith("time-")) continue;
      const time = String(value).trim();
      if (!time) continue;
      proposedIso.push(new Date(time).toISOString());
    }

    if (proposedIso.length === 0) {
      setError("Propose at least one time.");
      return;
    }

    setPending(true);

    try {
      await createViewingRequest(propertyId, proposedIso);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send your viewing request"
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <h2 className="panel-title">Request a viewing</h2>
        <div className="mt-3">
          <Alert variant="success">
            Request sent. The landlord confirms one of your proposed times —
            you'll see the confirmed slot on this page.
          </Alert>
        </div>
        <p className="mt-4">
          <Link href="/viewings" className="link">
            My viewing requests
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="panel-title">Request a viewing</h2>
      <p className="panel-note">
        Propose the times that suit you. The landlord picks one — a landlord
        can't be double-booked, so an overlapping time is refused.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="space-y-3">
          {rowIds.map((id, index) => (
            <div key={id} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  name={`time-${id}`}
                  label={index === 0 ? "Proposed time" : `Proposed time ${index + 1}`}
                  type="datetime-local"
                  defaultValue=""
                />
              </div>

              {rowIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(id)}
                  aria-label={`Remove proposed time ${index + 1}`}
                  className="mb-2 px-2 py-2 text-ink-soft hover:text-danger"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addRow} className="btn-sm mt-3">
          <Plus className="h-4 w-4" aria-hidden /> Add another time
        </Button>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <Button type="submit" disabled={pending} className="btn-block mt-4">
          <CalendarPlus className="h-4 w-4" aria-hidden />
          {pending ? "Sending…" : "Send viewing request"}
        </Button>
      </form>
    </Card>
  );
}
