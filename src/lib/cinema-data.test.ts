import { describe, expect, it } from "vitest";
import {
  calculateDistanceKm,
  DEFAULT_LOCATION,
  estimateDriveMinutes,
  getCinemasForMovies,
  getMovies,
  getMoviesByIds,
} from "./cinema-data";

describe("calculateDistanceKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(calculateDistanceKm(DEFAULT_LOCATION, DEFAULT_LOCATION)).toBe(0);
  });

  it("returns a positive number for distant coordinates", () => {
    const klcc = { latitude: 3.1579, longitude: 101.7123 };
    const sunway = { latitude: 3.0726, longitude: 101.6068 };
    const distance = calculateDistanceKm(klcc, sunway);
    expect(distance).toBeGreaterThan(10);
    expect(distance).toBeLessThan(20);
  });

  it("is symmetric", () => {
    const a = { latitude: 3.1579, longitude: 101.7123 };
    const b = { latitude: 3.0726, longitude: 101.6068 };
    expect(calculateDistanceKm(a, b)).toBeCloseTo(calculateDistanceKm(b, a), 6);
  });
});

describe("getMovies", () => {
  it("returns all movies when no filters are given", () => {
    expect(getMovies().length).toBeGreaterThanOrEqual(20);
  });

  it("filters case-insensitively by title", () => {
    const results = getMovies({ search: "DUNE" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((m) => m.title.toLowerCase().includes("dune"))).toBe(true);
  });

  it("returns empty when no movie matches search", () => {
    expect(getMovies({ search: "zzz-no-match-zzz" })).toEqual([]);
  });
});

describe("getMoviesByIds", () => {
  it("preserves order and drops unknown ids", () => {
    const result = getMoviesByIds(["m_wicked", "unknown-id", "m_dune_2"]);
    expect(result.map((m) => m.id)).toEqual(["m_wicked", "m_dune_2"]);
  });
});

describe("getCinemasForMovies", () => {
  it("returns one group per requested movie in the same order", () => {
    const groups = getCinemasForMovies(["m_dune_2", "m_wicked"], DEFAULT_LOCATION);
    expect(groups.map((g) => g.movieId)).toEqual(["m_dune_2", "m_wicked"]);
  });

  it("sorts cinemas by distance ascending then price ascending", () => {
    const [group] = getCinemasForMovies(["m_dune_2"], DEFAULT_LOCATION);
    for (let i = 1; i < group.cinemas.length; i++) {
      const prev = group.cinemas[i - 1];
      const curr = group.cinemas[i];
      if (prev.distanceKm === curr.distanceKm) {
        expect(prev.price).toBeLessThanOrEqual(curr.price);
      } else {
        expect(prev.distanceKm).toBeLessThanOrEqual(curr.distanceKm);
      }
    }
  });

  it("produces deterministic prices across calls", () => {
    const a = getCinemasForMovies(["m_dune_2"], DEFAULT_LOCATION);
    const b = getCinemasForMovies(["m_dune_2"], DEFAULT_LOCATION);
    expect(a[0].cinemas.map((c) => c.price)).toEqual(b[0].cinemas.map((c) => c.price));
  });

  it("returns sensible prices (positive and capped)", () => {
    const [group] = getCinemasForMovies(["m_dune_2"], DEFAULT_LOCATION);
    for (const c of group.cinemas) {
      expect(c.price).toBeGreaterThanOrEqual(8);
      expect(c.price).toBeLessThan(40);
    }
  });
});

describe("estimateDriveMinutes", () => {
  it("returns at least 2 minutes for trivial distances", () => {
    expect(estimateDriveMinutes(0.1)).toBeGreaterThanOrEqual(2);
  });

  it("scales roughly linearly with distance", () => {
    expect(estimateDriveMinutes(15)).toBeGreaterThan(estimateDriveMinutes(5));
  });
});
