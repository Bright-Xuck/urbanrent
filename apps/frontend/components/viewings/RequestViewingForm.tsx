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
// ============================================================

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CalendarPlus, Plus, X } from "lucide-react";
import { createViewingRequest } from "../../api/viewingRequestApi";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { Input } from "../ui/Fields";

export default function RequestViewingForm({ propertyId }: { propertyId: string }) {
  const [times, setTimes] = useState<string[]>([""]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function updateTime(index: number, value: string) {
    setTimes((current) =>
      current.map((time, position) => (position === index ? value : time))
    );
  }

  function addRow() {
    setTimes((current) => [...current, ""]);
  }

  function removeRow(index: number) {
    setTimes((current) => current.filter((_, position) => position !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Skip the boxes the visitor left empty; the backend rejects an empty
    // array with "At least one proposed time is required".
    const proposed = times.filter((time) => time !== "");
    if (proposed.length === 0) {
      setError("Propose at least one time.");
      return;
    }

    setPending(true);

    try {
      await createViewingRequest(
        propertyId,
        proposed.map((time) => new Date(time).toISOString())
      );
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
            you&apos;ll see the confirmed slot on this page.
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
        can&apos;t be double-booked, so an overlapping time is refused.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="space-y-3">
          {times.map((time, index) => (
            <div key={index} className="flex items-end gap-2">
              {/* Input renders its own <label> wrapper, so the flex sizing
                  lives on a div around it — className would land on the
                  <input> itself. */}
              <div className="flex-1">
                <Input
                  label={index === 0 ? "Proposed time" : `Proposed time ${index + 1}`}
                  type="datetime-local"
                  value={time}
                  onChange={(event) => updateTime(index, event.target.value)}
                />
              </div>
              {times.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
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
