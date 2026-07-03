const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function fetchFreshRows<T>(pathAndQuery: string): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const response = await fetch(`${API_URL}/${pathAndQuery}`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    return { data: await response.json(), error: null };
  } catch (error: any) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function fetchFreshSingle<T>(pathAndQuery: string): Promise<{ data: T | null; error: Error | null }> {
  const result = await fetchFreshRows<T>(pathAndQuery);
  return { data: result.data?.[0] ?? null, error: result.error };
}