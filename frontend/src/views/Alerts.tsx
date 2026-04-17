"import React, { useEffect, useState, useCallback } from \"react\";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from \"react-native\";
import { Ionicons } from \"@expo/vector-icons\";
import { Card } from \"../components/Card\";
import { colors, fonts, spacing, severityColor } from \"../theme\";
import { api, Alert } from \"../api\";

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<\"all\" | \"active\">(\"active\");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await api.alerts(filter === \"active\");
    setAlerts(list);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const ack = async (id: string) => {
    await api.acknowledgeAlert(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  };

  const bySev = (s: string) => alerts.filter((a) => a.severity === s).length;

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID=\"alerts-view\">
      <View>
        <Text style={styles.kicker}>Alert Center</Text>
        <Text style={styles.title}>Real-time pollution events</Text>
        <Text style={styles.subtitle}>
          Alerts are auto-generated when CNN confirms critical/high severity FDI signals. Acknowledge to archive.
        </Text>
      </View>

      <View style={styles.tabs}>
        {([\"active\", \"all\"] as const).map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setFilter(k)}
            style={[styles.tab, filter === k && styles.tabActive]}
            testID={`tab-${k}`}
          >
            <Text style={[styles.tabText, filter === k && styles.tabTextActive]}>
              {k === \"active\" ? \"Active\" : \"All history\"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        <Card style={{ flex: 1, minWidth: 200 }} accent={colors.coralAlert}>
          <Text style={styles.mLbl}>Critical</Text>
          <Text style={styles.mVal}>{bySev(\"critical\")}</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 200 }} accent={colors.amberWarning}>
          <Text style={styles.mLbl}>High</Text>
          <Text style={styles.mVal}>{bySev(\"high\")}</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 200 }} accent={colors.oceanBlue}>
          <Text style={styles.mLbl}>Moderate</Text>
          <Text style={styles.mVal}>{bySev(\"moderate\")}</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 200 }} accent={colors.ecoGreen}>
          <Text style={styles.mLbl}>Total</Text>
          <Text style={styles.mVal}>{alerts.length}</Text>
        </Card>
      </View>

      <Card>
        {loading ? (
          <ActivityIndicator color={colors.oceanBlue} />
        ) : alerts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name=\"checkmark-circle\" size={36} color={colors.ecoGreen} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptyText}>No {filter === \"active\" ? \"active\" : \"\"} alerts right now.</Text>
          </View>
        ) : (
          alerts.map((a) => (
            <View key={a.id} style={styles.card} testID={`alert-${a.id}`}>
              <View style={[styles.sevBar, { backgroundColor: severityColor(a.severity) }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <View style={[styles.sevTag, { backgroundColor: severityColor(a.severity) + \"22\", borderColor: severityColor(a.severity) }]}>
                    <Text style={[styles.sevText, { color: severityColor(a.severity) }]}>{a.severity.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.cardMsg}>{a.message}</Text>
                <View style={styles.cardFoot}>
                  <View style={styles.footItem}>
                    <Ionicons name=\"location-outline\" size={13} color={colors.textTertiary} />
                    <Text style={styles.footText}>{a.region_name}</Text>
                  </View>
                  <View style={styles.footItem}>
                    <Ionicons name=\"compass-outline\" size={13} color={colors.textTertiary} />
                    <Text style={styles.footText}>{a.lat.toFixed(2)}°, {a.lng.toFixed(2)}°</Text>
                  </View>
                  <View style={styles.footItem}>
                    <Ionicons name=\"time-outline\" size={13} color={colors.textTertiary} />
                    <Text style={styles.footText}>{new Date(a.created_at).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
              {!a.acknowledged ? (
                <TouchableOpacity
                  onPress={() => ack(a.id)}
                  style={styles.ackBtn}
                  testID={`ack-${a.id}`}
                >
                  <Ionicons name=\"checkmark\" size={15} color=\"#fff\" />
                  <Text style={styles.ackText}>Acknowledge</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.ackDone}>
                  <Ionicons name=\"checkmark-done\" size={14} color={colors.ecoGreen} />
                  <Text style={styles.ackDoneText}>Cleared</Text>
                </View>
              )}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  kicker: { fontFamily: fonts.mono, fontSize: 11, color: colors.oceanBlue, letterSpacing: 2, fontWeight: \"800\", textTransform: \"uppercase\" },
  title: { fontFamily: fonts.heading, fontSize: 28, color: colors.textPrimary, fontWeight: \"800\", letterSpacing: -0.6, marginTop: 4 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.textTertiary, marginTop: 6, maxWidth: 620, lineHeight: 20 },
  tabs: { flexDirection: \"row\", gap: 8, alignSelf: \"flex-start\" },
  tab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.bgSecondary },
  tabActive: { backgroundColor: colors.deepWater, borderColor: colors.deepWater },
  tabText: { fontFamily: fonts.body, fontWeight: \"700\", fontSize: 13, color: colors.deepWater },
  tabTextActive: { color: \"#fff\" },
  statsRow: { flexDirection: \"row\", flexWrap: \"wrap\", gap: spacing.md },
  mLbl: { fontFamily: fonts.body, fontSize: 11, letterSpacing: 1.6, textTransform: \"uppercase\", color: colors.textTertiary, fontWeight: \"800\", marginBottom: 8 },
  mVal: { fontFamily: fonts.heading, fontSize: 26, fontWeight: \"800\", color: colors.textPrimary },
  card: {
    flexDirection: \"row\", gap: spacing.md, alignItems: \"center\",
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  sevBar: { width: 4, height: 56, borderRadius: 4 },
  cardHead: { flexDirection: \"row\", alignItems: \"center\", gap: 10 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 14, fontWeight: \"800\", color: colors.textPrimary, flex: 1 },
  cardMsg: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  cardFoot: { flexDirection: \"row\", gap: spacing.lg, marginTop: 8, flexWrap: \"wrap\" },
  footItem: { flexDirection: \"row\", alignItems: \"center\", gap: 4 },
  footText: { fontFamily: fonts.mono, fontSize: 11, color: colors.textTertiary },
  sevTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  sevText: { fontSize: 10, fontWeight: \"800\", letterSpacing: 1 },
  ackBtn: {
    flexDirection: \"row\", alignItems: \"center\", gap: 6,
    backgroundColor: colors.ecoGreen, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  ackText: { color: \"#fff\", fontFamily: fonts.body, fontWeight: \"800\", fontSize: 12 },
  ackDone: { flexDirection: \"row\", alignItems: \"center\", gap: 4 },
  ackDoneText: { color: colors.ecoGreen, fontFamily: fonts.mono, fontSize: 11, fontWeight: \"700\" },
  empty: { alignItems: \"center\", padding: 24, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 17, fontWeight: \"800\", color: colors.textPrimary },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textTertiary },
});
"
