"import React from \"react\";
import { View, Text, StyleSheet } from \"react-native\";
import { Ionicons } from \"@expo/vector-icons\";
import { Card } from \"./Card\";
import { colors, fonts, spacing } from \"../theme\";

type Props = {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
  testID?: string;
};

export function StatCard({ label, value, delta, positive = true, icon = \"pulse\", accent = colors.oceanBlue, testID }: Props) {
  return (
    <Card style={styles.card} accent={accent} testID={testID}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
          {delta ? (
            <View style={styles.deltaRow}>
              <Ionicons
                name={positive ? \"trending-up\" : \"trending-down\"}
                size={14}
                color={positive ? colors.ecoGreen : colors.coralAlert}
              />
              <Text style={[styles.delta, { color: positive ? colors.ecoGreen : colors.coralAlert }]}>
                {delta}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.iconBubble, { backgroundColor: accent + \"22\", borderColor: accent + \"55\" }]}>
          <Ionicons name={icon} size={22} color={accent} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 220,
    flex: 1,
  },
  row: {
    flexDirection: \"row\",
    justifyContent: \"space-between\",
    alignItems: \"center\",
  },
  left: { flex: 1 },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: \"700\",
    color: colors.textTertiary,
    letterSpacing: 1.8,
    textTransform: \"uppercase\",
    marginBottom: spacing.sm,
  },
  value: {
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: \"800\",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  deltaRow: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 4,
    marginTop: 6,
  },
  delta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: \"700\",
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: \"center\",
    justifyContent: \"center\",
    borderWidth: 1,
  },
});
"
