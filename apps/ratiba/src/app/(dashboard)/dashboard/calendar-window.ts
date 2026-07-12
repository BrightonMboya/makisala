export interface CalendarWindow {
  rangeStart: string;
  rangeEnd: string;
}

// A month view renders a ~6-week grid that spills into the adjacent months, so
// over-fetch the anchor month padded by a week on each side to cover every
// visible day. The server widens the start further to catch multi-day trips that
// began before the window but are still ongoing inside it.
export function monthWindow(anchor: Date): CalendarWindow {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1 - 7, 0, 0, 0, 0);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 7, 23, 59, 59, 999);
  return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
}
