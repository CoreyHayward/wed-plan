import type { TimelineItem } from "@/db/schema";

export const timelinePhases = [
  {
    value: "morning",
    label: "Morning",
    description: "Getting ready, arrivals, and the calm before the celebration.",
  },
  {
    value: "ceremony",
    label: "Ceremony",
    description: "The key moments around your vows and official start to the day.",
  },
  {
    value: "reception",
    label: "Reception",
    description: "Drinks, dinner, and speeches to keep everything flowing smoothly.",
  },
  {
    value: "evening",
    label: "Evening",
    description: "First dance, disco, and the moments that carry you into the night.",
  },
] as const;

export type TimelinePhase = (typeof timelinePhases)[number]["value"];

export const defaultTimelineItems: Array<{
  title: string;
  phase: TimelinePhase;
  startTime: string;
  notes: string;
}> = [
  {
    title: "Morning prep",
    phase: "morning",
    startTime: "09:00",
    notes: "Hair, make-up, getting dressed, and any final supplier check-ins.",
  },
  {
    title: "Guests arrive",
    phase: "ceremony",
    startTime: "12:30",
    notes: "Allow time for guests to arrive, settle in, and find their seats.",
  },
  {
    title: "Ceremony",
    phase: "ceremony",
    startTime: "13:00",
    notes: "The main event—perfect for vows, readings, and the confetti exit.",
  },
  {
    title: "Drinks reception",
    phase: "reception",
    startTime: "14:00",
    notes: "Welcome drinks, canapés, and family photos while everyone mingles.",
  },
  {
    title: "Wedding breakfast",
    phase: "reception",
    startTime: "16:00",
    notes: "Food service and table time with a little space for the room turn-around.",
  },
  {
    title: "Speeches",
    phase: "reception",
    startTime: "18:00",
    notes: "Keep speeches together so guests know when to gather back in the room.",
  },
  {
    title: "First dance",
    phase: "evening",
    startTime: "20:00",
    notes: "A lovely marker that transitions the day into the evening party.",
  },
  {
    title: "Disco",
    phase: "evening",
    startTime: "20:30",
    notes: "Open the dance floor and keep the evening energy going.",
  },
];

const phaseOrder = timelinePhases.reduce<Record<string, number>>((acc, phase, index) => {
  acc[phase.value] = index;
  return acc;
}, {});

export function normalizeTimelinePhase(value: string): TimelinePhase {
  return timelinePhases.some((phase) => phase.value === value)
    ? (value as TimelinePhase)
    : "ceremony";
}

export function compareTimelineItems(a: TimelineItem, b: TimelineItem) {
  const phaseDifference =
    (phaseOrder[a.phase] ?? Number.MAX_SAFE_INTEGER) -
    (phaseOrder[b.phase] ?? Number.MAX_SAFE_INTEGER);

  if (phaseDifference !== 0) return phaseDifference;

  const timeDifference = a.startTime.localeCompare(b.startTime);
  if (timeDifference !== 0) return timeDifference;

  return a.sortOrder - b.sortOrder || a.id - b.id;
}
