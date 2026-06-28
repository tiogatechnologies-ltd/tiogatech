import { Link, useParams, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import RelatedPosts from "@/components/RelatedPosts";
import { useBlogPost } from "@/hooks/useBlog";
import { Calendar, Clock, ArrowLeft, Loader2, User } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading, notFound } = useBlogPost(slug);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !post) return <Navigate to="/blog" replace />;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image_url || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Tioga Technologies",
      logo: { "@type": "ImageObject", url: "https://tiogatechnologies.com/favicon.png" },
    },
    mainEntityOfPage: `https://tiogatechnologies.com/blog/${post.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tiogatechnologies.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://tiogatechnologies.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://tiogatechnologies.com/blog/${post.slug}` },
    ],
  };

  return (
    <div className="min-h-screen">
      <SEO
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt}
        path={`/blog/${post.slug}`}
        image={post.cover_image_url || undefined}
        type="article"
        jsonLd={[articleJsonLd, breadcrumbJsonLd]}
      />
      <SiteHeader />

      <article className="pt-28 sm:pt-32 pb-16">
        <div className="section-container max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft size={14} /> Back to Blog
          </Link>

          {post.tags?.[0] && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full mb-4">
              {post.tags[0]}
            </span>
          )}

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><User size={14} /> {post.author}</span>
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {post.read_minutes} min read</span>
          </div>

          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="mt-8 w-full rounded-2xl border border-border"
            />
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none mt-10 prose-headings:font-display prose-headings:tracking-tight prose-headings:mt-10 prose-headings:mb-4 prose-p:my-5 prose-p:leading-relaxed prose-li:my-1.5 prose-a:text-primary prose-img:rounded-xl prose-blockquote:border-l-primary prose-blockquote:text-foreground/80">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {(() => {
                let c = post.content ?? "";
                if (post.cover_image_url) {
                  const cover = post.cover_image_url.trim();
                  // Strip any leading markdown image whose URL matches the cover (even with whitespace/title)
                  c = c.replace(/^\s*!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*\n+/, (full, url) => (url.trim() === cover ? "" : full));
                  // Also strip the first occurrence of the cover image anywhere in the top 400 chars
                  const head = c.slice(0, 400);
                  const idx = head.indexOf(cover);
                  if (idx !== -1) {
                    const re = new RegExp(`!\\[[^\\]]*\\]\\(\\s*${cover.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^)]*\\)\\s*\\n?`);
                    c = c.replace(re, "");
                  }
                }
                return c;
              })()}
            </ReactMarkdown>
          </div>

        </div>
      </article>

      <RelatedPosts currentSlug={post.slug} tags={post.tags ?? []} category={post.category} />

      <SiteFooter />
    </div>
  );
};

export default BlogPost;
