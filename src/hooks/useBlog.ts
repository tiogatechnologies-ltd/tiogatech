import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author: string;
  tags: string[];
  category: string;
  published: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  read_minutes: number;
  created_at: string;
  updated_at: string;
}

const LIST_CACHE = "tioga:blog_posts:v2";
const POST_CACHE = (slug: string) => `tioga:blog_post:v2:${slug}`;

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const raw = sessionStorage.getItem(LIST_CACHE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed as BlogPost[];
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => posts.length === 0);

  useEffect(() => {
    let cancelled = false;
    const fetchPosts = async (attempt = 0): Promise<void> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (cancelled) return;
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        return fetchPosts(attempt + 1);
      }
      if (data) {
        setPosts(data as BlogPost[]);
        try { sessionStorage.setItem(LIST_CACHE, JSON.stringify(data)); } catch {}
      }
      setLoading(false);
    };
    fetchPosts();
    return () => { cancelled = true; };
  }, []);

  return { posts, loading };
};

export const useBlogPost = (slug: string | undefined) => {
  const [post, setPost] = useState<BlogPost | null>(() => {
    if (!slug) return null;
    try {
      const raw = sessionStorage.getItem(POST_CACHE(slug));
      if (raw) return JSON.parse(raw) as BlogPost;
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(() => !post);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const fetchOne = async (attempt = 0): Promise<void> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (cancelled) return;
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return fetchOne(attempt + 1);
      }
      if (!data && !error) setNotFound(true);
      if (data) {
        setPost(data as BlogPost);
        try { sessionStorage.setItem(POST_CACHE(slug), JSON.stringify(data)); } catch {}
      }
      setLoading(false);
    };
    fetchOne();
    return () => { cancelled = true; };
  }, [slug]);

  return { post, loading, notFound };
};
