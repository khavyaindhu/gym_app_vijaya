import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { PPGFrameEvent } from "../types";

type Props = {
  frame: PPGFrameEvent | null;
  scannerState: string;
};

export function PPGResultCard({ frame, scannerState }: Props) {
  const isScanning = scannerState === "scanning" || scannerState === "starting";

  return (
    <View style={s.container}>
      <View style={s.bpmCircle}>
        {frame && frame.bpm > 0 ? (
          <>
            <Text style={s.bpmValue}>{frame.bpm}</Text>
            <Text style={s.bpmLabel}>BPM</Text>
          </>
        ) : isScanning ? (
          <>
            <Text style={s.bpmIcon}>{frame?.fingerDetected ? "🫀" : "👆"}</Text>
            <Text style={s.bpmHint}>
              {frame?.fingerDetected ? "Detecting..." : "Place finger"}
            </Text>
          </>
        ) : (
          <>
            <Text style={s.bpmIcon}>❤️</Text>
            <Text style={s.bpmHint}>Ready</Text>
          </>
        )}
      </View>

      <View style={s.statsRow}>
        <StatItem
          label="Quality"
          value={frame?.quality ?? "none"}
          color={
            frame?.quality === "strong"
              ? "#00FF88"
              : frame?.quality === "good"
              ? "#FFD700"
              : "#FF8C00"
          }
        />
        <StatItem
          label="Samples"
          value={String(frame?.sampleCount ?? 0)}
          color="#8FB3FF"
        />
        <StatItem
          label="Peaks"
          value={String(frame?.peakCount ?? 0)}
          color="#FF8AA1"
        />
      </View>
    </View>
  );
}

function StatItem({
  label,
  value,
  color = "#fff",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 16 },
  bpmCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#111827",
    borderWidth: 3,
    borderColor: "#FF408188",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  bpmValue: { color: "#FF4081", fontSize: 52, fontWeight: "900", lineHeight: 56 },
  bpmLabel: { color: "#FF408188", fontSize: 14, fontWeight: "600" },
  bpmIcon: { fontSize: 44 },
  bpmHint: { color: "#666", fontSize: 12, marginTop: 4 },

  statsRow: { flexDirection: "row", gap: 24 },
  stat: { alignItems: "center" },
  statLabel: { color: "#6C7DA5", fontSize: 10, fontWeight: "700", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800" },
});