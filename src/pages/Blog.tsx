import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useBlogPosts } from "@/hooks/useBlog";
import { Calendar, Clock, ArrowRight, Loader2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 9;

const Blog = () => {
  const { posts, loading } = useBlogPosts();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => p.tags?.forEach((t) => s.add(t)));
    return Array.from(s).slice(0, 12);
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeTag && !p.tags?.includes(activeTag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, query, activeTag]);

  useEffect(() => { setPage(1); }, [query, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Tioga Technologies Blog",
    url: "https://tiogatechnologies.com/blog",
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://tiogatechnologies.com/blog/${p.slug}`,
      datePublished: p.published_at,
      author: { "@type": "Organization", name: p.author },
    })),
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Blog — Solar & Smart Home Insights"
        description="Energy tips, solar guides, smart home automation insights and product news from Tioga Technologies. Learn how to power your home reliably in Nigeria."
        path="/blog"
        jsonLd={jsonLd}
      />
      <SiteHeader />
      <PageHero
        eyebrow="Insights"
        title="The Tioga Blog"
        subtitle="Solar tips, smart-home guides, and energy insights from the field across Nigeria."
      />

      <section className="section-container py-12 sm:py-16">
        {/* Search + tag filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  !activeTag ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(t === activeTag ? null : t)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    activeTag === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No posts match your search.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  {p.cover_image_url && (
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={p.cover_image_url}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {p.tags?.[0] && (
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full mb-3">
                        {p.tags[0]}
                      </span>
                    )}
                    <h2 className="font-display text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      {p.published_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {p.read_minutes} min read
                      </span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Read article <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
};

export default Blog;
