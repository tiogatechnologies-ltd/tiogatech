import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type LandingContent = Record<string, any>;

let inflight: Promise<Record<string, LandingContent>> | null = null;

export function useLandingContent(sectionKey: string) {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async (): Promise<Record<string, LandingContent>> => {
      if (inflight) return inflight;
      inflight = Promise.resolve(supabase.from("landing_content").select("*")).then(({ data }) => {
        const map: Record<string, LandingContent> = {};
        (data ?? []).forEach((row: any) => { map[row.section_key] = row.content; });
        return map;
      }).finally(() => { inflight = null; });
      return inflight;
    };
    fetch().then((map) => {
      if (cancelled) return;
      setContent(map[sectionKey] ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [sectionKey]);

  return { content, loading };
}

export function invalidateLandingCache() {
  inflight = null;
}
