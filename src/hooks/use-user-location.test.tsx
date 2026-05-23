import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUserLocation } from "./use-user-location";
import { DEFAULT_LOCATION } from "@/lib/cinema-data";

const originalGeolocation = globalThis.navigator?.geolocation;

function mockGeolocation(impl: Partial<Geolocation>) {
  Object.defineProperty(globalThis.navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn(), ...impl },
  });
}

afterEach(() => {
  if (originalGeolocation) {
    Object.defineProperty(globalThis.navigator, "geolocation", {
      configurable: true,
      value: originalGeolocation,
    });
  }
});

describe("useUserLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to KL city center and idle status", () => {
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toEqual(DEFAULT_LOCATION);
    expect(result.current.status).toBe("idle");
    expect(result.current.isFallback).toBe(true);
  });

  it("updates location when geolocation resolves successfully", () => {
    mockGeolocation({
      getCurrentPosition: (success) => {
        success({
          coords: {
            latitude: 1.23,
            longitude: 4.56,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    });

    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.request());

    expect(result.current.status).toBe("granted");
    expect(result.current.location).toEqual({ latitude: 1.23, longitude: 4.56 });
    expect(result.current.isFallback).toBe(false);
  });

  it("falls back to default location when geolocation is denied", () => {
    mockGeolocation({
      getCurrentPosition: (_success, error) => {
        error?.({ code: 1, message: "denied" } as GeolocationPositionError);
      },
    });

    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.request());

    expect(result.current.status).toBe("denied");
    expect(result.current.location).toEqual(DEFAULT_LOCATION);
    expect(result.current.isFallback).toBe(true);
  });
});
