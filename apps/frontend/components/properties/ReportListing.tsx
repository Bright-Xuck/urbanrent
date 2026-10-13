"use client";

// ============================================================
// REPORT LISTING (tenant)
// ============================================================
// The "Report this listing" card on the property detail sidebar.
// A collapsed card with the button expands into the reason form;
// after submitting it becomes a confirmation. A duplicate open
// report comes back as the backend's message in the error alert.
// ============================================================

import { useState, type FormEvent } from "react";
import { Flag } from "lucide-react";
import { reportProperty } from "../../api/reportApi";
import type { PropertyReportReason } from "../../api/types";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { Select } from "../ui/Fields";

const REASONS: { value: PropertyReportReason; label: string }[] = [
  { value: "SCAM_OR_FRAUD", label: "Scam or fraud" },
  { value: "MISLEADING_INFORMATION", label: "Misleading information" },
  { value: "ALREADY_RENTED", label: "Already rented out" },
  { value: "OTHER", label: "Something else" },
];

export default function ReportListing({
  propertyId,
}: {
  propertyId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<PropertyReportReason>("SCAM_OR_FRAUD");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await reportProperty(propertyId, reason);
      setReported(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit your report"
      );
    } finally {
      setPending(false);
    }
  }

  if (reported) {
    return (
      <Card>
        <h2 className="panel-title">Report this listing</h2>
        <div className="mt-3">
          <Alert variant="success">
            Report submitted. Our team will review this listing.
          </Alert>
        </div>
      </Card>
    );
  }

  if (!open) {
    return (
      <Card>
        <h2 className="panel-title">Something wrong with this listing?</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Tell our team and we&apos;ll take a look.
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Flag className="h-4 w-4" aria-hidden /> Report this listing
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="panel-title">Report this listing</h2>
      <form onSubmit={handleSubmit} className="mt-3">
        <Select
          label="Reason"
          value={reason}
          onChange={(event) =>
            setReason(event.target.value as PropertyReportReason)
          }
        >
          {REASONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit report"}
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
      </form>
    </Card>
  );
}
