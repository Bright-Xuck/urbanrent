// ============================================================
// FOOTER
// ============================================================
// Static links to the real pages. Shown by the (site) and (app) route
// group layouts — pages never render it themselves.
//
// Markup follows the demo footer: a brand column and three link columns,
// then a bottom bar. The look is the existing `footer` / `.footer-grid` /
// `.footer-bottom` rules in globals.css.
// ============================================================

import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-paper/40 font-display text-xs text-paper">
              UR
            </span>
            <span className="font-display text-lg text-paper">UrbanRent</span>
          </div>
          <p className="mt-4 max-w-xs">
            A formal record for every rental, so tenants and landlords agree
            on what was actually promised.
          </p>
        </div>

        <div>
          <h4>For tenants</h4>
          <Link href="/properties">Browse listings</Link>
          <Link href="/applications">Track an application</Link>
          <Link href="/viewings">My viewings</Link>
        </div>

        <div>
          <h4>For landlords</h4>
          <Link href="/dashboard">My listings</Link>
          <Link href="/dashboard/properties/new">List a property</Link>
          <Link href="/dashboard/applications">Applications</Link>
          <Link href="/dashboard/viewings">Viewing requests</Link>
        </div>

        <div>
          <h4>Account</h4>
          <Link href="/login">Log in</Link>
          <Link href="/register">Create an account</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>UrbanRent — Buea, Cameroon</p>
        <p>Rent-only. No agents in the loop.</p>
      </div>
    </footer>
  );
}