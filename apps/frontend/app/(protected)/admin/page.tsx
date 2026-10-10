"use client";

// ============================================================
// ADMIN OVERVIEW — /admin (landing page)
// ============================================================
// The admin section's home: four headline counts from the same
// GET /api/admin/users endpoint the users page uses (each request asks
// for one row and reads `total`, payload stays tiny), plus a plain link
// card per section. Sections that aren't built yet still link — they
// 404 until we build the page (accepted, so the roadmap is visible).
//
// RequireAuth is the wall: Overview only mounts for an admin, so its load
// effect only ever runs with a valid admin session behind it.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getUsers } from "../../../api/admin";
import RequireAuth from "../../../components/layout/RequireAuth";
import PageHeader from "../../../components/layout/PageHeader";
import Alert from "../../../components/ui/Alert";
import { Loading } from "../../../components/ui/States";

type Counts = {
  total: number;
  tenants: number;
  landlords: number;
  suspended: number;
};

type SectionCard = {
  title: string;
  description: string;
  href: string;
};

const SECTIONS: SectionCard[] = [
  {
    title: "Users",
    description: "Browse every account — suspend or reinstate anyone breaking the rules.",
    href: "/admin/users",
  },
  {
    title: "Landlord verification",
    description: "Review landlords' uploaded ID and proof-of-ownership documents. (coming soon)",
    href: "/admin/verification",
  },
  {
    title: "Listing moderation",
    description: "Handle reported listings: take down or archive fraudulent ads. (coming soon)",
    href: "/admin/moderation",
  },
  {
    title: "Platform stats",
    description: "Growth and activity trends across the whole platform. (coming soon)",
    href: "/admin/stats",
  },
  {
    title: "Disputes",
    description: "Resolve tenant-vs-landlord disputes, once Leases and Payments exist. (coming soon)",
    href: "/admin/disputes",
  },
];

export default function AdminOverviewPage() {
  return (
    <RequireAuth roles={["ADMIN"]} title="Admin overview">
      <Overview />
    </RequireAuth>
  );
}

function Overview() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [all, tenants, landlords, suspended] = await Promise.all([
          getUsers({}, { limit: 1 }),
          getUsers({ role: "TENANT" }, { limit: 1 }),
          getUsers({ role: "LANDLORD" }, { limit: 1 }),
          getUsers({ accountState: "SUSPENDED" }, { limit: 1 }),
        ]);
        if (!active) return;
        setCounts({
          total: all.total,
          tenants: tenants.total,
          landlords: landlords.total,
          suspended: suspended.total,
        });
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load the counts",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const stats = counts
    ? [
        { label: "Total users", value: counts.total },
        { label: "Landlords", value: counts.landlords },
        { label: "Tenants", value: counts.tenants },
        { label: "Suspended", value: counts.suspended },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Admin overview"
        subtitle="Everything you can manage on UrbanRent, in one place."
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <Loading text="Loading the overview..." />
        </div>
      )}

      {!loading && counts && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="panel p-5">
              <p className="text-xs font-semibold uppercase text-ink-soft">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="panel flex items-start justify-between gap-4 p-5"
          >
            <div>
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{section.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}