"use client";

// ============================================================
// APPLY FORM
// ============================================================
// A tenant's application against one listing:
// POST /api/properties/:propertyId/applications with an optional note.
//
// The backend owns the rules that matter and reports them as status codes:
//   409 → you already have an active application for this property
//   400 → the listing is not PUBLISHED, so it takes no applications
//   404 → the property does not exist
//
// So this form never re-implements those checks — it shows the message the
// backend sent. Registering always creates a TENANT on the backend, which
// is why applying is a tenant-only action (enforced by RBAC middleware).
// ============================================================

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { createApplication } from "../../api/applicationApi";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { Textarea } from "../ui/Fields";

export default function ApplyForm({ propertyId }: { propertyId: string }) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await createApplication(propertyId, note.trim() || undefined);
      setApplied(true);
      setNote("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send your application"
      );
    } finally {
      setPending(false);
    }
  }

  if (applied) {
    return (
      <Card>
        <h2 className="panel-title">Apply for this place</h2>
        <div className="mt-3">
          <Alert variant="success">
            Application submitted. The landlord decides next — every step
            carries a status you can follow.
          </Alert>
        </div>
        <p className="mt-4">
          <Link href="/applications" className="link">
            Track your applications
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="panel-title">Apply for this place</h2>
      <p className="panel-note">
        One active application per property. If it&apos;s rejected or you
        withdraw it, you can apply again.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <Textarea
          label="Note to the landlord (optional)"
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="When you'd like to move in, anything the landlord should know."
        />

        {error && (
          <div className="mt-3">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <Button type="submit" disabled={pending} className="btn-block mt-4">
          <Send className="h-4 w-4" aria-hidden />
          {pending ? "Sending…" : "Send application"}
        </Button>
      </form>
    </Card>
  );
}
