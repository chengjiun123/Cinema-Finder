import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CinemaCard } from "./cinema-card";
import type { CinemaWithDetails } from "@/lib/cinema-data";

const cinema: CinemaWithDetails = {
  id: "c1",
  name: "GSC Mid Valley",
  photoUrl: "x",
  address: "Mid Valley Megamall",
  description: "Flagship cinema",
  latitude: 3.1,
  longitude: 101.6,
  basePrice: 18,
  price: 21,
  distanceKm: 2.4,
};

describe("CinemaCard", () => {
  it("renders name, distance, and price", () => {
    render(<CinemaCard cinema={cinema} rank={1} />);
    expect(screen.getByText("GSC Mid Valley")).toBeInTheDocument();
    expect(screen.getByText(/2\.4 km/)).toBeInTheDocument();
    expect(screen.getByText("RM 21")).toBeInTheDocument();
  });

  it("formats sub-kilometer distance in meters", () => {
    render(<CinemaCard cinema={{ ...cinema, distanceKm: 0.42 }} rank={2} />);
    expect(screen.getByText(/420 m/)).toBeInTheDocument();
  });
});
