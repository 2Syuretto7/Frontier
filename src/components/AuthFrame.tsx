import { LogoMark } from "@/components/ui/Logo";

/** The signed-out frame: the mark, a quiet grid with a violet wash, and one card. */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-wash" aria-hidden="true" />
      <header className="auth-top">
        <span className="brand"><LogoMark /><span className="brand-name">Frontier</span></span>
      </header>
      <main id="main" className="auth-main">{children}</main>
      <footer className="auth-foot">
        <span className="pill pill-success"><span className="pill-dot" />Private</span>
        <span>A personal university for one learner.</span>
      </footer>
    </div>
  );
}
