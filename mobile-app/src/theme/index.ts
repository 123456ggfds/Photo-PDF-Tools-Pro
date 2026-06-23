export const appTheme = {
  colors: {
    background: "#090B10",
    surface: "#11141C",
    surfaceAlt: "#171B24",
    elevated: "#1C2230",
    border: "rgba(255,255,255,0.10)",
    borderStrong: "rgba(255,255,255,0.18)",
    text: "#F5F7FF",
    textMuted: "rgba(245,247,255,0.70)",
    textSoft: "rgba(245,247,255,0.46)",
    primary: "#7C8CFF",
    primaryStrong: "#5D6BFF",
    accent: "#59D7FF",
    success: "#46D59A",
    warning: "#FFB85C",
    white: "#FFFFFF",
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 30,
    pill: 999,
  },
  typography: {
    hero: 30,
    title: 22,
    section: 18,
    body: 15,
    caption: 12,
    micro: 11,
  },
};

export type AppTheme = typeof appTheme;
