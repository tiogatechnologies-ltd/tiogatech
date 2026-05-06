import { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

const PageHero = ({ eyebrow, title, subtitle, children }: PageHeroProps) => (
  <section className="relative overflow-hidden bg-gradient-to-b from-muted/60 via-background to-background border-b border-border">
    {/* decorative blobs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-20 w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl" />
    </div>
    <div className="relative section-container py-16 sm:py-20 lg:py-24 text-center">
      {eyebrow && (
        <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight leading-[1.1] max-w-3xl mx-auto">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  </section>
);

export default PageHero;
