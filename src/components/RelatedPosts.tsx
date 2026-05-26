import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost } from "@/hooks/useBlog";

interface Props {
  currentSlug: string;
  tags: string[];
  category: string;
}

const RelatedPosts = ({ currentSlug, tags, category }: Props) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .neq("slug", currentSlug)
        .order("published_at", { ascending: false })
        .limit(20);
      const all = (data as BlogPost[]) ?? [];
      const scored = all
        .map((p) => {
          const tagScore = (p.tags ?? []).filter((t) => tags.includes(t)).length * 2;
          const catScore = p.category === category ? 1 : 0;
          return { p, score: tagScore + catScore };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((s) => s.p);
      setPosts(scored.length ? scored : all.slice(0, 3));
    })();
  }, [currentSlug, tags.join(","), category]);

  if (posts.length === 0) return null;

  return (
    <section className="section-container max-w-5xl mt-16 pt-12 border-t border-border">
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">Related Articles</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((p) => (
          <Link
            key={p.id}
            to={`/blog/${p.slug}`}
            className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
          >
            {p.cover_image_url && (
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <div className="p-5">
              {p.tags?.[0] && (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full mb-2">
                  {p.tags[0]}
                </span>
              )}
              <h3 className="font-display text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {p.title}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{p.excerpt}</p>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                {p.published_at && (
                  <span className="inline-flex items-center gap-1"><Calendar size={11} />{new Date(p.published_at).toLocaleDateString()}</span>
                )}
                <span className="inline-flex items-center gap-1"><Clock size={11} />{p.read_minutes}m</span>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Read <ArrowRight size={11} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;
