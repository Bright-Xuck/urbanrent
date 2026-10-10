// ============================================================
// CONTACT US
// ============================================================

import { Mail, MapPin } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import Card from "../../../components/ui/Card";

export const metadata = { title: "Contact us | UrbanRent" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="Contact us"
        subtitle="Questions about a listing, an application, or the platform itself."
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card>
          <Mail className="h-5 w-5 text-navy" aria-hidden />
          <h2 className="mt-3 font-display text-lg text-ink">Email</h2>
          <p className="mt-1 text-sm text-ink-soft">
            support@urbanrent.cm
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            Replies usually within two working days.
          </p>
        </Card>

        <Card>
          <MapPin className="h-5 w-5 text-navy" aria-hidden />
          <h2 className="mt-3 font-display text-lg text-ink">Office</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Molyko, Buea
            <br />
            South West Region, Cameroon
          </p>
        </Card>
      </div>

      <div className="mt-8 border border-line p-6">
        <h2 className="font-display text-lg text-ink">
          Before you write to us
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Most questions about a specific property are best sent to the
          landlord — open the listing and use the apply or viewing request
          buttons. Your applications and viewings are all listed on your own
          pages, so you can check their status without waiting for a reply.
        </p>
      </div>
    </div>
  );
}