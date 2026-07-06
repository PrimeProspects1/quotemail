// Standalone Solar API test — runs directly with node test_solar.mjs
import { config } from "dotenv";
config();

const SOLAR_KEY = process.env.GOOGLE_SOLAR_API_KEY;

// Test with Rogers, AR residential address
const lat = 36.3320;
const lng = -94.1185;

console.log(`Testing Solar API for lat=${lat}, lng=${lng}`);
console.log(`Using key: ${SOLAR_KEY?.slice(0, 10)}...`);

try {
  // Correct Solar API URL: https://solar.googleapis.com/v1/buildingInsights:findClosest
  const url = new URL("https://solar.googleapis.com/v1/buildingInsights:findClosest");
  url.searchParams.set("key", SOLAR_KEY);
  url.searchParams.set("location.latitude", lat.toString());
  url.searchParams.set("location.longitude", lng.toString());
  url.searchParams.set("requiredQuality", "LOW");

  console.log(`\nCalling: ${url.toString().replace(SOLAR_KEY, "***")}`);

  const res = await fetch(url.toString());
  const body = await res.text();

  if (!res.ok) {
    console.error(`ERROR ${res.status}:`, body.slice(0, 500));
    process.exit(1);
  }

  const data = JSON.parse(body);

  console.log("\n=== SOLAR API RESPONSE ===");
  console.log("wholeRoofStats.areaMeters2:", data.solarPotential?.wholeRoofStats?.areaMeters2);
  console.log("maxArrayAreaMeters2:", data.solarPotential?.maxArrayAreaMeters2);

  const totalAreaM2 = data.solarPotential?.wholeRoofStats?.areaMeters2 ?? 0;
  const measuredSqFt = Math.round(totalAreaM2 * 10.7639);
  const roofSquares = (measuredSqFt / 100).toFixed(2);

  console.log("\n=== CALCULATED VALUES ===");
  console.log("totalAreaM2:", totalAreaM2.toFixed(2));
  console.log("measuredSqFt:", measuredSqFt);
  console.log("roofSquares:", roofSquares);

  const segments = data.solarPotential?.roofSegmentStats ?? [];
  console.log("\n=== ROOF SEGMENTS ===");
  console.log("segment count:", segments.length);
  segments.forEach((s, i) => {
    console.log(`  segment ${i}: pitchDeg=${s.pitchDegrees?.toFixed(1)}, area=${s.stats?.areaMeters2?.toFixed(1)} m2`);
  });

  const dominant = segments.reduce(
    (max, seg) => (seg.stats?.areaMeters2 ?? 0) > (max.stats?.areaMeters2 ?? 0) ? seg : max,
    segments[0] ?? { pitchDegrees: 0, stats: { areaMeters2: 0 } }
  );
  const pitchDeg = dominant?.pitchDegrees ?? 0;
  let pitch;
  if (pitchDeg < 5) pitch = "flat";
  else if (pitchDeg < 22) pitch = "4/12";
  else if (pitchDeg < 30) pitch = "6/12";
  else if (pitchDeg < 38) pitch = "8/12";
  else pitch = "10/12+";

  console.log("\n=== RESULT ===");
  console.log("dominant pitch degrees:", pitchDeg.toFixed(1));
  console.log("pitch category:", pitch);
  console.log("measuredSqFt:", measuredSqFt);
  console.log("roofSquares:", roofSquares);

} catch (e) {
  console.error("ERROR:", e.message);
}
