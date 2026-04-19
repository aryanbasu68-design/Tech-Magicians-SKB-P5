"import React from \"react\";
import { View, Text, StyleSheet, ScrollView } from \"react-native\";
import { Ionicons } from \"@expo/vector-icons\";
import { Card } from \"../components/Card\";
import { colors, fonts, spacing } from \"../theme\";

const STEPS = [
  {
    icon: \"radio-outline\" as const,
    title: \"1. Satellite Capture\",
    body: \"Multi-spectral imagery from Sentinel-2 and Landsat-9 provides near-infrared (NIR), red, and SWIR bands — the light signatures needed to separate plastic from water.\",
    color: \"#0077B6\",
  },
  {
    icon: \"analytics-outline\" as const,
    title: \"2. FDI Calculation\",
    body: \"The Floating Debris Index isolates plastic-like reflectance: FDI = R_NIR − (R_RED + (R_SWIR − R_RED) · α). Elevates sub-pixel plastic above the seawater baseline.\",
    color: \"#00B4D8\",
  },
  {
    icon: \"git-network-outline\" as const,
    title: \"3. CNN Confirmation\",
    body: \"A convolutional network (upgradeable to a Vision Transformer) reviews FDI-flagged pixels and rejects look-alikes such as algae, foam, and sun-glint.\",
    color: \"#2A9D8F\",
  },
  {
    icon: \"leaf-outline\" as const,
    title: \"4. Biofouling Correction\",
    body: \"Plastic in water accumulates biofilm over time, shifting its spectral signature. A time-aware correction module prevents false negatives on aged debris.\",
    color: \"#52B788\",
  },
  {
    icon: \"navigate-outline\" as const,
    title: \"5. Drift Prediction\",
    body: \"Ocean current speed + wind bearing feed a kinematic simulator to project detections 72 hours ahead — enabling proactive cleanup dispatch.\",
    color: \"#F4A261\",
  },
  {
    icon: \"notifications-outline\" as const,
    title: \"6. Alert Generation\",
    body: \"Detections that cross severity thresholds trigger alerts routed into this command center for review and acknowledgement.\",
    color: \"#E76F51\",
  },
];

const FACTS = [
  { k: \"Sub-pixel sensitivity\", v: \"Detects plastic smaller than a single 10 m × 10 m pixel.\" },
  { k: \"Spectral bands used\", v: \"Red · NIR · SWIR (Sentinel-2 B4 / B8 / B11).\" },
  { k: \"Prediction horizon\", v: \"Up to 72 hours of ocean drift.\" },
  { k: \"Simulated pipeline\", v: \"No real satellite feed yet — demo / research prototype.\" },
];

export function Methodology() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID=\"methodology-view\">
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name=\"book-outline\" size={14} color={colors.textInverse} />
          <Text style={styles.heroBadgeText}>HOW IT WORKS</Text>
        </View>
        <Text style={styles.heroTitle}>
          Detecting plastic you <Text style={{ color: colors.oceanBlue }}>can't see</Text>.
        </Text>
        <Text style={styles.heroSub}>
          GeoPlastic Shield combines physics (spectral indices), AI (CNN/Transformer) and oceanography
          (drift modeling) into a single pipeline that runs automatically from space to dashboard.
        </Text>
      </View>

      <View style={styles.grid}>
        {STEPS.map((s, i) => (
          <Card key={i} style={styles.step} accent={s.color}>
            <View style={[styles.iconBubble, { backgroundColor: s.color + \"22\", borderColor: s.color + \"55\" }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={styles.stepTitle}>{s.title}</Text>
            <Text style={styles.stepBody}>{s.body}</Text>
          </Card>
        ))}
      </View>

      <Card title=\"Formula · Floating Debris Index\" testID=\"formula\">
        <View style={styles.formulaBox}>
          <Text style={styles.formula}>FDI = R_NIR − (R_RED + (R_SWIR − R_RED) · α)</Text>
        </View>
        <Text style={styles.note}>
          <Text style={{ fontWeight: \"700\" }}>Meaning: </Text>
          compare how pixels reflect red, near-infrared, and short-wave infrared light. Floating plastics reflect
          differently than water, algae or foam, producing a spike that the index isolates.
        </Text>
      </Card>

      <Card title=\"Key Facts\">
        {FACTS.map((f, i) => (
          <View key={i} style={styles.factRow}>
            <Ionicons name=\"ellipse\" size={8} color={colors.oceanBlue} />
            <Text style={styles.factK}>{f.k}</Text>
            <Text style={styles.factV}>{f.v}</Text>
          </View>
        ))}
      </Card>

      <Card title=\"Why this matters\" accent={colors.ecoGreen}>
        <Text style={styles.wm}>
          8 million tonnes of plastic enter our oceans every year. Most of it becomes invisible to the naked eye
          within months — broken into micro fragments, drifting across currents. GeoPlastic Shield makes the
          invisible visible, and the reactive proactive.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
  hero: {
    padding: spacing.xl,
    borderRadius: 24,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  heroBadge: {
    flexDirection: \"row\", alignItems: \"center\", gap: 6,
    alignSelf: \"flex-start\",
    backgroundColor: colors.deepWater,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  heroBadgeText: { color: \"#fff\", fontFamily: fonts.mono, fontSize: 10, fontWeight: \"800\", letterSpacing: 2 },
  heroTitle: {
    fontFamily: fonts.heading, fontSize: 36, fontWeight: \"800\",
    color: colors.textPrimary, letterSpacing: -0.8, lineHeight: 42,
  },
  heroSub: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22, maxWidth: 760 },

  grid: { flexDirection: \"row\", flexWrap: \"wrap\", gap: spacing.md },
  step: { flex: 1, minWidth: 280, gap: 10 },
  iconBubble: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: \"center\", justifyContent: \"center\", borderWidth: 1,
  },
  stepTitle: { fontFamily: fonts.heading, fontSize: 16, fontWeight: \"800\", color: colors.textPrimary },
  stepBody: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  formulaBox: {
    padding: spacing.lg, borderRadius: 16,
    backgroundColor: \"#071C2F\", alignItems: \"center\",
  },
  formula: { fontFamily: fonts.mono, fontSize: 17, color: colors.cyanGlow, letterSpacing: 0.5 },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 12, lineHeight: 20 },

  factRow: { flexDirection: \"row\", alignItems: \"center\", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  factK: { fontFamily: fonts.body, fontWeight: \"800\", color: colors.textPrimary, fontSize: 13, width: 170 },
  factV: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 13, flex: 1 },

  wm: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
"
