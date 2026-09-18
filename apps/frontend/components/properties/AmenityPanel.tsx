"use client";

// ============================================================
// AMENITY PANEL
// ============================================================
// The amenities recorded against one listing (WiFi, Parking, …), plus an
// add form for the owner.
//
// The backend serves these on /api/properties/:id/amenities (see
// api/amenityApi.ts). Adding or removing is owner-only; the backend returns
// 403 for anyone else, so `canManage` only decides whether the form is
// shown at all.
//
// SHAPE NOTE: the list items are PropertyAmenity JOIN rows with the amenity
// nested (`row.amenity`), and DELETE takes the AMENITY id — not the link
// row's own id. Getting this wrong renders blank names and a 404/500 on
// delete, so the two are spelled out at the call sites below.
// ============================================================

import { useEffect, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import {
  createAmenity,
  deleteAmenity,
  getPropertyAmenities,
} from "../../api/amenityApi";
import type { PropertyAmenityRow } from "../../api/types";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { Input } from "../ui/Fields";

type AmenityPanelProps = {
  propertyId: string;
  /** Only the property owner (or an admin) may add or remove. */
  canManage: boolean;
};

export default function AmenityPanel({ propertyId, canManage }: AmenityPanelProps) {
  const [rows, setRows] = useState<PropertyAmenityRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [pictureurl, setPictureurl] = useState("");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadError(null);

    getPropertyAmenities(propertyId)
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Could not load the amenities"
          );
        }
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [propertyId]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    setFormError(null);
    setNotice(null);

    try {
      const { amenity, link } = await createAmenity(
        propertyId,
        name.trim(),
        pictureurl.trim() || undefined
      );
      // Append locally: the POST already told us it worked, so there is no
      // need to re-read the whole list. The POST returns the amenity and the
      // link row separately, so they are stitched back into the shape the
      // list uses.
      setRows((current) => [...current, { ...link, amenity }]);
      setName("");
      setPictureurl("");
      setNotice(`"${amenity.name}" added to this listing.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add the amenity");
    } finally {
      setAdding(false);
    }
  }

  // NOTE: this endpoint deletes the Amenity catalog row itself (the links
  // cascade away), so if the same amenity is linked to another property it
  // disappears there too. That is the backend's behaviour, not a choice made
  // here.
  async function handleRemove(row: PropertyAmenityRow) {
    setFormError(null);
    setNotice(null);

    try {
      // The AMENITY id, not `row.id` (which is the link row's id).
      await deleteAmenity(propertyId, row.amenity.id);
      setRows((current) => current.filter((item) => item.id !== row.id));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not remove the amenity"
      );
    }
  }

  return (
    <Card className="mt-10">
      <h2 className="panel-title">Amenities</h2>

      {loadError && (
        <div className="mt-3">
          <Alert variant="error">{loadError}</Alert>
        </div>
      )}

      {!loadError && loaded && rows.length === 0 && (
        <p className="mt-3 text-sm text-ink-soft">No amenities recorded yet.</p>
      )}

      {rows.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {rows.map((row) => (
            <li key={row.id} className="feature-chip">
              {row.amenity.name}
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemove(row)}
                  aria-label={`Remove ${row.amenity.name}`}
                  className="text-ink-soft hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {notice && (
        <p className="mt-3 text-sm text-verified" role="status">
          {notice}
        </p>
      )}

      {canManage && (
        <form onSubmit={handleAdd} className="mt-6 border-t border-line pt-6">
          <p className="text-sm text-ink">Add an amenity</p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Borehole water"
            />
            <Input
              label="Picture URL"
              value={pictureurl}
              onChange={(event) => setPictureurl(event.target.value)}
              placeholder="Optional"
            />
          </div>

          {formError && (
            <div className="mt-3">
              <Alert variant="error">{formError}</Alert>
            </div>
          )}

          <Button type="submit" variant="outline" disabled={adding} className="mt-4">
            <Plus className="h-4 w-4" aria-hidden />
            {adding ? "Adding…" : "Add amenity"}
          </Button>
        </form>
      )}
    </Card>
  );
}
