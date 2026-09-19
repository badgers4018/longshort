export const NAVY = "#1C1C1C";
export const GOLD = "#C9A227";
export const OX = "#A83232";
export const CREAM = "#F3F3F1";
export const LINE = "#E6E6E4";
export const MUTED = "#6A6A6A";
export const PAPER = "#FAFAFA";
export const WIN = "#2F4A3C";

export const CHART_TICK = {
  fill: MUTED,
  fontSize: 13,
  fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
} as const;

export const CHART_LEGEND = {
  iconSize: 8,
  wrapperStyle: {
    background: "transparent",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    fontSize: 11,
    fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
    color: MUTED,
    paddingTop: 4,
  },
} as const;

/** @deprecated use OX */
export const OXBLOOD = OX;
export const CREAM_DARK = LINE;
