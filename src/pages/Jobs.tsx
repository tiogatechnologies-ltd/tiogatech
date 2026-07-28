import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import JobCard, { type Job } from "@/components/JobCard";
import CareerApplicationDialog from "@/components/CareerApplicationDialog";
import { useCareers } from "@/hooks/useCareers";
import SEO from "@/components/SEO";
import bgTeam from "@/assets/bg-team-meeting.jpg";
import { Search, MapPin, Briefcase, X, ArrowLeft } from "lucide-react";
import { breadcrumbJsonLd } from "@/lib/seoSchema";

const Jobs = () => {
  const { jobs, loading } = useCareers();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const locations = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => j.location && set.add(j.location));
    return ["all", ...Array.from(set)];
  }, [jobs]);

  const categories = useMemo(() => {
    // Lightweight category inference from job title.
    const cats = new Set<string>(["all"]);
    jobs.forEach((j) => {
      const t = j.title.toLowerCase();
      if (t.includes("install") || t.includes("engineer")) cats.add("Engineering");
      if (t.includes("sales") || t.includes("business")) cats.add("Sales");
      if (t.includes("admin")) cats.add("Operations");
      if (t.includes("partner")) cats.add("Partnerships");
    });
    return Array.from(cats);
  }, [jobs]);

  const matchesCategory = (job: Job, cat: string) => {
    if (cat === "all") return true;
    const t = job.title.toLowerCase();
    if (cat === "Engineering") return t.includes("install") || t.includes("engineer");
    if (cat === "Sales") return t.includes("sales") || t.includes("business");
    if (cat === "Operations") return t.includes("admin");
    if (cat === "Partnerships") return t.includes("partner");
    return true;
  };

  const filtered = jobs.filter((j) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || j.title.toLowerCase().includes(q) || j.summary.toLowerCase().includes(q);
    const matchL = location === "all" || j.location === location;
    const matchC = matchesCategory(j, category);
    return matchQ && matchL && matchC;
  });

  const hasFilters = query || location !== "all" || category !== "all";

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="All Open Roles — Tioga Technologies Careers"
        description="Browse every open role at Tioga Technologies. Filter by location, category and keyword. Engineering, installation, sales and operations roles across Nigeria."
        path="/careers/jobs"
        jsonLd={breadcrumbJsonLd([{ name: "Careers", path: "/career" }, { name: "Open Roles", path: "/careers/jobs" }])}
      />
      <SiteHeader />

      <PageHero
        eyebrow="All Openings"
        title="Find your next role at Tioga"
        subtitle="Search and filter every open position across our engineering, installation, sales and operations teams."
        backgroundImage={bgTeam}
        backgroundAlt="Tioga Technologies team"
      >
        <Link
          to="/career"
          className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/15 transition-all"
        >
          <ArrowLeft size={16} /> Back to Careers
        </Link>
      </PageHero>

      <section className="section-padding">
        <div className="section-container">
          {/* Filters */}
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 mb-8 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or keyword..."
                  className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full md:w-56 rounded-xl border border-input bg-background pl-10 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
                >
                  {locations.map((l) => (
                    <option key={l} value={l}>{l === "all" ? "All locations" : l}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full md:w-48 rounded-xl border border-input bg-background pl-10 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category chips */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      category === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground/70 hover:bg-muted/70"
                    }`}
                  >
                    {c === "all" ? "All" : c}
                  </button>
                ))}
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setLocation("all"); setCategory("all"); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} /> Clear
                  </button>
                )}
              </div>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Showing {filtered.length} of {jobs.length} role{jobs.length === 1 ? "" : "s"}
            </p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading roles...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border">
              <p className="text-foreground font-display font-bold mb-2">No matching roles</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or send us a speculative application.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
              {filtered.map((job, i) => (
                <JobCard key={job.id || job.title} job={job} index={i} onApply={setSelectedJob} />
              ))}
            </div>
          )}
        </div>
      </section>

      <CareerApplicationDialog
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      />

      <SiteFooter />
    </div>
  );
};

export default Jobs;
