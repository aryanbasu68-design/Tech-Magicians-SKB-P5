"import React, { useEffect, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from \"react-native\";
import { Card } from \"../components/Card\";
import { Heatmap } from \"../components/Heatmap\";
import { colors, fonts, spacing, severityColor } from \"../theme\";
import { api, Detection } from \"../api\";

type Props = { onPickDetection?: (d: Detection) => void };

export function HeatmapView({ onPickDetection }: Props) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Detection | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const scans = await api.scans();
        const all: Detection[] = [];
        scans.forEach((s) =>
          s.detections.forEach((d) => all.push({ ...d, region_name: s.region_name })),
        );
        setDetections(all);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.oceanBlue} size=\"large\" />
      </View>
    );
  }

  const sevCount = (s: string) => detections.filter((d) => d.severity === s).length;

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID=\"heatmap-view\">
      <View>
        <Text style={styles.kicker}>Global Ocean Heatmap</Text>
        <Text style={styles.title}>Plastic concentration — planetary view</Text>
        <Text style={styles.subtitle}>
          Every point is a CNN-confirmed detection aggregated from all recent scans.
          Heat gradient reflects FDI × confidence density.
        </Text>
      </View>

      <Card testID=\"heatmap-card\">
        <Heatmap
          detections={detections}
          onPick={(d) => {
            setSelected(d);
            onPickDetection?.(d);
          }}
          testID=\"heatmap-grid\"
        />
      </Card>

      <View style={styles.row}>
        <Card style={{ flex: 1, minWidth: 220 }} accent={colors.coralAlert}>
          <Text style={styles.mLbl}>Critical</Text>
          <Text style={styles.mVal}>{sevCount(\"critical\")}</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }} accent={colors.amberWarning}>
          <Text style={styles.mLbl}>High</Text>
          <Text style={styles.mVal}>{sevCount(\"high\")}</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }} accent={colors.oceanBlue}>
          <Text style={styles.mLbl}>Moderate</Text>
          <Text style={styles.mVal}>{sevCount(\"moderate\")}</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }} accent={colors.ecoGreen}>
          <Text style={styles.mLbl}>Low</Text>
          <Text style={styles.mVal}>{sevCount(\"low\")}</Text>
        </Card>
      </View>

      {selected ? (
        <Card title=\"Selected Detection\" subtitle={selected.region_name} testID=\"selected-card\">
          <View style={styles.detailGrid}>
            <Detail label=\"Lat/Lng\" value={`${selected.lat.toFixed(3)}°, ${selected.lng.toFixed(3)}°`} />
            <Detail label=\"FDI\" value={selected.fdi.toFixed(3)} />
            <Detail label=\"Confidence\" value={`${Math.round(selected.confidence * 100)}%`} />
            <Detail label=\"Biofouling\" value={`${Math.round(selected.biofouling * 100)}%`} />
            <Detail label=\"Area\" value={`${Math.round(selected.area_m2)} m²`} />
            <Detail
              label=\"Severity\"
              value={selected.severity.toUpperCase()}
              color={severityColor(selected.severity)}
            />
          </View>
        </Card>
      ) : (
        <Card testID=\"tip-card\">
          <Text style={styles.tip}>
            Tap any dot on the map to inspect its FDI, confidence, and biofouling correction.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

function Detail({ label, value, color = colors.textPrimary }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, minWidth: 160 }}>
      <Text style={styles.dLabel}>{label}</Text>
      <Text style={[styles.dVal, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  loading: { flex: 1, alignItems: \"center\", justifyContent: \"center\", padding: 60 },
  kicker: {
    fontFamily: fonts.mono, fontSize: 11, color: colors.oceanBlue,
    letterSpacing: 2, fontWeight: \"800\", textTransform: \"uppercase\",
  },
  title: {
    fontFamily: fonts.heading, fontSize: 28, color: colors.textPrimary,
    fontWeight: \"800\", letterSpacing: -0.6, marginTop: 4,
  },
  subtitle: {
    fontFamily: fonts.body, fontSize: 14, color: colors.textTertiary,
    marginTop: 6, maxWidth: 620, lineHeight: 20,
  },
  row: { flexDirection: \"row\", flexWrap: \"wrap\", gap: spacing.md },
  mLbl: {
    fontFamily: fonts.body, fontSize: 11, letterSpacing: 1.6, textTransform: \"uppercase\",
    color: colors.textTertiary, fontWeight: \"800\", marginBottom: 8,
  },
  mVal: { fontFamily: fonts.heading, fontSize: 26, fontWeight: \"800\", color: colors.textPrimary },
  detailGrid: { flexDirection: \"row\", flexWrap: \"wrap\", gap: spacing.lg },
  dLabel: {
    fontFamily: fonts.body, fontSize: 10, letterSpacing: 1.6, textTransform: \"uppercase\",
    color: colors.textTertiary, fontWeight: \"800\", marginBottom: 6,
  },
  dVal: { fontFamily: fonts.mono, fontSize: 16, fontWeight: \"700\" },
  tip: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: \"center\", padding: 14 },
});
"
