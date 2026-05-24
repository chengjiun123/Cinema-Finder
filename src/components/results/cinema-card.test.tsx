import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CinemaCard } from "./cinema-card";
import type { CinemaWithDetails } from "@/lib/cinema-data";

const cinema: CinemaWithDetails = {
  id: "c1",
  name: "GSC Mid Valley",
  photoUrl: "x",
  address: "Mid Valley Megamall, KL",
  description: "Flagship cinema with premium halls.",
  latitude: 3.1,
  longitude: 101.6,
  basePrice: 18,
  price: 21,
  distanceKm: 2.4,
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

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

  it("toggles expansion via aria-expanded and calls onToggle", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <CinemaCard cinema={cinema} rank={1} isExpanded={false} onToggle={onToggle} />,
    );
    const trigger = screen.getByRole("button", { name: /GSC Mid Valley/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(onToggle).toHaveBeenCalledWith("c1");

    rerender(<CinemaCard cinema={cinema} rank={1} isExpanded onToggle={onToggle} />);
    expect(screen.getByRole("button", { name: /GSC Mid Valley/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText(/Mid Valley Megamall, KL/)).toBeInTheDocument();
    expect(screen.getByText(/min drive/)).toBeInTheDocument();
    expect(screen.getByText(/Flagship cinema/)).toBeInTheDocument();
  });

  it("shows placeholder when image fails to load", () => {
    render(<CinemaCard cinema={cinema} rank={1} isExpanded />);
    const img = screen.getByAltText(/interior/) as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.queryByAltText(/interior/)).not.toBeInTheDocument();
  });
});
