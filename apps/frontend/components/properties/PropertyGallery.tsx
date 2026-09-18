"use client";

// ============================================================
// PROPERTY GALLERY
// ============================================================
// The photos for one listing, from GET /api/properties/:id/images.
//
// That route sits behind `authenticate` like every other property route,
// so the call can legitimately fail (401, network) — a listing with no
// readable photos must not look like a broken page. Failures therefore
// fall back to the same neutral placeholder wall as "no photos yet".
//
// Plain <img> rather than next/image on purpose: the URLs come from
// Supabase Storage, and next/image would need a remotePatterns entry in
// next.config.mjs for every storage host.
//
// Grid markup is the demo's: one large lead image beside up to three
// stacked thumbs (.detail-gallery / .detail-thumbs in globals.css).
// ============================================================

import { useEffect, useState } from "react";
import { getPropertyImages } from "../../api/propertyApi";
import type { PropertyImage } from "../../api/types";

export default function PropertyGallery({ propertyId }: { propertyId: string }) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getPropertyImages(propertyId)
      .then((data) => {
        if (active) setImages(data);
      })
      .catch(() => {
        // Covered by the placeholder below.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [propertyId]);

  if (loading) {
    return <div className="skeleton h-64 w-full" aria-hidden />;
  }

  if (images.length === 0) {
    return <div className="detail-gallery-empty">No photos on this listing yet</div>;
  }

  const cover = images[0];
  const thumbs = images.slice(1, 4);

  return (
    <div className="detail-gallery">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cover.url} alt="Listing photo" className="detail-main-image" />

      {thumbs.length > 0 && (
        <div className="detail-thumbs">
          {thumbs.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={image.id} src={image.url} alt="Listing photo" />
          ))}
        </div>
      )}
    </div>
  );
}
