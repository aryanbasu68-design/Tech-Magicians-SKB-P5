"import React, { useEffect, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from \"react-native\";
import { Card } from \"../components/Card\";
import { LineChart } from \"../components/LineChart\";
import { colors, fonts, spacing, severityColor } from \"../theme\";
import { api, ScanResult } from \"../api\";

export function Analytics() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.scans().then((s) => {
      setScans(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.oceanBlue} /></View>;
  }

  const allDetections = scans.flatMap((s) => s.detections);
  const bySev = {
    critical: allDetections.filter((d) => d.severity === \"critical\").length,
    high: allDetections.filter((d) => d.severity === \"high\").length,
    moderate: allDetections.filter((d) => d.severity === \"moderate\").length,
    low: allDetections.filter((d) => d.severity === \"low\").length,
  };
  const maxSev = Math.max(1, ...Object.values(bySev));

  const fdiBuckets = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4...
  allDetections.forEach((d) => {
    const i = Math.min(4, Math.floor(d.fdi * 5));
    fdiBuckets[i]++;
  });
  const fdiMax = Math.max(1, ...fdiBuckets);

  const regionCount: Record<string, number> = {};
  scans.forEach((s) => {
    regionCount[s.region_name] = (regionCount[s.region_name] || 0) + s.detections.length;
  });
  const regionRows = Object.entries(regionCount).sort((a, b) => b[1] - a[1]);
  const regionMax = Math.max(1, ...regionRows.map((r) => r[1]));

  const avgBiofouling = allDetections.length
    ? allDetections.reduce((a, d) => a + d.biofouling, 0) / allDetections.length
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID=\"analytics-view\">
      <View>
        <Text style={styles.kicker}>Analytics</Text>
        <Text style={styles.title}>Signal intelligence across scans</Text>
        <Text style={styles.subtitle}>
          Aggregate view of all detections: severity mix, FDI distribution, regional concentration, biofouling impact.
        </Text>
      </View>

      <View style={styles.row}>
        <Card title=\"Severity Mix\" subtitle=\"Distribution of detected plastic severity\" style={{ flex: 1.3, minWidth: 380 }}>
          {([\"critical\", \"high\", \"moderate\", \"low\"] as const).map((s) => (
            <View key={s} style={styles.barRow}>
              <Text style={styles.barLabel}>{s.toUpperCase()}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(bySev[s] / maxSev) * 100}%`,
                      backgroundColor: severityColor(s),
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{bySev[s]}</Text>
            </View>
          ))}
        </Card>

        <Card title=\"FDI Distribution\" subtitle=\"How plastic-like are our detections?\" style={{ flex: 1, minWidth: 320 }}>
          <View style={styles.fdiWrap}>
            {fdiBuckets.map((v, i) => (
              <View key={i} style={styles.fdiCol}>
                <View style={[styles.fdiBar, {
                  height: `${(v / fdiMax) * 100}%`,
                  backgroundColor: i >= 3 ? colors.coralAlert : i === 2 ? colors.amberWarning : colors.oceanBlue,
                }]} />
                <Text style={styles.fdiLbl}>{(i * 0.2).toFixed(1)}-{((i + 1) * 0.2).toFixed(1)}</Text>
                <Text style={styles.fdiVal}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <Card title=\"Regional Concentration\" subtitle=\"Total detections per ocean region\">
        {regionRows.map(([name, count]) => (
          <View key={name} style={styles.regionRow}>
            <Text style={styles.regionName}>{name}</Text>
            <View style={styles.regionTrack}>
              <View style={[styles.regionFill, { width: `${(count / regionMax) * 100}%` }]} />
            </View>
            <Text style={styles.regionCount}>{count}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.row}>
        <Card title=\"Biofouling Impact\" subtitle=\"Average correction applied across CNN pipeline\" style={{ flex: 1, minWidth: 320 }}>
          <View style={styles.gauge}>
            <View style={styles.gaugeTrack}>
              <View style={[styles.gaugeFill, { width: `${avgBiofouling * 100}%` }]} />
            </View>
            <Text style={styles.gaugeValue}>{Math.round(avgBiofouling * 100)}%</Text>
          </View>
          <Text style={styles.note}>
            When biofouling &gt; 40%, spectral signatures degrade. System auto-adjusts thresholds to prevent
            false negatives on aged plastic.
          </Text>
        </Card>

        <Card title=\"Confidence Timeline\" subtitle=\"Avg CNN confidence across recent scans\" style={{ flex: 1.3, minWidth: 380 }}>
          <LineChart
            data={scans.slice(0, 10).reverse().map((s, i) => ({
              label: `2024-${String(i + 1).padStart(2, \"0\")}-01`,
              value: Math.round(s.avg_confidence * 100),
            }))}
            color={colors.ecoGreen}
            height={180}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  loading: { flex: 1, alignItems: \"center\", justifyContent: \"center\", padding: 60 },
  kicker: { fontFamily: fonts.mono, fontSize: 11, color: colors.oceanBlue, letterSpacing: 2, fontWeight: \"800\", textTransform: \"uppercase\" },
  title: { fontFamily: fonts.heading, fontSize: 28, color: colors.textPrimary, fontWeight: \"800\", letterSpacing: -0.6, marginTop: 4 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.textTertiary, marginTop: 6, maxWidth: 620, lineHeight: 20 },
  row: { flexDirection: \"row\", flexWrap: \"wrap\", gap: spacing.md },

  barRow: { flexDirection: \"row\", alignItems: \"center\", gap: 12, marginVertical: 8 },
  barLabel: { fontFamily: fonts.mono, fontSize: 11, fontWeight: \"800\", color: colors.textTertiary, width: 90, letterSpacing: 1 },
  barTrack: { flex: 1, height: 14, borderRadius: 999, backgroundColor: colors.cyanSoft },
  barFill: { height: \"100%\", borderRadius: 999 },
  barValue: { fontFamily: fonts.mono, fontSize: 12, fontWeight: \"700\", color: colors.textPrimary, width: 40, textAlign: \"right\" },

  fdiWrap: { flexDirection: \"row\", alignItems: \"flex-end\", gap: 10, height: 180, paddingTop: 12 },
  fdiCol: { flex: 1, alignItems: \"center\", justifyContent: \"flex-end\", height: \"100%\" },
  fdiBar: { width: \"80%\", borderRadius: 6, minHeight: 2 },
  fdiLbl: { fontFamily: fonts.mono, fontSize: 9, color: colors.textTertiary, marginTop: 6 },
  fdiVal: { fontFamily: fonts.mono, fontSize: 11, fontWeight: \"700\", color: colors.textPrimary, marginTop: 2 },

  regionRow: { flexDirection: \"row\", alignItems: \"center\", gap: 12, marginVertical: 7 },
  regionName: { fontFamily: fonts.body, fontSize: 13, fontWeight: \"700\", color: colors.textPrimary, width: 220 },
  regionTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.cyanSoft },
  regionFill: { height: \"100%\", borderRadius: 999, backgroundColor: colors.oceanBlue },
  regionCount: { fontFamily: fonts.mono, fontSize: 12, fontWeight: \"700\", color: colors.textPrimary, width: 40, textAlign: \"right\" },

  gauge: { marginVertical: 12 },
  gaugeTrack: { height: 20, borderRadius: 999, backgroundColor: colors.cyanSoft, overflow: \"hidden\" },
  gaugeFill: { height: \"100%\", backgroundColor: colors.amberWarning, borderRadius: 999 },
  gaugeValue: { fontFamily: fonts.heading, fontSize: 24, fontWeight: \"800\", color: colors.textPrimary, marginTop: 10 },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary, marginTop: 6, lineHeight: 18 },
});
"
