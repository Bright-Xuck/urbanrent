"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, Check, FileCheck2, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PROPERTY_TYPES } from "../../components/properties/PropertyFilters";
import { titleCase } from "../../lib/format";
import FeaturedProperties from "../../components/properties/FeaturedProperties";

const STEPS = [
  { icon: FileCheck2, number: "01", title: "Find a home", body: "Browse published rental listings and compare the details that matter to you." },
  { icon: CalendarCheck2, number: "02", title: "Arrange a viewing", body: "Propose a time that works. Your landlord can confirm it right in the platform." },
  { icon: ShieldCheck, number: "03", title: "Move forward", body: "Apply, follow decisions and keep a clear record of every important step." },
];

export default function HomePage() {
  const router = useRouter();
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setHeroSlide((current) => (current + 1) % 3), 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className={`hero-slide hero-slide-one${heroSlide === 0 ? " active" : ""}`} />
        <div className={`hero-slide hero-slide-two${heroSlide === 1 ? " active" : ""}`} />
        <div className={`hero-slide hero-slide-three${heroSlide === 2 ? " active" : ""}`} />
        <div className="home-hero-shade" />
        <div className="rp-container home-hero-content">
          <div className="hero-copy reveal is-visible">
            <span className="home-kicker"><span /> A clearer way to find home</span>
            <h1>Find your place.<br /><em>Feel at home.</em></h1>
            <p>Discover rental homes across Cameroon, arrange viewings and keep every important detail in one place.</p>
            <a className="hero-text-link" href="#featured">Explore the homes <span aria-hidden>↓</span></a>
          </div>
          <div className="hero-photo-note"><span className="note-dot" /> Homes worth coming home to <span className="note-rule" /></div>
          <form className="home-search" role="search" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const params = new URLSearchParams();
            for (const key of ["city", "propertyType", "minBedrooms", "maxRent"]) {
              const value = form.get(key);
              if (typeof value === "string" && value.trim()) params.set(key, value.trim());
            }
            const query = params.toString();
            router.push(query ? `/properties?${query}` : "/properties");
          }}>
            <div className="home-search-heading"><span>Start your search</span><small>Find the right fit</small></div>
            <label><span>Location</span><input name="city" placeholder="City or neighbourhood" /></label>
            <label><span>Property type</span><select name="propertyType" defaultValue=""><option value="">Any type</option>{PROPERTY_TYPES.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}</select></label>
            <label><span>Bedrooms</span><select name="minBedrooms" defaultValue=""><option value="">Any</option>{[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}+</option>)}</select></label>
            <label><span>Max monthly rent</span><input name="maxRent" type="number" min={0} placeholder="Any budget" /></label>
            <button type="submit" aria-label="Search properties"><Search size={19} /><span>Search homes</span></button>
          </form>
          <div className="hero-pagination" aria-label="Hero image slides">{[0, 1, 2].map((slide) => <button type="button" key={slide} aria-label={`Show image ${slide + 1}`} aria-current={heroSlide === slide} onClick={() => setHeroSlide(slide)} />)}<span>0{heroSlide + 1} / 03</span></div>
        </div>
      </section>

      <section className="home-intro rp-section">
        <div className="rp-container intro-row reveal">
          <p className="home-kicker">A place for your next chapter</p>
          <h2>Finding home should feel<br />like <em>the beginning.</em></h2>
          <p className="intro-copy">A considered way to find a rental, connect with landlords and move with confidence. Start with a home that feels right.</p>
        </div>
      </section>

      <div id="featured"><FeaturedProperties /></div>

      <section className="home-story rp-section">
        <div className="rp-container story-grid">
          <div className="story-image reveal"><img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85" alt="Sunlit contemporary home with a garden" /><span className="story-image-caption">A little more room to breathe</span></div>
          <div className="story-copy reveal">
            <span className="home-kicker">Made for the way you move</span>
            <h2>Find your perfect place with <em>confidence.</em></h2>
            <p>Good decisions start with clear details. Explore published homes, see what each offers and connect with the people who manage them.</p>
            <ul>{["Straightforward property details", "Viewing requests in one place", "A clear record from application to decision"].map((item) => <li key={item}><Check size={17} />{item}</li>)}</ul>
            <Link className="story-link" href="/about-us">About UrbanRent <span aria-hidden>↗</span></Link>
            <div className="story-thumbs" aria-hidden>
              {["photo-1600585154340-be6161a56a0c", "photo-1600607687920-4e2a09cf159d", "photo-1600566753086-00f18fb6b3ea"].map((photo) => <img key={photo} src={`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=300&h=230&q=80`} alt="" />)}
            </div>
          </div>
        </div>
      </section>

      <section className="home-steps rp-section">
        <div className="rp-container">
          <div className="steps-heading reveal"><div><span className="home-kicker">A simpler journey</span><h2>From first look<br />to <em>feeling at home.</em></h2></div><p>Every step has a place. Keep conversations, viewings and applications moving with a little more clarity.</p></div>
          <div className="steps-grid">{STEPS.map(({ icon: Icon, number, title, body }, index) => <article className="step-card reveal" key={number} style={{ transitionDelay: `${index * 100}ms` }}><div className="step-top"><Icon size={24} strokeWidth={1.5} /><span>{number}</span></div><h3>{title}</h3><p>{body}</p><span className="step-accent" /></article>)}</div>
        </div>
      </section>

      <section className="home-cta rp-section"><div className="rp-container cta-panel reveal"><div><span className="home-kicker">For property owners</span><h2>Have a home someone will love?</h2><p>Share your listing and manage interest in one place.</p></div><Link className="btn btn-light" href="/register">List your property <span aria-hidden>↗</span></Link></div></section>
    </main>
  );
}
