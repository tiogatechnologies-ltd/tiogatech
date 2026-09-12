import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProductCompare, MAX_COMPARE } from "@/hooks/useProductCompare";
import type { RetailProduct } from "@/types/retail";

const makeMockProduct = (id: string, name: string): RetailProduct => ({
  id,
  name,
  category: "inverters",
  series: "Series X",
  description: "Description",
  features: ["Feature 1", "Feature 2"],
  best_for: "Homes",
  price: "₦1,000,000",
  numeric_price: 1000000,
  tier: "premium",
  image_url: "/test.webp",
  specifications: { Power: "5kW", Voltage: "48V" },
  tags: [],
});

describe("useProductCompare", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes with an empty list and modal closed", () => {
    const { result } = renderHook(() => useProductCompare());
    expect(result.current.compareItems).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.isOpen).toBe(false);
  });

  it("adds and removes products via toggleCompare", () => {
    const { result } = renderHook(() => useProductCompare());
    const prod1 = makeMockProduct("p1", "Inverter 5kW");

    act(() => {
      result.current.toggleCompare(prod1);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.isInCompare("p1")).toBe(true);
    expect(result.current.compareItems[0].name).toBe("Inverter 5kW");

    // Toggling again should remove it
    act(() => {
      result.current.toggleCompare(prod1);
    });

    expect(result.current.count).toBe(0);
    expect(result.current.isInCompare("p1")).toBe(false);
  });

  it("adds products via addCompare without removing if already present", () => {
    const { result } = renderHook(() => useProductCompare());
    const prod1 = makeMockProduct("p1", "Inverter 5kW");

    act(() => {
      const added = result.current.addCompare(prod1);
      expect(added).toBe(true);
    });

    expect(result.current.count).toBe(1);

    // Calling addCompare again should not remove it
    act(() => {
      const added = result.current.addCompare(prod1);
      expect(added).toBe(true);
    });

    expect(result.current.count).toBe(1);
  });

  it("enforces MAX_COMPARE limit of 4 items", () => {
    const { result } = renderHook(() => useProductCompare());

    act(() => {
      for (let i = 1; i <= MAX_COMPARE + 2; i++) {
        result.current.toggleCompare(makeMockProduct(`p${i}`, `Product ${i}`));
      }
    });

    expect(result.current.count).toBe(MAX_COMPARE);
  });

  it("clears all compare items", () => {
    const { result } = renderHook(() => useProductCompare());

    act(() => {
      result.current.toggleCompare(makeMockProduct("p1", "P1"));
      result.current.toggleCompare(makeMockProduct("p2", "P2"));
    });

    expect(result.current.count).toBe(2);

    act(() => {
      result.current.clearCompare();
    });

    expect(result.current.count).toBe(0);
    expect(result.current.compareItems).toEqual([]);
    expect(result.current.isOpen).toBe(false);
  });

  it("synchronizes modal isOpen state via openCompareModal and closeCompareModal", () => {
    const { result: hook1 } = renderHook(() => useProductCompare());
    const { result: hook2 } = renderHook(() => useProductCompare());

    expect(hook1.current.isOpen).toBe(false);
    expect(hook2.current.isOpen).toBe(false);

    act(() => {
      hook1.current.openCompareModal();
    });

    expect(hook1.current.isOpen).toBe(true);
    expect(hook2.current.isOpen).toBe(true);

    act(() => {
      hook2.current.closeCompareModal();
    });

    expect(hook1.current.isOpen).toBe(false);
    expect(hook2.current.isOpen).toBe(false);
  });

  it("deduplicates products with matching names even if IDs differ (static vs DB row)", () => {
    const { result } = renderHook(() => useProductCompare());
    const staticItem = makeMockProduct("a000-static-id", "Deye 5kW Hybrid Inverter");
    const dbItem = makeMockProduct("1111-db-uuid", "Deye 5kW Hybrid Inverter");

    act(() => {
      result.current.addCompare(staticItem);
    });
    expect(result.current.count).toBe(1);

    // Attempting to add DB item with different ID but same name should not create duplicate
    act(() => {
      result.current.addCompare(dbItem);
    });
    expect(result.current.count).toBe(1);
    expect(result.current.isInCompare("1111-db-uuid", "Deye 5kW Hybrid Inverter")).toBe(true);
  });

  it("isInCompare matches by ID or name", () => {
    const { result } = renderHook(() => useProductCompare());
    const item = makeMockProduct("p-100", "Felicity 5kWh Lithium Battery");

    act(() => {
      result.current.addCompare(item);
    });

    expect(result.current.isInCompare("p-100")).toBe(true);
    expect(result.current.isInCompare("p-different", "Felicity 5kWh Lithium Battery")).toBe(true);
    expect(result.current.isInCompare("p-different", "Non-existent")).toBe(false);
  });
});
