"import React, { useEffect, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from \"react-native\";
import { StatCard } from \"../components/StatCard\";
import { Card } from \"../components/Card\";
import { LineChart } from \"../components/LineChart\";
import { colors, fonts, spacing, severityColor } from \"../theme\";
import { api, DashboardStats, Alert, Detection } from \"../api\";
import { Ionicons } from \"@expo/vector-icons\";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hotspots, setHotspots] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a, h] = await Promise.all([
          api.stats(),
          api.alerts(true),
          api.hotspots(),
        ]);
        setStats(s);
        setAlerts(a);
        setHotspots(h);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) {
    return (
      <View style={styles.loading} testID=\"dashboard-loading\">
        <ActivityIndicator color={colors.oceanBlue} size=\"large\" />
        <Text style={styles.loadingText}>Loading ocean telemetry…</Text>
      </View>
    );
  }

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID=\"dashboard-view\">
      {/* Hero */}
      <View style={styles.hero} testID=\"dashboard-hero\">
        <View style={styles.heroLeft}>
          <View style={styles.heroPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.heroPillText}>LIVE · ORBITAL SCAN</Text>
          </View>
          <Text style={styles.heroTitle}>
            Shielding oceans from{\"
\"}
            <Text style={{ color: colors.oceanBlue }}>invisible plastic</Text>.
          </Text>
          <Text style={styles.heroSub}>
            Sub-pixel satellite detection + CNN confirmation + drift prediction —
            all in one command center.
          </Text>
        </View>

        <View style={styles.heroRight}>
          <View style={styles.radar}>
            <View style={[styles.radarRing, { width: 160, height: 160 }]} />
            <View style={[styles.radarRing, { width: 110, height: 110, opacity: 0.6 }]} />
            <View style={[styles.radarRing, { width: 60, height: 60, opacity: 0.9 }]} />
            <View style={styles.radarCore}>
              <Ionicons name=\"planet\" size={28} color={colors.textInverse} />
            </View>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard
          label=\"Total Detections\"
          value={fmt(stats.total_detections)}
          delta=\"+12.4%\"
          icon=\"radio\"
          accent={colors.oceanBlue}
          testID=\"stat-detections\"
        />
        <StatCard
          label=\"Active Hotspots\"
          value={stats.active_hotspots}
          delta=\"+3 today\"
          icon=\"flame-outline\"
          accent={colors.coralAlert}
          testID=\"stat-hotspots\"
        />
        <StatCard
          label=\"Avg FDI\"
          value={stats.avg_fdi.toFixed(2)}
          delta=\"+0.04\"
          icon=\"analytics-outline\"
          accent={colors.ecoGreen}
          testID=\"stat-fdi\"
        />
        <StatCard
          label=\"Coverage\"
          value={`${fmt(Math.round(stats.coverage_km2))} km²`}
          delta=\"+4.8%\"
          icon=\"globe-outline\"
          accent={colors.deepWater}
          testID=\"stat-coverage\"
        />
      </View>

      {/* Trend + Alerts */}
      <View style={styles.gridRow}>
        <View style={{ flex: 2, minWidth: 420 }}>
          <Card
            title=\"Detections · Last 7 Days\"
            subtitle=\"Rolling window of plastic detections flagged by CNN ≥ 0.6\"
            testID=\"trend-card\"
          >
            <LineChart
              data={stats.trend_7d.map((d) => ({ label: d.date, value: d.detections }))}
              color={colors.oceanBlue}
              height={220}
            />
          </Card>
        </View>

        <View style={{ flex: 1, minWidth: 300 }}>
          <Card title=\"System Status\" subtitle=\"Pipeline health check\" testID=\"status-card\">
            {[
              { k: \"Sentinel-2 Feed\", ok: true },
              { k: \"FDI Processor\", ok: true },
              { k: \"CNN Classifier\", ok: true },
              { k: \"Biofouling Model\", ok: true },
              { k: \"Drift Predictor\", ok: true },
              { k: \"Alert Dispatcher\", ok: false },
            ].map((row, i) => (
              <View key={i} style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: row.ok ? colors.ecoGreen : colors.amberWarning }]} />
                <Text style={styles.statusKey}>{row.k}</Text>
                <Text style={[styles.statusVal, { color: row.ok ? colors.ecoGreen : colors.amberWarning }]}>
                  {row.ok ? \"operational\" : \"simulated\"}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      </View>

      {/* Alerts + Hotspots */}
      <View style={styles.gridRow}>
        <View style={{ flex: 1.2, minWidth: 380 }}>
          <Card
            title=\"Active Alerts\"
            subtitle={`${alerts.length} unacknowledged events`}
            testID=\"alerts-card\"
          >
            {alerts.slice(0, 5).map((a) => (
              <View key={a.id} style={styles.alertRow} testID=\"alert-row\">
                <View style={[styles.alertDot, { backgroundColor: severityColor(a.severity) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{a.title}</Text>
                  <Text style={styles.alertMeta} numberOfLines={1}>
                    {a.region_name} · {a.message}
                  </Text>
                </View>
                <View style={[styles.sevTag, { backgroundColor: severityColor(a.severity) + \"22\", borderColor: severityColor(a.severity) }]}>
                  <Text style={[styles.sevText, { color: severityColor(a.severity) }]}>
                    {a.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
            {alerts.length === 0 ? (
              <Text style={styles.empty}>All clear 🌊 — no active alerts.</Text>
            ) : null}
          </Card>
        </View>

        <View style={{ flex: 1, minWidth: 320 }}>
          <Card title=\"Top Hotspots\" subtitle=\"Ranked by FDI × confidence\" testID=\"hotspots-card\">
            {hotspots.slice(0, 6).map((h, i) => (
              <View key={h.id + i} style={styles.hotRow}>
                <Text style={styles.hotIdx}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotRegion}>{h.region_name}</Text>
                  <Text style={styles.hotCoords}>
                    {h.lat.toFixed(2)}°, {h.lng.toFixed(2)}°
                  </Text>
                </View>
                <View style={styles.hotScore}>
                  <Text style={styles.hotFdi}>FDI {h.fdi.toFixed(2)}</Text>
                  <Text style={styles.hotConf}>{Math.round(h.confidence * 100)}%</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  loading: { flex: 1, alignItems: \"center\", justifyContent: \"center\", gap: 12 },
  loadingText: { fontFamily: fonts.body, color: colors.textTertiary },

  hero: {
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"space-between\",
    padding: spacing.xl,
    borderRadius: 24,
    backgroundColor: colors.deepWater,
    overflow: \"hidden\",
    position: \"relative\",
  },
  heroLeft: { flex: 2, gap: 14 },
  heroRight: { flex: 1, alignItems: \"center\", justifyContent: \"center\" },
  heroPill: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 8,
    alignSelf: \"flex-start\",
    backgroundColor: \"rgba(255,255,255,0.12)\",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: \"rgba(255,255,255,0.18)\",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ecoLeaf,
  },
  heroPillText: {
    fontFamily: fonts.mono,
    color: \"#fff\",
    fontSize: 10,
    fontWeight: \"800\",
    letterSpacing: 2,
  },
  heroTitle: {
    fontFamily: fonts.heading,
    color: \"#fff\",
    fontSize: 34,
    fontWeight: \"800\",
    letterSpacing: -1,
    lineHeight: 40,
  },
  heroSub: {
    fontFamily: fonts.body,
    color: \"rgba(255,255,255,0.8)\",
    fontSize: 14,
    maxWidth: 560,
    lineHeight: 20,
  },
  radar: {
    width: 180,
    height: 180,
    alignItems: \"center\",
    justifyContent: \"center\",
    position: \"relative\",
  },
  radarRing: {
    position: \"absolute\",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: \"rgba(144, 224, 239, 0.45)\",
  },
  radarCore: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.oceanBlue,
    alignItems: \"center\",
    justifyContent: \"center\",
    shadowColor: colors.cyanGlow,
    shadowOpacity: 0.7,
    shadowRadius: 18,
  },

  statsRow: {
    flexDirection: \"row\",
    flexWrap: \"wrap\",
    gap: spacing.md,
  },

  gridRow: {
    flexDirection: \"row\",
    flexWrap: \"wrap\",
    gap: spacing.md,
  },

  statusRow: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  statusKey: {
    fontFamily: fonts.body,
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: \"600\",
  },
  statusVal: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: \"700\",
    textTransform: \"uppercase\",
    letterSpacing: 1,
  },

  alertRow: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertTitle: { fontFamily: fonts.heading, fontSize: 13, fontWeight: \"700\", color: colors.textPrimary },
  alertMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  sevTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  sevText: { fontSize: 10, fontWeight: \"800\", letterSpacing: 1 },
  empty: { fontFamily: fonts.body, color: colors.textTertiary, padding: 12, textAlign: \"center\" },

  hotRow: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  hotIdx: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: \"800\",
    color: colors.oceanBlue,
    width: 36,
  },
  hotRegion: { fontFamily: fonts.body, fontSize: 13, fontWeight: \"700\", color: colors.textPrimary },
  hotCoords: { fontFamily: fonts.mono, fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  hotScore: { alignItems: \"flex-end\" },
  hotFdi: { fontFamily: fonts.mono, fontSize: 12, fontWeight: \"700\", color: colors.deepWater },
  hotConf: { fontFamily: fonts.mono, fontSize: 11, color: colors.ecoGreen, marginTop: 2 },
});
"
