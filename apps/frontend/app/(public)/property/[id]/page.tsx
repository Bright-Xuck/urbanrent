"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BedDouble, Bath, CalendarDays, Heart, LogIn, MapPin, Ruler, Share2, Star } from "lucide-react";
import { getProperties, getPropertyById } from "../../../../api/propertyApi";
import type { Property } from "../../../../api/types";
import { useAuthStore } from "../../../../Store/useUserStore";
import { formatDate, formatXAF, titleCase } from "../../../../lib/format";
import PropertyGallery from "../../../../components/properties/PropertyGallery";
import AmenityPanel from "../../../../components/properties/AmenityPanel";
import PropertyCard from "../../../../components/properties/PropertyCard";
import PropertyAdminActions from "../../../../components/properties/PropertyAdminActions";
import ApplyForm from "../../../../components/applications/ApplyForm";
import RequestViewingForm from "../../../../components/viewings/RequestViewingForm";
import Alert from "../../../../components/ui/Alert";
import { EmptyState, Loading } from "../../../../components/ui/States";

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getPropertyById(id);
        if (!active) return;
        setProperty(data);
        const related = await getProperties({ propertyType: data.propertyType, city: data.city }, { limit: 7 });
        if (active) setSimilar(related.properties.filter((item) => item.id !== data.id).slice(0, 6));
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Could not load this listing");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="rp-container detail-page detail-loading"><Loading text="Loading listing…" /></div>;
  if (error || !property) return <div className="rp-container detail-page"><EmptyState title="That listing is unavailable" description={error ?? "It may have been removed or archived."} link={{ label: "Browse properties", href: "/properties" }} /></div>;

  const isOwner = !!user && user.id === property.ownerId;
  const isTenant = user?.role === "TENANT";
  const acceptsRequests = property.status === "PUBLISHED";
  const location = [property.neighborhood, property.city, property.address].filter(Boolean).join(", ");

  return <main className="property-detail-redesign">
    <div className="rp-container detail-shell">
      <div className="detail-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/properties">Properties</Link><span>/</span><strong>{property.title}</strong></div>
      <div className="detail-toolbar"><Link href="/properties" className="back-link"><ArrowLeft size={16} /> Back to listings</Link><div><button type="button" aria-label="Share listing"><Share2 size={17} /></button><button type="button" aria-label="Save listing"><Heart size={18} /></button></div></div>

      <PropertyGallery propertyId={property.id} />

      <div className="detail-main-grid">
        <article className="detail-main-column">
          <div className="detail-heading">
            <div><span className="detail-status"><span /> For rent</span><span className="detail-type">{titleCase(property.propertyType)}</span></div>
            <h1>{property.title}</h1>
            <div className="detail-review-row"><span className="detail-stars"><Star /><Star /><Star /><Star /><Star /></span><span>No reviews yet</span></div>
            <p className="detail-location"><MapPin size={17} />{location || "Location not provided"}</p>
          </div>

          <div className="detail-price-row"><div><strong>{formatXAF(property.monthlyRent)}</strong><span>/ month</span></div><div className="detail-price-meta"><span>{property.sizeSqm ? `${property.sizeSqm} m²` : "Size not stated"}</span>{property.cautionFee ? <small>Deposit {formatXAF(property.cautionFee)}</small> : null}</div></div>

          <section className="detail-section"><div className="detail-section-title"><h2>Overview</h2><span>Listing ID {property.id.slice(0, 8).toUpperCase()}</span></div><div className="detail-facts">
            <Fact icon={<BedDouble />} label="Bedrooms" value={property.bedrooms ?? "—"} /><Fact icon={<Bath />} label="Bathrooms" value={property.bathrooms ?? "—"} /><Fact icon={<Ruler />} label="Area size" value={property.sizeSqm ? `${property.sizeSqm} m²` : "—"} /><Fact icon={<CalendarDays />} label="Listed" value={formatDate(property.createdAt)} />
          </div></section>

          <nav className="detail-info-tabs" aria-label="Property information"><a href="#description">Description</a><a href="#details">Details</a><a href="#amenities">Featured</a><a href="#location">Location</a></nav>

          <section id="description" className="detail-section detail-description"><div className="detail-section-title"><h2>Description</h2></div><p>{property.description || "The landlord has not added a description for this home yet."}</p></section>

          <section id="details" className="detail-section"><div className="detail-section-title"><h2>Details</h2></div><dl className="detail-data-grid"><Data label="Property type" value={titleCase(property.propertyType)} /><Data label="Bedrooms" value={property.bedrooms ?? "Not stated"} /><Data label="Bathrooms" value={property.bathrooms ?? "Not stated"} /><Data label="Area size" value={property.sizeSqm ? `${property.sizeSqm} m²` : "Not stated"} /><Data label="Neighborhood" value={property.neighborhood ?? "Not stated"} /><Data label="Last updated" value={formatDate(property.updatedAt)} /></dl></section>

          <section id="amenities" className="detail-section detail-amenities"><div className="detail-section-title"><h2>Featured</h2><span>What this home offers</span></div><AmenityPanel propertyId={property.id} canManage={isOwner} /></section>
        </article>

        <aside className="detail-sidebar">
          <div className="detail-action-card"><div className="action-card-heading"><span>Ready to see it?</span><strong>Schedule a tour</strong></div><p>Choose a time that works and the landlord will confirm your visit.</p><div className="tour-dates"><span><b>Tue</b><strong>13</strong><small>Oct</small></span><span><b>Wed</b><strong>14</strong><small>Oct</small></span><span><b>Thu</b><strong>15</strong><small>Oct</small></span></div>{isOwner ? <><div className="owner-note"><strong>Your listing</strong><span>{titleCase(property.status)}</span></div><PropertyAdminActions property={property} showEdit={false} onChanged={setProperty} onDeleted={() => router.push("/landlord/properties")} /><Link className="btn btn-block" href={`/landlord/properties/${property.id}/edit`}>Edit listing</Link></> : isTenant && acceptsRequests ? <RequestViewingForm propertyId={property.id} /> : user ? <Alert variant="info">This listing is not currently accepting requests.</Alert> : <Link href="/login" className="btn btn-block"><LogIn size={17} /> Log in to continue</Link>}</div>
          <div className="detail-contact-card"><div className="side-card-title">Contact</div><div className="contact-person"><div className="contact-avatar">UR</div><div><strong>UrbanRent landlord</strong><span>Property owner</span><a href="mailto:hello@urbanrent.cm">Contact by email</a></div></div><p>Have a question about this home? Send a message after signing in.</p></div>
          {!isOwner && isTenant && acceptsRequests ? <ApplyForm propertyId={property.id} /> : null}
          {!user && <div className="detail-help-card"><h3>Interested in this home?</h3><p>Log in to apply or request a viewing.</p><Link href="/login" className="story-link">Sign in to continue <ArrowRight size={16} /></Link></div>}
        </aside>
      </div>
    </div>

    <section className="similar-section"><div className="rp-container"><div className="similar-heading"><div><span className="home-kicker">Keep exploring</span><h2>Similar <em>listings.</em></h2><p>More homes in {property.city} that may be a good fit.</p></div><Link href={`/properties?city=${encodeURIComponent(property.city)}`} className="story-link">View all listings <ArrowRight size={16} /></Link></div>{similar.length ? <div className="similar-grid">{similar.map((item) => <PropertyCard key={item.id} propertyId={item.id} imageUrl={item.images?.[0]?.url} title={item.title} city={item.city} neighborhood={item.neighborhood ?? undefined} bedrooms={item.bedrooms ?? 0} bathrooms={item.bathrooms ?? 0} sizeSqm={item.sizeSqm} monthlyRent={item.monthlyRent} verified={item.owner?.verificationState === "VERIFIED"} href={`/property/${item.id}`} />)}</div> : <div className="similar-empty">No similar listings are available yet. <Link href="/properties">Browse all homes</Link></div>}</div></section>
  </main>;
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) { return <div className="detail-fact"><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>; }
function Data({ label, value }: { label: string; value: ReactNode }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
