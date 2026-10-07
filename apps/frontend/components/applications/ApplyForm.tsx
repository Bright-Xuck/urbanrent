"use client";

// ============================================================
// APPLY FORM
// ============================================================
// A tenant's application against one listing: POST
// /api/properties/:propertyId/applications with an optional note.
//
// The backend owns the rules that matter and reports them as status codes:
//   409 → you already have an active application for this property
//   400 → the listing is not PUBLISHED, so it takes no applications
//   404 → the property does not exist
//
// This form never re-implements those checks — it shows the message the
// backend sent. Registering always creates a TENANT on the backend, which
// is why applying is a tenant-only action (enforced by RBAC middleware).
//
// The backend expects JSON (`{ note? }`), so we still post JSON. The form
// itself is a real <form> so we can read it from the DOM instead of juggling
// controlled state — but we build the body explicitly, because the API wants
// a shaped object, not a flat form dump.
// ============================================================

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { createApplication } from "../../api/applicationApi";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { Textarea } from "../ui/Fields";

export default function ApplyForm({
  propertyId,
}: {
  propertyId: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    const trimmedNote = (data.note as string | undefined)?.trim();

    try {
      await createApplication(propertyId, trimmedNote || undefined);
      setApplied(true);
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
        One active application per property. If it's rejected or you
        withdraw it, you can apply again.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <Textarea
          name="note"
          label="Note to the landlord (optional)"
          rows={4}
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
