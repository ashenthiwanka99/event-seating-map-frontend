import { z } from "zod";

export const SeatStatus = z.enum(["available", "reserved", "sold", "held"]);
export const Seat = z.object({
  id: z.string(),
  col: z.number(),
  x: z.number(),
  y: z.number(),
  priceTier: z.number(),
  status: SeatStatus,
});
export const Row = z.object({ index: z.number(), seats: z.array(Seat) });
export const Section = z.object({
  id: z.string(),
  label: z.string(),
  transform: z.object({ x: z.number(), y: z.number(), scale: z.number() }),
  rows: z.array(Row),
});
export const Venue = z.object({
  venueId: z.string(),
  name: z.string(),
  map: z.object({ width: z.number(), height: z.number() }),
  sections: z.array(Section),
});
export type TVenue = z.infer<typeof Venue>;
export type TSeat = z.infer<typeof Seat>;
