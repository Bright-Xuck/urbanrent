"use client";

// ============================================================
// EDIT LISTING — /dashboard/properties/[id]/edit
// ============================================================
// PATCH /api/properties/:id via the shared PropertyForm, plus the photo
// tools and the status controls (publish / unpublish / archive / delete).
//
// Only the owner may change anything: the backend checks ownership on
// PATCH and DELETE and answers 403 otherwise. A 403 here means the id in
// the URL belongs to someone else, and we say so instead of showing a form
// that can't save.
//
// The form is only mounted once the property has loaded, because
// PropertyForm seeds its inputs from `initial` on first render — rendering
// it earlier would lock in empty values.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getPropertyById,
  getPropertyImages,
  updateProperty,
  uploadPropertyImages,
  type CreatePropertyInput,
} from "../../../../../../api/propertyApi";
import type { Property, PropertyImage } from "../../../../../../api/types";
import RequireAuth from "../../../../../../components/layout/RequireAuth";
import PageHeader from "../../../../../../components/layout/PageHeader";
import PropertyForm, {
  type PropertyFormInitial,
} from "../../../../../../components/properties/PropertyForm";
import PropertyAdminActions from "../../../../../../components/properties/PropertyAdminActions";
import ImageUploader from "../../../../../../components/properties/ImageUploader";
import Alert from "../../../../../../components/ui/Alert";
import Card from "../../../../../../components/ui/Card";
import { Loading } from "../../../../../../components/ui/States";

export default function EditPropertyPage() {
  return (
    <RequireAuth roles={["LANDLORD", "ADMIN"]} title="Edit listing">
      <EditProperty />
    </RequireAuth>
  );
}

function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [images, setImages] = useState<PropertyImage[]>([]);
  const [imagesKey, setImagesKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    getPropertyById(id)
      .then((data) => {
        if (active) setProperty(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Could not load this listing");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Photos are read on their own: the images route is separate from the
  // property, and it needs to be re-read after an upload.
  useEffect(() => {
    let active = true;

    getPropertyImages(id)
      .then((data) => {
        if (active) setImages(data);
      })
      .catch(() => {
        // No readable photos: the empty state below covers it.
      });

    return () => {
      active = false;
    };
  }, [id, imagesKey]);

  async function handleSave(body: CreatePropertyInput) {
    setPending(true);
    setSaveError(null);
    setSaved(false);

    try {
      // `status` is deliberately not sent on a normal save — the status
      // buttons above the form own that, and PATCH only touches the fields
      // it receives.
      const updated = await updateProperty(id, body);
      setProperty(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save your changes");
    } finally {
      setPending(false);
    }
  }

  async function handleUpload(files: File[]) {
    setUploading(true);
    setUploadError(null);
    setUploadNotice(null);

    try {
      const message = await uploadPropertyImages(id, files);
      setUploadNotice(message);
      setImagesKey((current) => current + 1);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not upload the images");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <Loading text="Loading listing…" />;
  }

  if (!property) {
    return (
      <div>
        <PageHeader
          title="Edit listing"
          backHref="/dashboard"
          backLabel="My listings"
        />
        <div className="mt-6">
          <Alert variant="error">
            {loadError ?? "Could not load this listing"}
          </Alert>
        </div>
      </div>
    );
  }

  // Everything optional is a string for the form; `?? ""` keeps a null
  // column from reaching an input as "null".
  const initial: PropertyFormInitial = {
    title: property.title,
    description: property.description ?? "",
    propertyType: property.propertyType,
    bedrooms: property.bedrooms !== null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms !== null ? String(property.bathrooms) : "",
    sizeSqm: property.sizeSqm !== null ? String(property.sizeSqm) : "",
    city: property.city,
    neighborhood: property.neighborhood ?? "",
    address: property.address ?? "",
    monthlyRent: String(property.monthlyRent),
    cautionFee: property.cautionFee !== null ? String(property.cautionFee) : "",
  };

  return (
    <div>
      <PageHeader
        title="Edit listing"
        subtitle={property.title}
        backHref="/dashboard"
        backLabel="My listings"
      />

      <Card className="mt-8">
        <h2 className="panel-title">Listing status</h2>
        <p className="panel-note">
          Currently <span className="text-ink">{property.status.toLowerCase()}</span>.
          Only published listings appear in the marketplace.
        </p>
        <div className="mt-4">
          <PropertyAdminActions
            property={property}
            showEdit={false}
            onChanged={setProperty}
            onDeleted={() => router.push("/dashboard")}
          />
        </div>
      </Card>

      <div className="mt-8">
        <PropertyForm
          initial={initial}
          pending={pending}
          error={saveError}
          submitLabel="Save changes"
          onSubmit={handleSave}
        >
          <div className="mt-8 border-t border-line pt-8">
            {saved && (
              <div className="mb-6">
                <Alert variant="success">Changes saved.</Alert>
              </div>
            )}

            <h2 className="panel-title">Photos</h2>
            <p className="panel-note">
              {images.length} photo{images.length === 1 ? "" : "s"} on this
              listing. Up to 5 new ones at a time, 5 MB each, JPEG/PNG/WEBP.
            </p>

            {images.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((image) => (
                  <li key={image.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt="Listing photo"
                      className="h-24 w-full bg-paper-dim object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}

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
        </PropertyForm>
      </div>

      <p className="mt-8">
        <Link href={`/property/${property.id}`} className="link inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to the listing
        </Link>
      </p>
    </div>
  );
}
