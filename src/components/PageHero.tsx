import { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

const PageHero = ({ eyebrow, title, subtitle, children }: PageHeroProps) => (
  <section className="relative overflow-hidden bg-secondary -mt-[64px] sm:-mt-[72px] pt-[64px] sm:pt-[72px]">
    {/* Cinematic gradient overlay matching landing hero */}
    <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/85 to-primary/40" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

    {/* Animated gradient orbs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-[460px] h-[460px] rounded-full bg-primary/30 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
      <div className="absolute -bottom-40 left-1/3 w-[420px] h-[420px] rounded-full bg-primary/25 blur-3xl animate-blob" style={{ animationDelay: "8s" }} />
    </div>

    <div className="relative section-container py-20 sm:py-24 lg:py-28 text-center">
      {eyebrow && (
        <p className="text-[11px] sm:text-xs font-semibold text-accent uppercase tracking-[0.25em] mb-4 animate-fade-up">
          {eyebrow}
        </p>
      )}
      <h1
        className="text-[2rem] sm:text-5xl lg:text-6xl font-display font-bold text-primary-foreground tracking-[-0.02em] leading-[1.08] max-w-3xl mx-auto animate-fade-up"
        style={{ animationDelay: "0.1s" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="mt-5 text-base sm:text-lg text-primary-foreground/75 max-w-2xl mx-auto leading-relaxed animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          {subtitle}
        </p>
      )}
      {children && (
        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          {children}
        </div>
      )}
    </div>
  </section>
);

export default PageHero;
