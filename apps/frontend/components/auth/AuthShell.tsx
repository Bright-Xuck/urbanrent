import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, House, ShieldCheck, Sparkles } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-wrap">
      <section className="auth-layout" aria-label="UrbanRent account">
        <aside className="auth-aside">
          <Link href="/" className="auth-aside-brand" aria-label="UrbanRent home">
            <span className="auth-mark">UR</span>
            <span>UrbanRent</span>
          </Link>

          <div className="auth-aside-copy">
            <span className="auth-eyebrow">
              <Sparkles size={15} aria-hidden />
              YOUR NEXT CHAPTER STARTS HERE
            </span>
            <h2>
              Find a place
              <br />
              to <em>feel at home.</em>
            </h2>
            <p>
              A simpler way to discover trusted homes and connect with the
              people behind them.
            </p>
          </div>

          <div className="auth-illustration" aria-hidden="true">
            <div className="auth-sun" />
            <div className="auth-orbit auth-orbit-one" />
            <div className="auth-orbit auth-orbit-two" />
            <div className="auth-house">
              <div className="auth-house-roof" />
              <div className="auth-house-body">
                <span className="auth-window auth-window-one" />
                <span className="auth-window auth-window-two" />
                <span className="auth-door" />
              </div>
            </div>
            <div className="auth-illustration-note">
              <span className="auth-note-icon">
                <House size={17} />
              </span>
              <span>
                <strong>A place of your own</strong>
                <small>Closer than you think</small>
              </span>
              <ArrowUpRight className="auth-note-arrow" size={17} />
            </div>
          </div>

          <div className="auth-aside-footer">
            <ShieldCheck size={17} aria-hidden />
            <span>Thoughtful renting, built around trust.</span>
          </div>
        </aside>

        <div className="auth-main">
          <div className="auth-card">{children}</div>
          <p className="auth-legal">
            By continuing, you agree to UrbanRent&apos;s{" "}
            <Link href="/term-conditions">Terms of use</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
