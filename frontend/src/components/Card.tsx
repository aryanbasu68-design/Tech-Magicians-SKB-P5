"import React from \"react\";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from \"react-native\";
import { colors, radius, spacing, fonts } from \"../theme\";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  testID?: string;
  title?: string;
  subtitle?: string;
  accent?: string;
};

export function Card({ children, style, padding = spacing.lg, testID, title, subtitle, accent }: Props) {
  return (
    <View testID={testID} style={[styles.card, { padding }, style]}>
      {accent ? (
        <View style={[styles.accent, { backgroundColor: accent }]} />
      ) : null}
      {(title || subtitle) ? (
        <View style={{ marginBottom: spacing.md }}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    // cross-platform shadow
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: \"hidden\",
    position: \"relative\",
  },
  accent: {
    position: \"absolute\",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: \"700\",
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
  },
});
"
