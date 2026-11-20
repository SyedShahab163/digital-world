/** Prisma filter parts: row's [start, end) window contains `now`. Null bounds are open-ended. */
export function windowWhere(startField: string, endField: string, now = new Date()) {
  return [
    { OR: [{ [startField]: null }, { [startField]: { lte: now } }] },
    { OR: [{ [endField]: null }, { [endField]: { gt: now } }] },
  ];
}

export type ScheduleState = "LIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED";

export function scheduleState(
  row: { isActive: boolean; startsAt?: Date | null; endsAt?: Date | null },
  now = new Date(),
): ScheduleState {
  if (!row.isActive) return "DISABLED";
  if (row.startsAt && row.startsAt > now) return "SCHEDULED";
  if (row.endsAt && row.endsAt <= now) return "EXPIRED";
  return "LIVE";
}

export const isLive = (row: { isActive: boolean; startsAt?: Date | null; endsAt?: Date | null }, now = new Date()) =>
  scheduleState(row, now) === "LIVE";
