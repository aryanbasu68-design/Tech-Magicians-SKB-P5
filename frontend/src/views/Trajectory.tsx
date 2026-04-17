"import React, { useEffect, useRef, useState } from \"react\";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from \"react-native\";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from \"react-native-svg\";
import { Ionicons } from \"@expo/vector-icons\";
import { Card } from \"../components/Card\";
import { colors, fonts, spacing, radius } from \"../theme\";
import { api, Detection, TrajectoryResult } from \"../api\";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { detection?: Detection | null };

export function Trajectory({ detection }: Props) {
  const [hotspots, setHotspots] = useState<Detection[]>([]);
  const [pick, setPick] = useState<Detection | null>(detection || null);
  const [traj, setTraj] = useState<TrajectoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.hotspots().then((h) => {
      setHotspots(h);
      if (!pick && h.length > 0) setPick(h[0]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (detection) setPick(detection); }, [detection]);

  const runPredict = async (d: Detection) => {
    setLoading(true);
    setTraj(null);
    try {
      const r = await api.trajectory(d.lat, d.lng, d.id);
      setTraj(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (pick) runPredict(pick); }, [pick]);

  useEffect(() => {
    if (!traj) return;
    progress.setValue(0);
    if (playing) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 4500,
        useNativeDriver: false,
      }).start(() => setPlaying(false));
    }
  }, [playing, traj, progress]);

  // Chart geometry
  const W = 800;
  const H = 360;
  const pad = 32;
  let pts: { x: number; y: number }[] = [];
  let pathD = \"\";
  if (traj) {
    const lats = traj.points.map((p) => p.lat);
    const lngs = traj.points.map((p) => p.lng);
    const minLat = Math.min(...lats, traj.origin_lat) - 0.5;
    const maxLat = Math.max(...lats, traj.origin_lat) + 0.5;
    const minLng = Math.min(...lngs, traj.origin_lng) - 0.5;
    const maxLng = Math.max(...lngs, traj.origin_lng) + 0.5;
    const toXY = (la: number, ln: number) => {
      const x = pad + ((ln - minLng) / (maxLng - minLng)) * (W - pad * 2);
      const y = pad + ((maxLat - la) / (maxLat - minLat)) * (H - pad * 2);
      return { x, y };
    };
    const origin = toXY(traj.origin_lat, traj.origin_lng);
    pts = [origin, ...traj.points.map((p) => toXY(p.lat, p.lng))];
    pathD = pts.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const cx = (prev.x + p.x) / 2;
      return acc + ` Q ${cx} ${prev.y} ${p.x} ${p.y}`;
    }, \"\");
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID=\"trajectory-view\">
      <View>
        <Text style={styles.kicker}>Drift Predictor</Text>
        <Text style={styles.title}>Where is this plastic going next?</Text>
        <Text style={styles.subtitle}>
          Forecast trajectory over 72 hours using simulated ocean currents and wind bearing.
        </Text>
      </View>

      <Card title=\"Select a hotspot\" testID=\"hotspot-picker\">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
          {hotspots.slice(0, 12).map((h, i) => {
            const active = pick?.id === h.id;
            return (
              <TouchableOpacity
                key={h.id + i}
                onPress={() => setPick(h)}
                testID={`hotspot-${i}`}
                style={[styles.hchip, active && styles.hchipActive]}
              >
                <Ionicons name=\"location\" size={14} color={active ? \"#fff\" : colors.coralAlert} />
                <View>
                  <Text style={[styles.hchipTitle, active && { color: \"#fff\" }]}>{h.region_name}</Text>
                  <Text style={[styles.hchipSub, active && { color: \"rgba(255,255,255,0.75)\" }]}>
                    FDI {h.fdi.toFixed(2)} · {Math.round(h.confidence * 100)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Card>

      <Card title=\"Predicted Trajectory\" subtitle={pick ? `${pick.region_name} · ${pick.lat.toFixed(2)}°, ${pick.lng.toFixed(2)}°` : \"—\"} testID=\"trajectory-map\">
        <View style={styles.mapWrap}>
          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={colors.cyanGlow} />
              <Text style={{ color: colors.cyanGlow, marginTop: 8, fontFamily: fonts.mono, fontSize: 11 }}>
                COMPUTING DRIFT…
              </Text>
            </View>
          ) : null}
          {traj ? (
            <Svg width=\"100%\" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio=\"xMidYMid meet\">
              <Defs>
                <LinearGradient id=\"path-g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\">
                  <Stop offset=\"0\" stopColor={colors.coralAlert} />
                  <Stop offset=\"1\" stopColor={colors.cyanGlow} />
                </LinearGradient>
              </Defs>

              {/* grid */}
              {[0.25, 0.5, 0.75].map((f, i) => (
                <React.Fragment key={i}>
                  <Line x1={pad} x2={W - pad} y1={pad + (H - 2 * pad) * f} y2={pad + (H - 2 * pad) * f} stroke=\"rgba(255,255,255,0.08)\" />
                  <Line y1={pad} y2={H - pad} x1={pad + (W - 2 * pad) * f} x2={pad + (W - 2 * pad) * f} stroke=\"rgba(255,255,255,0.08)\" />
                </React.Fragment>
              ))}

              {/* path */}
              <Path
                d={pathD}
                stroke=\"url(#path-g)\"
                strokeWidth={3}
                fill=\"none\"
                strokeDasharray=\"6 6\"
                strokeLinecap=\"round\"
              />

              {/* origin */}
              {pts.length > 0 ? (
                <>
                  <Circle cx={pts[0].x} cy={pts[0].y} r={14} fill={colors.coralAlert} opacity={0.25} />
                  <Circle cx={pts[0].x} cy={pts[0].y} r={6} fill={colors.coralAlert} />
                </>
              ) : null}

              {/* waypoint nodes */}
              {pts.slice(1).map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.cyanGlow} />
              ))}

              {/* animated buoy */}
              {playing && pts.length > 1 ? (
                <AnimatedCircle
                  cx={progress.interpolate({
                    inputRange: pts.map((_, i) => i / (pts.length - 1)),
                    outputRange: pts.map((p) => p.x),
                  })}
                  cy={progress.interpolate({
                    inputRange: pts.map((_, i) => i / (pts.length - 1)),
                    outputRange: pts.map((p) => p.y),
                  })}
                  r={9}
                  fill={colors.ecoLeaf}
                  stroke=\"#fff\"
                  strokeWidth={2}
                />
              ) : null}
            </Svg>
          ) : (
            <View style={{ height: H, alignItems: \"center\", justifyContent: \"center\" }}>
              <Text style={{ color: colors.cyanGlow, fontFamily: fonts.mono }}>Select a hotspot above to predict drift.</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            testID=\"play-trajectory-btn\"
            style={styles.playBtn}
            onPress={() => setPlaying(true)}
            disabled={!traj || playing}
          >
            <Ionicons name={playing ? \"hourglass-outline\" : \"play\"} size={16} color=\"#fff\" />
            <Text style={styles.playBtnText}>{playing ? \"Drifting…\" : \"Play 72-hour drift\"}</Text>
          </TouchableOpacity>

          {traj ? (
            <View style={styles.metricsRow}>
              <Metric label=\"Current\" value={`${traj.current_speed_knots} kn`} />
              <Metric label=\"Bearing\" value={`${traj.wind_bearing_deg.toFixed(0)}°`} />
              <Metric label=\"Horizon\" value={`${traj.points[traj.points.length - 1].hours_ahead}h`} />
              <Metric label=\"Drift\" value={`${traj.points[traj.points.length - 1].drift_km} km`} />
            </View>
          ) : null}
        </View>
      </Card>

      {traj ? (
        <Card title=\"Drift Waypoints\" subtitle=\"Every 6 hours — lat/lng + cumulative drift\" testID=\"waypoints\">
          <View style={styles.thead}>
            <Text style={[styles.th, { width: 70 }]}>H+</Text>
            <Text style={styles.th}>Latitude</Text>
            <Text style={styles.th}>Longitude</Text>
            <Text style={styles.th}>Drift (km)</Text>
          </View>
          {traj.points.map((p, i) => (
            <View key={i} style={styles.trow}>
              <Text style={[styles.td, { width: 70, color: colors.oceanBlue, fontWeight: \"700\" }]}>H+{p.hours_ahead}</Text>
              <Text style={styles.td}>{p.lat.toFixed(3)}°</Text>
              <Text style={styles.td}>{p.lng.toFixed(3)}°</Text>
              <Text style={styles.td}>{p.drift_km.toFixed(1)}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLbl}>{label}</Text>
      <Text style={styles.metricVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.lg },
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
  hchip: {
    flexDirection: \"row\", alignItems: \"center\", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.bgSecondary,
  },
  hchipActive: { backgroundColor: colors.deepWater, borderColor: colors.deepWater },
  hchipTitle: { fontFamily: fonts.heading, fontSize: 13, fontWeight: \"700\", color: colors.textPrimary },
  hchipSub: { fontFamily: fonts.mono, fontSize: 11, color: colors.textTertiary, marginTop: 2 },

  mapWrap: {
    width: \"100%\",
    borderRadius: radius.md,
    backgroundColor: \"#071C2F\",
    overflow: \"hidden\",
    borderWidth: 1,
    borderColor: \"rgba(144, 224, 239, 0.25)\",
    position: \"relative\",
  },
  loadingOverlay: {
    position: \"absolute\", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: \"center\", justifyContent: \"center\", zIndex: 10,
    backgroundColor: \"rgba(7, 28, 47, 0.7)\",
  },

  controls: { marginTop: spacing.md, flexDirection: \"row\", alignItems: \"center\", gap: spacing.lg, flexWrap: \"wrap\" },
  playBtn: {
    backgroundColor: colors.ecoGreen,
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999,
    flexDirection: \"row\", alignItems: \"center\", gap: 8,
  },
  playBtnText: { color: \"#fff\", fontFamily: fonts.heading, fontWeight: \"800\", fontSize: 13 },

  metricsRow: { flexDirection: \"row\", gap: spacing.lg, flexWrap: \"wrap\" },
  metric: {},
  metricLbl: {
    fontFamily: fonts.body, fontSize: 10, fontWeight: \"800\",
    letterSpacing: 1.6, textTransform: \"uppercase\", color: colors.textTertiary,
  },
  metricVal: { fontFamily: fonts.mono, fontSize: 16, fontWeight: \"700\", color: colors.textPrimary, marginTop: 2 },

  thead: { flexDirection: \"row\", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderStrong },
  th: {
    fontFamily: fonts.body, flex: 1, fontSize: 10, fontWeight: \"800\",
    color: colors.textTertiary, letterSpacing: 1.6, textTransform: \"uppercase\",
  },
  trow: { flexDirection: \"row\", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  td: { flex: 1, fontFamily: fonts.mono, fontSize: 12, color: colors.textPrimary },
});
"
