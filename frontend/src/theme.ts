"export const colors = {
  bg: \"#F4F7F6\",
  bgSecondary: \"#FFFFFF\",
  glass: \"rgba(255, 255, 255, 0.72)\",
  oceanBlue: \"#00B4D8\",
  deepWater: \"#0077B6\",
  deepNavy: \"#03045E\",
  ecoGreen: \"#2A9D8F\",
  ecoLeaf: \"#52B788\",
  coralAlert: \"#E76F51\",
  amberWarning: \"#F4A261\",
  cyanGlow: \"#90E0EF\",
  cyanSoft: \"#CAF0F8\",
  textPrimary: \"#1A2530\",
  textSecondary: \"#4A5568\",
  textTertiary: \"#718096\",
  textInverse: \"#FFFFFF\",
  borderSubtle: \"rgba(0, 180, 216, 0.15)\",
  borderStrong: \"rgba(0, 119, 182, 0.28)\",
  shadow: \"rgba(15, 36, 56, 0.08)\",
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
};

export const fonts = {
  heading: 'system-ui, -apple-system, \"Segoe UI\", \"Outfit\", \"Inter\", sans-serif',
  body: 'system-ui, -apple-system, \"Segoe UI\", \"Nunito\", \"Inter\", sans-serif',
  mono: '\"JetBrains Mono\", \"Fira Code\", ui-monospace, monospace',
};

export const severityColor = (s: string) => {
  switch (s) {
    case \"critical\":
      return colors.coralAlert;
    case \"high\":
      return colors.amberWarning;
    case \"moderate\":
      return colors.oceanBlue;
    default:
      return colors.ecoGreen;
  }
};
"
