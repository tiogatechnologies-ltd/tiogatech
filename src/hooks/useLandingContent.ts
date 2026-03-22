import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type LandingContent = Record<string, any>;

let cache: Record<string, LandingContent> | null = null;

export function useLandingContent(sectionKey: string) {
  const [content, setContent] = useState<LandingContent | null>(cache?.[sectionKey] ?? null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setContent(cache[sectionKey] ?? null);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase.from("landing_content").select("*");
      const map: Record<string, LandingContent> = {};
      (data ?? []).forEach((row: any) => { map[row.section_key] = row.content; });
      cache = map;
      setContent(map[sectionKey] ?? null);
      setLoading(false);
    };
    fetch();
  }, [sectionKey]);

  return { content, loading };
}

export function invalidateLandingCache() {
  cache = null;
}
