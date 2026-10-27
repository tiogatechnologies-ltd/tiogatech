import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ order: query }) }) }) } }));
import { useCareers } from "@/hooks/useCareers";

beforeEach(() => { query.mockReset(); });
it("does not advertise hardcoded vacancies when the database fails", async () => {
  query.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
  const { result } = renderHook(useCareers);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.jobs).toEqual([]);
  expect(result.current.error).toMatch(/could not load/i);
});
it("finishes loading and gives an error for a network exception", async () => {
  query.mockRejectedValue(new Error("Network error"));
  const { result } = renderHook(useCareers);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.jobs).toEqual([]);
  expect(result.current.error).toBeTruthy();
});
it("keeps intentionally closed recruitment empty without reporting an outage", async () => {
  query.mockResolvedValue({ data: [], error: null });
  const { result } = renderHook(useCareers);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.jobs).toEqual([]);
  expect(result.current.error).toBeNull();
});
