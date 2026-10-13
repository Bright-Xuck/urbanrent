"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, CalendarDays, FileText, Plus, Sparkles, Users } from "lucide-react";
import { getMyProperties } from "../../api/propertyApi";
import { getIncomingApplications } from "../../api/applicationApi";
import { getIncomingViewingRequests } from "../../api/viewingRequestApi";
import type { Application, Property, ViewingRequest } from "../../api/types";
import { formatXAF, titleCase } from "../../lib/format";
import StatusBadge from "../../components/ui/StatusBadge";

export default function LandlordDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [viewings, setViewings] = useState<ViewingRequest[]>([]);
  useEffect(() => { void Promise.allSettled([getMyProperties({ limit: 6 }).then((data) => setProperties(data.properties)), getIncomingApplications().then(setApplications), getIncomingViewingRequests().then(setViewings)]); }, []);
  const published = properties.filter((property) => property.status === "PUBLISHED").length;
  const pending = applications.filter((application) => ["SUBMITTED", "UNDER_REVIEW"].includes(application.status)).length;
  const monthly = properties.filter((property) => property.status === "PUBLISHED").reduce((total, property) => total + property.monthlyRent, 0);

  return <div className="role-dashboard landlord-dashboard"><section className="dashboard-welcome landlord-welcome"><div><span className="dashboard-eyebrow"><Sparkles size={14} /> Your portfolio, with a pulse</span><h2>Make every<br /><em>space count.</em></h2><p>One clear view of your homes, the people interested in them and what needs your attention next.</p><Link href="/landlord/properties/new" className="dashboard-primary-button"><Plus size={16} /> Add a property <ArrowUpRight size={16} /></Link></div><div className="portfolio-snapshot"><div className="snapshot-number"><strong>{published}</strong><span>live homes</span></div><div className="snapshot-line" /><div className="snapshot-number"><strong>{pending}</strong><span>to review</span></div><div className="snapshot-stamp">UR<br /><small>PORTFOLIO<br />NOTE 01</small></div></div></section>
    <div className="dashboard-metric-grid"><Metric icon={<Building2 />} value={properties.length} label="Total properties" accent="blue" /><Metric icon={<Users />} value={pending} label="Applications to review" accent="mint" /><Metric icon={<CalendarDays />} value={viewings.length} label="Viewing requests" accent="sand" /><div className="dashboard-revenue"><small>Published monthly value</small><strong>{formatXAF(monthly)}</strong><span>Across your live portfolio</span></div></div>
    <div className="dashboard-columns landlord-columns"><section className="dashboard-panel portfolio-panel"><div className="panel-heading"><div><span className="dashboard-eyebrow">Your portfolio</span><h3>Properties in motion</h3></div><Link href="/landlord/properties">Manage all <ArrowUpRight size={15} /></Link></div>{properties.length ? <div className="dashboard-property-list">{properties.slice(0, 4).map((property) => <Link key={property.id} href={`/property/${property.id}`} className="dashboard-property-row"><span className="property-art"><Building2 /></span><span className="property-row-info"><strong>{property.title}</strong><small>{property.city} · {formatXAF(property.monthlyRent)} / month</small></span><StatusBadge status={property.status} /><ArrowRight /></Link>)}</div> : <div className="dashboard-empty"><div className="empty-mark">✦</div><strong>Your portfolio is waiting</strong><p>Add a property and give someone a place to land.</p><Link href="/landlord/properties/new">Create listing <ArrowUpRight size={14} /></Link></div>}</section><aside className="dashboard-panel attention-panel"><div className="panel-heading"><div><span className="dashboard-eyebrow">Needs your eye</span><h3>Recent interest</h3></div><Link href="/landlord/applications">Open inbox <ArrowUpRight size={15} /></Link></div>{applications.length ? <div className="dashboard-activity-list">{applications.slice(0, 3).map((application) => <Link href={`/applications/${application.id}`} className="dashboard-activity-row" key={application.id}><span className="activity-icon"><FileText /></span><span><strong>{application.property?.title ?? "Your property"}</strong><small>{application.tenant?.email ?? "New applicant"}</small></span><StatusBadge status={application.status} /></Link>)}</div> : <div className="attention-empty"><span>All quiet for now.</span><small>New applications will appear here.</small></div>}</aside></div></div>;
}

function Metric({ icon, value, label, accent }: { icon: ReactNode; value: number; label: string; accent: string }) { return <div className={`dashboard-metric metric-${accent}`}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>; }
