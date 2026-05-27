import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useBlogPosts } from "@/hooks/useBlog";
import { Calendar, Clock, ArrowRight, Loader2 } from "lucide-react";

const Blog = () => {
  const { posts, loading } = useBlogPosts();

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

      <section className="section-container py-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
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
        )}
      </section>

      <SiteFooter />
    </div>
  );
};

export default Blog;
