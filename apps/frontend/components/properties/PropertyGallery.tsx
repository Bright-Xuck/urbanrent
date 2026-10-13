"use client";

// ============================================================
// PROPERTY GALLERY
// ============================================================
// The photos for one listing, from GET /api/properties/:id/images.
//
// That route is public (published listings only), so the call normally
// succeeds for a logged-out visitor — but it can still fail (404 for a
// hidden listing, network), and a listing with no readable photos must not
// look like a broken page. Failures therefore fall back to the same
// neutral placeholder wall as "no photos yet".
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

export default function PropertyGallery({
  propertyId,
}: {
  propertyId: string;
}) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) return;
      setLoading(true);
      try {
        const data = await getPropertyImages(propertyId);
        if (active) setImages(data);
      } catch {
        // Covered by the placeholder below.
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [propertyId]);

  if (loading) {
    // Same .detail-gallery box as the loaded state (fixed height in
    // CSS, incl. responsive rules) so swapping in the real gallery
    // shifts nothing — a shorter placeholder caused most of the
    // detail page's CLS (0.70 before this change).
    return <div className="detail-gallery skeleton" aria-hidden />;
  }

  if (images.length === 0) {
    return (
      <div className="detail-gallery-empty">No photos on this listing yet</div>
    );
  }

  const cover = images[0];
  const thumbs = images.slice(1, 4);

  return (
    <div className="detail-gallery">
      {/* Main image is the detail page's LCP element: keep it eager and
          prioritised. width/height reserve its intrinsic ratio. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover.url}
        alt="Listing photo"
        className="detail-main-image"
        width={1200}
        height={800}
        fetchPriority="high"
        decoding="async"
      />

      {thumbs.length > 0 && (
        <div className="detail-thumbs">
          {thumbs.map((image) => (
            // Lazy: thumbs below the fold (and hidden on mobile via
            // CSS) shouldn't download — they were ~440KB per page load.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.id}
              src={image.url}
              alt="Listing photo"
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      )}
    </div>
  );
}
