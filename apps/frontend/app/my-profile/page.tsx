import { InfoPage } from "../../components/ReferencePage";

export const metadata = { title: "My Profile | RealPress" };

export default function ProfilePage() {
  return <InfoPage title="My Profile" eyebrow="ACCOUNT" intro="Manage your profile, saved properties, and property enquiries from one place." links={[{ label: "Browse Properties", href: "/properties" }, { label: "View Wishlist", href: "/wishlist" }]} />;
}
