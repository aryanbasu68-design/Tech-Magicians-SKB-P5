"import React from \"react\";
import { View, Text, StyleSheet, TouchableOpacity } from \"react-native\";
import { colors, fonts, spacing, radius, severityColor } from \"../theme\";
import type { Detection } from \"../api\";

type Props = {
  detections: Detection[];
  rows?: number;
  cols?: number;
  onPick?: (d: Detection) => void;
  testID?: string;
};

/** Simulates a simple equirectangular world grid and plots detections with heat intensity */
export function Heatmap({ detections, rows = 18, cols = 36, onPick, testID }: Props) {
  // Build grid by binning detections into rows x cols by lat/lng
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const gridMax = detections.reduce((max, d) => {
    // lat 90..-90 => row 0..rows-1 ; lng -180..180 => col 0..cols-1
    const r = Math.max(0, Math.min(rows - 1, Math.floor(((90 - d.lat) / 180) * rows)));
    const c = Math.max(0, Math.min(cols - 1, Math.floor(((d.lng + 180) / 360) * cols)));
    const score = d.fdi * d.confidence;
    grid[r][c] = (grid[r][c] || 0) + score;
    return Math.max(max, grid[r][c]);
  }, 0.01);

  const cellColor = (v: number) => {
    if (v <= 0) return \"transparent\";
    const t = Math.min(1, v / gridMax);
    if (t < 0.33) return `rgba(144, 224, 239, ${0.3 + t})`; // cyan
    if (t < 0.66) return `rgba(244, 162, 97, ${0.35 + t * 0.6})`; // amber
    return `rgba(231, 111, 81, ${0.45 + t * 0.55})`; // coral
  };

  return (
    <View testID={testID} style={styles.wrap}>
      <View style={styles.grid}>
        {grid.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((v, ci) => (
              <View
                key={ci}
                style={[
                  styles.cell,
                  { backgroundColor: cellColor(v) },
                ]}
              />
            ))}
          </View>
        ))}

        {/* overlay a continent sketch via simple mask (grid is ocean illusion) */}
        {/* Detection dots */}
        <View style={StyleSheet.absoluteFill} pointerEvents=\"box-none\">
          {detections.map((d, i) => {
            const x = ((d.lng + 180) / 360) * 100;
            const y = ((90 - d.lat) / 180) * 100;
            const sev = severityColor(d.severity);
            return (
              <TouchableOpacity
                key={d.id + i}
                testID={`heat-dot-${i}`}
                onPress={() => onPick?.(d)}
                style={[
                  styles.dot,
                  {
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: sev,
                    shadowColor: sev,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Intensity</Text>
        <View style={styles.gradient}>
          <View style={[styles.gradSeg, { backgroundColor: colors.cyanGlow }]} />
          <View style={[styles.gradSeg, { backgroundColor: colors.amberWarning }]} />
          <View style={[styles.gradSeg, { backgroundColor: colors.coralAlert }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendLabel}>Low</Text>
          <Text style={styles.legendLabel}>Moderate</Text>
          <Text style={styles.legendLabel}>Critical</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: \"100%\" },
  grid: {
    width: \"100%\",
    aspectRatio: 2,
    backgroundColor: \"#0B2B4A\",
    borderRadius: radius.md,
    overflow: \"hidden\",
    position: \"relative\",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  row: {
    flexDirection: \"row\",
    flex: 1,
  },
  cell: {
    flex: 1,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: \"rgba(255,255,255,0.04)\",
  },
  dot: {
    position: \"absolute\",
    width: 10,
    height: 10,
    borderRadius: 999,
    marginLeft: -5,
    marginTop: -5,
    borderWidth: 2,
    borderColor: \"rgba(255,255,255,0.9)\",
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  legend: {
    marginTop: spacing.md,
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
  },
  legendTitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: \"800\",
    color: colors.textTertiary,
    letterSpacing: 1.6,
    textTransform: \"uppercase\",
  },
  gradient: {
    flexDirection: \"row\",
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: \"hidden\",
  },
  gradSeg: { flex: 1 },
  legendLabels: {
    flexDirection: \"row\",
    gap: spacing.lg,
  },
  legendLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textTertiary,
  },
});
"
