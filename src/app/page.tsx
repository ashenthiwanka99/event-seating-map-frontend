export const runtime = "nodejs";

import fs from "node:fs/promises";
import path from "node:path";
import SeatMap from "@/components/SeatMap";
import SeatSummary from "@/components/SeatSummary";
import { TVenue, Venue } from "@/types/venue";
import SeatControls from "@/components/SeatControls";


async function getVenue(): Promise<TVenue> {
  const file = await fs.readFile(path.join(process.cwd(), "public", "venue.json"), "utf8");
  return Venue.parse(JSON.parse(file));
}

export default async function Page() {
  const venue = await getVenue();
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <section className="flex-1 overflow-auto p-2 md:p-4">
        <SeatControls venue={venue} />
        <SeatMap venue={venue} />
      </section>
      <aside className="w-full md:w-96 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 p-4 sticky bottom-0 md:static bg-white/90 dark:bg-black/60 backdrop-blur">
        <SeatSummary venue={venue} />
      </aside>
    </main>
  );
}
