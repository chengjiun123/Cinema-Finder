import { useEffect, useState } from "react";
import { DEFAULT_LOCATION, type Coordinates } from "@/lib/cinema-data";

export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export interface UseUserLocationResult {
  location: Coordinates;
  status: LocationStatus;
  isFallback: boolean;
  request: () => void;
}

/**
 * Resolve the user's geolocation with a graceful fallback to KL city center.
 *
 * - Defers the browser prompt until `request()` is called the first time, so
 *   pages that don't need a location don't trigger the prompt.
 * - Always returns a usable `location` (falls back to KL city center).
 * - `isFallback` is true whenever the returned coords are the default.
 */
export function useUserLocation(autoRequest = false): UseUserLocationResult {
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [status, setStatus] = useState<LocationStatus>("idle");

  const request = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setStatus("granted");
      },
      () => {
        setStatus("denied");
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  };

  useEffect(() => {
    if (autoRequest) request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRequest]);

  const isFallback = status !== "granted";
  return { location, status, isFallback, request };
}
