"import React from \"react\";
import { View, Text, StyleSheet } from \"react-native\";
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from \"react-native-svg\";
import { colors, fonts } from \"../theme\";

type Props = {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  showAxis?: boolean;
};

export function LineChart({ data, color = colors.oceanBlue, height = 200, showAxis = true }: Props) {
  const [width, setWidth] = React.useState(600);
  const padX = 40;
  const padTop = 20;
  const padBottom = showAxis ? 34 : 20;
  const innerW = Math.max(50, width - padX * 2);
  const innerH = Math.max(50, height - padTop - padBottom);
  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);

  const pts = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * innerW;
    const y = padTop + innerH - ((d.value - min) / range) * innerH;
    return { x, y, v: d.value, l: d.label };
  });

  // smooth path using simple catmull-rom to bezier
  const pathD = pts.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + p.x) / 2;
    return acc + ` Q ${cx} ${prev.y} ${cx} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
  }, \"\");

  const areaD = pathD
    ? `${pathD} L ${pts[pts.length - 1].x} ${padTop + innerH} L ${pts[0].x} ${padTop + innerH} Z`
    : \"\";

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ width: \"100%\", height }}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id=\"g1\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">
            <Stop offset=\"0\" stopColor={color} stopOpacity=\"0.35\" />
            <Stop offset=\"1\" stopColor={color} stopOpacity=\"0\" />
          </LinearGradient>
        </Defs>

        {/* grid */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <Line
            key={i}
            x1={padX}
            x2={padX + innerW}
            y1={padTop + innerH * f}
            y2={padTop + innerH * f}
            stroke={colors.borderSubtle}
            strokeDasharray=\"4 6\"
          />
        ))}

        {/* area */}
        {areaD ? <Path d={areaD} fill=\"url(#g1)\" /> : null}
        {/* line */}
        {pathD ? (
          <Path d={pathD} stroke={color} strokeWidth={2.5} fill=\"none\" strokeLinecap=\"round\" />
        ) : null}
        {/* dots */}
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.bgSecondary} stroke={color} strokeWidth={2} />
        ))}
      </Svg>

      {showAxis ? (
        <View style={styles.axis}>
          {data.map((d, i) => (
            <Text key={i} style={styles.axisLabel}>
              {d.label.slice(5)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  axis: {
    flexDirection: \"row\",
    justifyContent: \"space-between\",
    paddingHorizontal: 40,
    marginTop: -14,
  },
  axisLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textTertiary,
  },
});
"
