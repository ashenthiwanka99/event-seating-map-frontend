import fs from "node:fs/promises";
import path from "node:path";
import SeatMap from "@/components/SeatMap";
import SeatSummary from "@/components/SeatSummary";
import SeatControls from "@/components/SeatControls";
import Legend from "@/components/Legend";
import { Venue, type TVenue } from "@/types/venue";

export const runtime = "nodejs";

async function getVenue(): Promise<TVenue> {
  const file = await fs.readFile(path.join(process.cwd(), "public", "venue.json"), "utf8");
  return Venue.parse(JSON.parse(file));
}

export default async function Page() {
  const venue = await getVenue();
  return (
    <main className="min-h-screen grid md:grid-cols-[1fr_360px] gap-4 p-3 md:p-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold">{venue.name}</h1>
          <Legend />
        </div>
        <SeatControls venue={venue} />
        <div className="grid-wrap">
          <SeatMap venue={venue} />
        </div>
      </section>

      <aside className="space-y-3 md:sticky md:top-6 self-start">
        <SeatSummary venue={venue} />
      </aside>
    </main>
  );
}
