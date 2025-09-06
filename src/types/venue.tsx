import { z } from "zod";

export const SeatStatus = z.enum(["available", "reserved", "sold", "held"]);

export const Seat = z.object({
  id: z.string(),
  col: z.number().int().positive(),
  x: z.number().optional(),
  y: z.number().optional(),
  priceTier: z.number().int().positive(),
  status: SeatStatus.default("available"),
});

export const Row = z.object({
  index: z.number().int().positive(),
  seats: z.array(Seat),
});

export const Section = z.object({
  id: z.string(),
  label: z.string(),
  transform: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    scale: z.number().default(1),
  }),
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
