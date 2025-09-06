"use client";
import { useSelection } from "@/store/selection";
import { PRICE_BY_TIER, formatUSD } from "@/lib/pricing";
import { TVenue } from "@/types/venue";

type Props = { venue: TVenue };

export default function SeatSummary({ venue }: Props) {
  const { selected, clear } = useSelection();

  const seatById = new Map(
    venue.sections.flatMap(sec =>
      sec.rows.flatMap(r =>
        r.seats.map(s => [s.id, { s, secId: sec.id, row: r.index } as const])
      )
    )
  );

  const items = selected
    .map(id => seatById.get(id))
    .filter(Boolean)
    .map(v => v!);

  const subtotal = items.reduce((acc, { s }) => acc + (PRICE_BY_TIER[s.priceTier] ?? 0), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Selection ({items.length}/8)</h2>
      <div
        className="max-h-64 overflow-auto md:max-h-none md:overflow-visible
             divide-y divide-gray-200 dark:divide-gray-800 rounded
             border border-gray-200 dark:border-gray-800"
      >
        {items.length === 0 && <div className="p-3 text-sm opacity-70">No seats selected</div>}
        {items.map(({ s, secId, row }) => (
          <div key={s.id} className="p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{s.id}</div>
              <div className="opacity-70">Section {secId} • Row {row} • Seat {s.col}</div>
              <div className="opacity-70 capitalize">{s.status}</div>
            </div>
            <div className="font-medium">{formatUSD(PRICE_BY_TIER[s.priceTier] ?? 0)}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Subtotal</div>
        <div className="text-lg font-semibold">{formatUSD(subtotal)}</div>
      </div>

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800"
          onClick={clear}
        >
          Clear
        </button>
        <button className="flex-1 rounded-md px-3 py-2 bg-blue-600 text-white disabled:opacity-60" disabled={items.length === 0}>
          Continue
        </button>
      </div>
    </div>
  );
}
