import { HttpTransport } from "./base";
import type { GeocodeResultItem } from "./models";

/**
 * Sub-client for the Locations/Geocoding endpoints.
 *
 * Access via `client.locations`.
 */
export class LocationsClient {
  /** @internal */
  constructor(private readonly http: HttpTransport) {}

  /**
   * Geocode a location string into structured locations with coordinates.
   *
   * @param location - The location string to geocode (e.g., "San Francisco, CA" or "London, UK").
   * @returns A `GeocodeResultItem` with resolved locations.
   */
  async geocode(location: string): Promise<GeocodeResultItem> {
    const params: Record<string, string> = { location };
    return this.http.get<GeocodeResultItem>("/api/locations/geocode", params);
  }
}
