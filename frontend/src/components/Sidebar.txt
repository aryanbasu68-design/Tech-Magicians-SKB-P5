"import React from \"react\";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from \"react-native\";
import { Ionicons } from \"@expo/vector-icons\";
import { colors, fonts, spacing, radius } from \"../theme\";

export type ViewKey =
  | \"dashboard\"
  | \"scanner\"
  | \"heatmap\"
  | \"trajectory\"
  | \"alerts\"
  | \"analytics\"
  | \"methodology\";

const ITEMS: {
  key: ViewKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: \"dashboard\", label: \"Command Center\", icon: \"grid-outline\" },
  { key: \"scanner\", label: \"Satellite Scanner\", icon: \"scan-outline\" },
  { key: \"heatmap\", label: \"Ocean Heatmap\", icon: \"map-outline\" },
  { key: \"trajectory\", label: \"Drift Predictor\", icon: \"navigate-outline\" },
  { key: \"alerts\", label: \"Alert Center\", icon: \"notifications-outline\" },
  { key: \"analytics\", label: \"Analytics\", icon: \"stats-chart-outline\" },
  { key: \"methodology\", label: \"Methodology\", icon: \"book-outline\" },
];

type Props = {
  current: ViewKey;
  onChange: (k: ViewKey) => void;
  activeAlerts: number;
};

export function Sidebar({ current, onChange, activeAlerts }: Props) {
  return (
    <View style={styles.wrap} testID=\"sidebar-nav\">
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons name=\"planet\" size={22} color={colors.textInverse} />
        </View>
        <View>
          <Text style={styles.brandName}>GeoPlastic</Text>
          <Text style={styles.brandTag}>SHIELD</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <Text style={styles.section}>Navigation</Text>
        {ITEMS.map((item) => {
          const active = current === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              testID={`nav-${item.key}`}
              onPress={() => onChange(item.key)}
              style={[styles.item, active && styles.itemActive]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={active ? colors.textInverse : colors.textSecondary}
              />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                {item.label}
              </Text>
              {item.key === \"alerts\" && activeAlerts > 0 ? (
                <View style={[styles.badge, active && { backgroundColor: \"rgba(255,255,255,0.22)\" }]}>
                  <Text style={[styles.badgeText, active && { color: colors.textInverse }]}>
                    {activeAlerts}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footerCard}>
        <Text style={styles.footerTitle}>Prototype Mode</Text>
        <Text style={styles.footerText}>
          All satellite data is simulated for research/demo purposes.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 260,
    backgroundColor: colors.bgSecondary,
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  brand: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.deepWater,
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  brandName: {
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: \"800\",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandTag: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: \"800\",
    color: colors.oceanBlue,
    letterSpacing: 4,
  },
  section: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: \"800\",
    color: colors.textTertiary,
    letterSpacing: 2,
    textTransform: \"uppercase\",
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  itemActive: {
    backgroundColor: colors.deepWater,
  },
  itemLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: \"600\",
    flex: 1,
  },
  itemLabelActive: {
    color: colors.textInverse,
    fontWeight: \"700\",
  },
  badge: {
    backgroundColor: colors.coralAlert,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: \"center\",
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: \"800\",
  },
  footerCard: {
    backgroundColor: colors.cyanSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  footerTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: \"800\",
    color: colors.deepWater,
    marginBottom: 4,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});
"
