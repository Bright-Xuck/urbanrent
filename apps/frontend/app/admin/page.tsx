"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, FileWarning, Flag, ShieldCheck, Users, UserRound, Sparkles } from "lucide-react";
import { getUsers } from "../../api/admin";
import { getPendingDocuments } from "../../api/verificationApi";
import { getReports } from "../../api/reportApi";

type Counts = { users: number; landlords: number; tenants: number; suspended: number; verification: number; reports: number };

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState<Counts>({ users: 0, landlords: 0, tenants: 0, suspended: 0, verification: 0, reports: 0 });
  useEffect(() => {
    let active = true;
    void Promise.allSettled([getUsers({}, { limit: 1 }), getUsers({ role: "LANDLORD" }, { limit: 1 }), getUsers({ role: "TENANT" }, { limit: 1 }), getUsers({ accountState: "SUSPENDED" }, { limit: 1 }), getPendingDocuments(0, 1), getReports("OPEN", 0, 1)]).then((results) => {
      if (!active) return;
      const values = results.map((result) => result.status === "fulfilled" ? result.value : null) as Array<{ total?: number }>;
      setCounts({ users: values[0]?.total ?? 0, landlords: values[1]?.total ?? 0, tenants: values[2]?.total ?? 0, suspended: values[3]?.total ?? 0, verification: values[4]?.total ?? 0, reports: values[5]?.total ?? 0 });
    });
    return () => { active = false; };
  }, []);

  return <div className="role-dashboard admin-dashboard"><section className="dashboard-welcome admin-welcome"><div><span className="dashboard-eyebrow"><Sparkles size={14} /> UrbanRent control room</span><h2>Keep the<br /><em>city moving.</em></h2><p>Monitor trust, protect the marketplace and make the next good decision visible.</p><Link href="/admin/users" className="dashboard-primary-button"><Users size={16} /> View all users <ArrowUpRight size={16} /></Link></div><div className="admin-signal"><div className="signal-pulse" /><span>System pulse</span><strong>steady</strong><small>All core services<br />are responding</small><div className="signal-code">UR / 026</div></div></section>
    <div className="dashboard-metric-grid admin-metrics"><Metric icon={<Users />} value={counts.users} label="Accounts on platform" accent="blue" /><Metric icon={<BadgeCheck />} value={counts.verification} label="Documents to review" accent="mint" /><Metric icon={<Flag />} value={counts.reports} label="Open reports" accent="sand" /><div className="dashboard-revenue"><small>Platform mix</small><strong>{counts.landlords} / {counts.tenants}</strong><span>Landlords · Tenants</span></div></div>
    <div className="dashboard-columns admin-columns"><section className="dashboard-panel admin-panel"><div className="panel-heading"><div><span className="dashboard-eyebrow">Trust desk</span><h3>Work that needs you</h3></div><span className="admin-live-dot">Live</span></div><div className="admin-work-list"><AdminWork icon={<BadgeCheck />} title="Landlord verification" detail={`${counts.verification} document${counts.verification === 1 ? "" : "s"} waiting for review`} href="/admin/verification" tone="mint" /><AdminWork icon={<FileWarning />} title="Listing moderation" detail={`${counts.reports} open report${counts.reports === 1 ? "" : "s"} to investigate`} href="/admin/moderation" tone="sand" /><AdminWork icon={<UserRound />} title="Account health" detail={`${counts.suspended} suspended account${counts.suspended === 1 ? "" : "s"} on the platform`} href="/admin/users" tone="blue" /></div></section><aside className="dashboard-panel admin-side-panel"><div className="panel-heading"><div><span className="dashboard-eyebrow">Quick routes</span><h3>Go straight there</h3></div></div><Link className="admin-route" href="/admin/verification"><span><BadgeCheck /></span><strong>Review documents</strong><ArrowUpRight /></Link><Link className="admin-route" href="/admin/moderation"><span><ShieldCheck /></span><strong>Open moderation</strong><ArrowUpRight /></Link><Link className="admin-route" href="/admin/users"><span><Users /></span><strong>Manage accounts</strong><ArrowUpRight /></Link></aside></div>
  </div>;
}

function Metric({ icon, value, label, accent }: { icon: ReactNode; value: number; label: string; accent: string }) { return <div className={`dashboard-metric metric-${accent}`}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>; }
function AdminWork({ icon, title, detail, href, tone }: { icon: ReactNode; title: string; detail: string; href: string; tone: string }) { return <Link href={href} className="admin-work-row"><span className={`admin-work-icon tone-${tone}`}>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight /></Link>; }
