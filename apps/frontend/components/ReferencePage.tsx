import Link from "next/link";
import { PageFrame, PropertyGrid } from "./Navbar";

export function ReferencePage({ title, eyebrow = "REALPRESS", children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return <PageFrame title={title} eyebrow={eyebrow}><section className="section">{children}</section></PageFrame>;
}

export function ListingPage({ title, eyebrow = "PROPERTIES" }: { title: string; eyebrow?: string }) {
  return <ReferencePage title={title} eyebrow={eyebrow}><div className="section-head"><p>Discover verified homes, apartments, and villas from trusted agents.</p></div><PropertyGrid /></ReferencePage>;
}

export function InfoPage({ title, eyebrow, intro, links = [] }: { title: string; eyebrow?: string; intro: string; links?: { label: string; href: string }[] }) {
  return <ReferencePage title={title} eyebrow={eyebrow}><div className="content-narrow"><p className="lead">{intro}</p>{links.map((link) => <Link className="btn" href={link.href} key={link.href}>{link.label}</Link>)}</div></ReferencePage>;
}
