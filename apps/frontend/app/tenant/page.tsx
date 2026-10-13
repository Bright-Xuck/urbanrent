"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileText, Search, Sparkles } from "lucide-react";
import { getMyApplications } from "../../api/applicationApi";
import { getMyViewingRequests } from "../../api/viewingRequestApi";
import type { Application, ViewingRequest } from "../../api/types";
import { formatDate, titleCase } from "../../lib/format";
import StatusBadge from "../../components/ui/StatusBadge";

export default function TenantDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [viewings, setViewings] = useState<ViewingRequest[]>([]);
  useEffect(() => { void Promise.allSettled([getMyApplications().then(setApplications), getMyViewingRequests().then(setViewings)]); }, []);
  const active = applications.filter((item) => !["REJECTED", "WITHDRAWN"].includes(item.status)).length;
  const upcoming = viewings.filter((item) => ["REQUESTED", "CONFIRMED"].includes(item.status)).length;
  const latest = applications[0];

  return <div className="role-dashboard">
    <section className="dashboard-welcome tenant-welcome"><div><span className="dashboard-eyebrow"><Sparkles size={14} /> Your home search, in one place</span><h2>Make room for<br /><em>what&apos;s next.</em></h2><p>Track your applications, keep viewings moving and find the place that fits your life.</p><Link href="/properties" className="dashboard-primary-button"><Search size={16} /> Explore homes <ArrowUpRight size={16} /></Link></div><div className="welcome-orbit"><div className="orbit-ring" /><div className="orbit-card"><strong>{active}</strong><span>active<br />applications</span></div><div className="orbit-label">Move at<br /><em>your pace.</em></div></div></section>
    <div className="dashboard-metric-grid"><Metric icon={<FileText />} value={applications.length} label="Applications sent" accent="blue" /><Metric icon={<Clock3 />} value={active} label="In progress" accent="mint" /><Metric icon={<CalendarDays />} value={upcoming} label="Upcoming viewings" accent="sand" /></div>
    <div className="dashboard-columns"><section className="dashboard-panel activity-panel"><div className="panel-heading"><div><span className="dashboard-eyebrow">Your journey</span><h3>Recent activity</h3></div><Link href="/tenant/applications">See all <ArrowUpRight size={15} /></Link></div>{applications.length ? <div className="dashboard-activity-list">{applications.slice(0, 4).map((application) => <Link href={`/applications/${application.id}`} className="dashboard-activity-row" key={application.id}><span className="activity-icon"><FileText /></span><span><strong>{application.property?.title ?? "Listing unavailable"}</strong><small>{application.property?.city ?? ""} · Submitted {formatDate(application.createdAt)}</small></span><StatusBadge status={application.status} /></Link>)}</div> : <Empty title="Your next move starts here" text="Save your first application by exploring homes that feel right." link="Browse homes" href="/properties" />}</section><aside className="dashboard-panel next-panel"><div className="panel-heading"><div><span className="dashboard-eyebrow">Next up</span><h3>Keep moving</h3></div></div>{latest?.property ? <div className="next-property"><div className="next-property-art"><span>{latest.property.propertyType.slice(0, 1)}</span></div><strong>{latest.property.title}</strong><small>{titleCase(latest.status)} · {latest.property.city}</small><Link href={`/property/${latest.property.id}`}>Open listing <ArrowUpRight size={14} /></Link></div> : <Empty title="Find your first place" text="A better home is a few thoughtful searches away." link="Start exploring" href="/properties" />}</aside></div>
  </div>;
}

function Metric({ icon, value, label, accent }: { icon: ReactNode; value: number; label: string; accent: string }) { return <div className={`dashboard-metric metric-${accent}`}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>; }
function Empty({ title, text, link, href }: { title: string; text: string; link: string; href: string }) { return <div className="dashboard-empty"><div className="empty-mark">✦</div><strong>{title}</strong><p>{text}</p><Link href={href}>{link} <ArrowUpRight size={14} /></Link></div>; }
