import { describe, it, expect } from "vitest";

// Test the Google Solar API key by calling the API directly
// This validates the key is valid and the Solar API is enabled
describe("Google Solar API", () => {
  it("should return real roof measurements for a known residential address", async () => {
    const apiKey = process.env.GOOGLE_SOLAR_API_KEY;
    expect(apiKey, "GOOGLE_SOLAR_API_KEY must be set").toBeTruthy();

    const url = new URL("https://solar.googleapis.com/v1/buildingInsights:findClosest");
    url.searchParams.set("key", apiKey!);
    url.searchParams.set("location.latitude", "36.3320");  // Rogers, AR
    url.searchParams.set("location.longitude", "-94.1185");
    url.searchParams.set("requiredQuality", "LOW");

    const res = await fetch(url.toString());
    expect(res.status, `Solar API returned ${res.status}`).toBe(200);

    const data = await res.json() as {
      solarPotential?: {
        wholeRoofStats?: { areaMeters2?: number };
        roofSegmentStats?: Array<{ pitchDegrees: number; stats: { areaMeters2: number } }>;
      };
    };

    const totalAreaM2 = data.solarPotential?.wholeRoofStats?.areaMeters2 ?? 0;
    expect(totalAreaM2).toBeGreaterThan(0);

    const measuredSqFt = Math.round(totalAreaM2 * 10.7639);
    expect(measuredSqFt).toBeGreaterThan(500);   // Any real house > 500 sq ft
    expect(measuredSqFt).toBeLessThan(20000);    // Sanity upper bound

    const segments = data.solarPotential?.roofSegmentStats ?? [];
    expect(segments.length).toBeGreaterThan(0);

    // Pitch detection: skip flat segments, find dominant pitched segment
    const pitched = segments.filter(s => (s.pitchDegrees ?? 0) >= 5);
    const candidates = pitched.length > 0 ? pitched : segments;
    const dominant = candidates.reduce(
      (max, seg) => (seg.stats?.areaMeters2 ?? 0) > (max.stats?.areaMeters2 ?? 0) ? seg : max,
      candidates[0]
    );
    const pitchDeg = dominant?.pitchDegrees ?? 0;
    expect(pitchDeg).toBeGreaterThan(0);

    console.log(`✓ Solar API: ${measuredSqFt} sq ft, ${segments.length} segments, dominant pitch ${pitchDeg.toFixed(1)}°`);
  }, 15000); // 15s timeout for network call
});
