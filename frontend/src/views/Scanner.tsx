"import React, { useEffect, useRef, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing } from \"react-native\";
import { Ionicons } from \"@expo/vector-icons\";
import { Card } from \"../components/Card\";
import { colors, fonts, radius, spacing, severityColor } from \"../theme\";
import { api, Region, ScanResult, Detection } from \"../api\";

type Props = { onPickDetection?: (d: Detection) => void };

export function Scanner({ onPickDetection }: Props) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selected, setSelected] = useState<Region | null>(null);
  const [satellite, setSatellite] = useState(\"Sentinel-2\");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.regions().then((r) => {
      setRegions(r);
      setSelected(r[0]);
    });
  }, []);

  useEffect(() => {
    if (scanning) {
      sweep.setValue(0);
      Animated.loop(
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1600,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ).start();
    } else {
      sweep.stopAnimation();
    }
  }, [scanning, sweep]);

  const runScan = async () => {
    if (!selected) return;
    setScanning(true);
    setResult(null);
    try {
      // ensure min 1.5s visual
      const [res] = await Promise.all([
        api.scan(selected.id, satellite),
        new Promise((r) => setTimeout(r, 1400)),
      ]);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID=\"scanner-view\">
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Satellite Scanner</Text>
          <Text style={styles.title}>Run an orbital FDI + CNN sweep</Text>
          <Text style={styles.subtitle}>
            Pick an ocean region, select a satellite, and kick off a sub-pixel analysis pipeline.
          </Text>
        </View>
      </View>

      {/* Controls */}
      <Card testID=\"scanner-controls\">
        <Text style={styles.label}>Target Region</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
          {regions.map((r) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setSelected(r)}
              testID={`region-${r.id}`}
              style={[styles.chip, selected?.id === r.id && styles.chipActive]}
            >
              <Ionicons
                name=\"location-outline\"
                size={14}
                color={selected?.id === r.id ? \"#fff\" : colors.deepWater}
              />
              <Text style={[styles.chipText, selected?.id === r.id && styles.chipTextActive]}>
                {r.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { marginTop: spacing.md }]}>Satellite</Text>
        <View style={{ flexDirection: \"row\", gap: 10, flexWrap: \"wrap\" }}>
          {[\"Sentinel-2\", \"Landsat-9\", \"Sentinel-3\"].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSatellite(s)}
              testID={`sat-${s}`}
              style={[styles.satChip, satellite === s && styles.satChipActive]}
            >
              <Text style={[styles.satText, satellite === s && styles.satTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.runBtn, scanning && { opacity: 0.6 }]}
          onPress={runScan}
          disabled={scanning}
          testID=\"run-scan-btn\"
          activeOpacity={0.85}
        >
          {scanning ? (
            <ActivityIndicator color=\"#fff\" />
          ) : (
            <Ionicons name=\"scan-outline\" size={18} color=\"#fff\" />
          )}
          <Text style={styles.runBtnText}>
            {scanning ? \"Scanning orbit…\" : \"Run Satellite Scan\"}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Scanner visualization */}
      <Card testID=\"scanner-visual\" title=\"Sub-pixel Signal Monitor\" subtitle=\"Live FDI feed over target pixel grid\">
        <View style={styles.scope}>
          {/* Pixel grid */}
          <View style={styles.pixelGrid}>
            {Array.from({ length: 12 }).map((_, ri) => (
              <View key={ri} style={{ flexDirection: \"row\", flex: 1 }}>
                {Array.from({ length: 20 }).map((_, ci) => {
                  const active = (ri + ci) % 7 === 0;
                  return (
                    <View
                      key={ci}
                      style={[
                        styles.pixel,
                        active && { backgroundColor: \"rgba(144, 224, 239, 0.35)\" },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          {/* Sweep */}
          {scanning ? (
            <Animated.View
              style={[
                styles.sweepLine,
                {
                  left: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [\"-5%\", \"100%\"],
                  }),
                },
              ]}
            />
          ) : null}

          {/* Detection dots */}
          {result ? result.detections.map((d, i) => {
            if (!selected) return null;
            const b = selected.bounds;
            const x = ((d.lng - b.min_lng) / (b.max_lng - b.min_lng)) * 100;
            const y = ((b.max_lat - d.lat) / (b.max_lat - b.min_lat)) * 100;
            const sev = severityColor(d.severity);
            return (
              <TouchableOpacity
                key={d.id + i}
                testID={`scan-dot-${i}`}
                onPress={() => onPickDetection?.(d)}
                style={[
                  styles.scanDot,
                  {
                    left: `${Math.max(2, Math.min(98, x))}%`,
                    top: `${Math.max(4, Math.min(96, y))}%`,
                    backgroundColor: sev,
                    shadowColor: sev,
                  },
                ]}
              />
            );
          }) : null}

          {/* Corners */}
          <View style={[styles.corner, { top: 8, left: 8 }]} />
          <View style={[styles.corner, { top: 8, right: 8, transform: [{ rotate: \"90deg\" }] }]} />
          <View style={[styles.corner, { bottom: 8, left: 8, transform: [{ rotate: \"-90deg\" }] }]} />
          <View style={[styles.corner, { bottom: 8, right: 8, transform: [{ rotate: \"180deg\" }] }]} />

          <View style={styles.scopeFooter}>
            <Text style={styles.scopeFooterText}>
              {selected?.name || \"—\"} · {selected?.center_lat.toFixed(2)}°, {selected?.center_lng.toFixed(2)}°
            </Text>
            <Text style={styles.scopeFooterText}>
              {result ? `${result.pixels_analyzed.toLocaleString()} px analyzed` : \"Awaiting scan…\"}
            </Text>
          </View>
        </View>
      </Card>

      {/* Result summary */}
      {result ? (
        <View style={styles.resultRow}>
          <Card style={{ flex: 1, minWidth: 200 }} accent={colors.oceanBlue}>
            <Text style={styles.metricLabel}>Detections</Text>
            <Text style={styles.metricValue}>{result.detections.length}</Text>
            <Text style={styles.metricSub}>{result.hotspot_count} hotspots</Text>
          </Card>
          <Card style={{ flex: 1, minWidth: 200 }} accent={colors.ecoGreen}>
            <Text style={styles.metricLabel}>Avg FDI</Text>
            <Text style={styles.metricValue}>{result.avg_fdi.toFixed(2)}</Text>
            <Text style={styles.metricSub}>{(result.avg_fdi * 100).toFixed(0)}% plastic-like signal</Text>
          </Card>
          <Card style={{ flex: 1, minWidth: 200 }} accent={colors.coralAlert}>
            <Text style={styles.metricLabel}>Avg Confidence</Text>
            <Text style={styles.metricValue}>{Math.round(result.avg_confidence * 100)}%</Text>
            <Text style={styles.metricSub}>CNN consensus</Text>
          </Card>
          <Card style={{ flex: 1, minWidth: 200 }} accent={colors.deepWater}>
            <Text style={styles.metricLabel}>Coverage</Text>
            <Text style={styles.metricValue}>{result.coverage_km2.toLocaleString()} km²</Text>
            <Text style={styles.metricSub}>{result.satellite}</Text>
          </Card>
        </View>
      ) : null}

      {/* Results table */}
      {result ? (
        <Card title=\"Detection Log\" subtitle={`${result.detections.length} signals captured`} testID=\"scan-results\">
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 2 }]}>Coordinates</Text>
            <Text style={styles.th}>FDI</Text>
            <Text style={styles.th}>Confidence</Text>
            <Text style={styles.th}>Biofouling</Text>
            <Text style={styles.th}>Area</Text>
            <Text style={[styles.th, { width: 90 }]}>Severity</Text>
          </View>
          {result.detections.slice(0, 10).map((d, i) => (
            <TouchableOpacity
              key={d.id + i}
              style={styles.tr}
              onPress={() => onPickDetection?.(d)}
              testID={`row-${i}`}
            >
              <Text style={[styles.td, { flex: 2, fontFamily: fonts.mono }]}>
                {d.lat.toFixed(3)}°, {d.lng.toFixed(3)}°
              </Text>
              <Text style={styles.td}>{d.fdi.toFixed(2)}</Text>
              <Text style={styles.td}>{Math.round(d.confidence * 100)}%</Text>
              <Text style={styles.td}>{Math.round(d.biofouling * 100)}%</Text>
              <Text style={styles.td}>{Math.round(d.area_m2)} m²</Text>
              <View style={{ width: 90 }}>
                <View style={[styles.sevTag, { backgroundColor: severityColor(d.severity) + \"22\", borderColor: severityColor(d.severity) }]}>
                  <Text style={[styles.sevText, { color: severityColor(d.severity) }]}>
                    {d.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  header: { marginBottom: 4 },
  kicker: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.oceanBlue,
    letterSpacing: 2,
    fontWeight: \"800\",
    textTransform: \"uppercase\",
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
    fontWeight: \"800\",
    letterSpacing: -0.6,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 6,
    maxWidth: 620,
    lineHeight: 20,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: \"800\",
    letterSpacing: 1.6,
    textTransform: \"uppercase\",
    color: colors.textTertiary,
    marginBottom: 8,
  },
  chip: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.cyanSoft,
  },
  chipActive: {
    backgroundColor: colors.deepWater,
    borderColor: colors.deepWater,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: \"700\",
    color: colors.deepWater,
  },
  chipTextActive: { color: \"#fff\" },

  satChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  satChipActive: {
    backgroundColor: colors.oceanBlue,
    borderColor: colors.oceanBlue,
  },
  satText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: \"700\",
    color: colors.deepWater,
    letterSpacing: 0.6,
  },
  satTextActive: { color: \"#fff\" },

  runBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.deepWater,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"center\",
    gap: 10,
    alignSelf: \"flex-start\",
    shadowColor: colors.oceanBlue,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  runBtnText: {
    color: \"#fff\",
    fontFamily: fonts.heading,
    fontWeight: \"800\",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  scope: {
    width: \"100%\",
    aspectRatio: 2.1,
    borderRadius: radius.md,
    backgroundColor: \"#071C2F\",
    overflow: \"hidden\",
    position: \"relative\",
    borderWidth: 1,
    borderColor: \"rgba(144, 224, 239, 0.25)\",
  },
  pixelGrid: { flex: 1, padding: 2 },
  pixel: {
    flex: 1,
    margin: 1,
    borderRadius: 2,
    backgroundColor: \"rgba(144, 224, 239, 0.07)\",
  },
  sweepLine: {
    position: \"absolute\",
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.cyanGlow,
    shadowColor: colors.cyanGlow,
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  scanDot: {
    position: \"absolute\",
    width: 10,
    height: 10,
    borderRadius: 999,
    marginLeft: -5,
    marginTop: -5,
    borderWidth: 2,
    borderColor: \"rgba(255,255,255,0.95)\",
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  corner: {
    position: \"absolute\",
    width: 16,
    height: 16,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: colors.cyanGlow,
  },
  scopeFooter: {
    position: \"absolute\",
    bottom: 10,
    left: 14,
    right: 14,
    flexDirection: \"row\",
    justifyContent: \"space-between\",
  },
  scopeFooterText: {
    fontFamily: fonts.mono,
    color: colors.cyanGlow,
    fontSize: 11,
    letterSpacing: 1,
  },

  resultRow: {
    flexDirection: \"row\",
    flexWrap: \"wrap\",
    gap: spacing.md,
  },
  metricLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: \"uppercase\",
    color: colors.textTertiary,
    fontWeight: \"800\",
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: \"800\",
    color: colors.textPrimary,
  },
  metricSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },

  tableHead: {
    flexDirection: \"row\",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  th: {
    fontFamily: fonts.body,
    flex: 1,
    fontSize: 10,
    fontWeight: \"800\",
    color: colors.textTertiary,
    letterSpacing: 1.6,
    textTransform: \"uppercase\",
  },
  tr: {
    flexDirection: \"row\",
    paddingVertical: 10,
    alignItems: \"center\",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  td: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
  },
  sevTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: \"flex-start\",
  },
  sevText: { fontSize: 10, fontWeight: \"800\", letterSpacing: 1 },
});
"
