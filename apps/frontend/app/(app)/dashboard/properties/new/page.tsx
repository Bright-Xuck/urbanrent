"use client";

// ============================================================
// NEW LISTING — /dashboard/properties/new
// ============================================================
// Two ways to finish, one endpoint: "Save draft" POSTs the listing with
// status DRAFT, "Publish listing" POSTs the same body with status
// PUBLISHED. POST /api/properties takes `status` as an ordinary field, and
// the owner comes from the access token — never from the body.
//
// WHY THE FORM IS REPLACED AFTER SAVING:
// photos attach to a property id (POST /api/properties/:id/images), so
// there is nothing to upload to until the listing exists. Once it does,
// the page swaps the form for a "saved" panel with the uploader and links
// to the new listing. That also removes any chance of submitting the same
// listing twice and ending up with two identical drafts.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  createProperty,
  uploadPropertyImages,
  type CreatePropertyInput,
} from "../../../../../api/propertyApi";
import type { PropertyStatus } from "../../../../../api/types";
import RequireAuth from "../../../../../components/layout/RequireAuth";
import PageHeader from "../../../../../components/layout/PageHeader";
import PropertyForm from "../../../../../components/properties/PropertyForm";
import ImageUploader from "../../../../../components/properties/ImageUploader";
import Alert from "../../../../../components/ui/Alert";
import Card from "../../../../../components/ui/Card";

export default function NewPropertyPage() {
  return (
    <RequireAuth roles={["LANDLORD", "ADMIN"]} title="Add a listing">
      <NewProperty />
    </RequireAuth>
  );
}

function NewProperty() {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdStatus, setCreatedStatus] = useState<PropertyStatus | null>(null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  async function create(body: CreatePropertyInput, status: PropertyStatus) {
    setPending(true);
    setError(null);

    try {
      const property = await createProperty({ ...body, status });
      setCreatedId(property.id);
      setCreatedStatus(property.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the listing");
    } finally {
      setPending(false);
    }
  }

  async function handleUpload(files: File[]) {
    if (!createdId) return;

    setUploading(true);
    setUploadError(null);
    setUploadNotice(null);

    try {
      const message = await uploadPropertyImages(createdId, files);
      setUploadNotice(message);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not upload the images");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Add a listing"
        subtitle="Only what you publish shows up in the public marketplace."
        backHref="/dashboard"
        backLabel="My listings"
      />

      <div className="mt-8">
        {createdId ? (
          <Card>
            <h2 className="panel-title inline-flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-verified" aria-hidden />
              Listing saved
            </h2>

            <div className="mt-3">
              <Alert variant="success">
                {createdStatus === "PUBLISHED"
                  ? "Published — it's live in the marketplace and now takes applications and viewing requests."
                  : "Saved as a draft. Publish it whenever you're ready."}
              </Alert>
            </div>

            <div className="mt-6 border-t border-line pt-6">
              <h3 className="panel-title">Photos</h3>
              <p className="panel-note">
                Up to 5 at a time, 5 MB each, JPEG/PNG/WEBP.
              </p>

              <div className="mt-4">
                <ImageUploader
                  onUpload={handleUpload}
                  uploading={uploading}
                  error={uploadError}
                />
              </div>

              {uploadNotice && (
                <p className="mt-3 text-sm text-verified" role="status">
                  {uploadNotice}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-line pt-6 text-sm">
              <Link href="/dashboard" className="link">
                Back to my listings
              </Link>
              <Link
                href={`/dashboard/properties/${createdId}/edit`}
                className="link inline-flex items-center gap-1"
              >
                Edit the listing <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={`/property/${createdId}`}
                className="link inline-flex items-center gap-1"
              >
                View the listing <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </Card>
        ) : (
          <PropertyForm
            pending={pending}
            error={error}
            submitLabel="Save draft"
            onSubmit={(body) => create(body, "DRAFT")}
            secondary={{
              label: "Publish listing",
              onAction: (body) => create(body, "PUBLISHED"),
            }}
          >
            <p className="mt-6 border-t border-line pt-6 text-sm text-ink-soft">
              Photos are added after the listing is saved — they attach to the
              property id.
            </p>
          </PropertyForm>
        )}
      </div>
    </div>
  );
}
