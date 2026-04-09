import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { PPGFrameEvent } from "../types";

type Props = {
  frame: PPGFrameEvent | null;
  logs: string[];
};

export function PPGDebugPanel({ frame, logs }: Props) {
  const f = frame;

  const qualityColor =
    f?.quality === "strong"
      ? "#00FF88"
      : f?.quality === "good"
      ? "#FFD700"
      : f?.quality === "weak"
      ? "#FF8C00"
      : "#FF4D4D";

  return (
    <View style={s.container}>
      <Text style={s.title}>DEBUG PANEL</Text>

      <View style={s.grid}>
        <DebugItem label="Raw Y" value={f?.rawY?.toFixed(2) ?? "--"} />
        <DebugItem label="Filtered Y" value={f?.filteredY?.toFixed(2) ?? "--"} />
        <DebugItem label="Baseline Y" value={f?.baselineY?.toFixed(2) ?? "--"} />
        <DebugItem
          label="Delta"
          value={f?.delta?.toFixed(2) ?? "--"}
          color={f && f.delta >= 0 ? "#00FF88" : "#FF4D4D"}
        />
        <DebugItem
          label="Finger"
          value={f?.fingerDetected ? "ON" : "OFF"}
          color={f?.fingerDetected ? "#00FF88" : "#FF4D4D"}
        />
        <DebugItem label="Quality" value={f?.quality ?? "--"} color={qualityColor} />
        <DebugItem label="Samples" value={String(f?.sampleCount ?? 0)} />
        <DebugItem label="Peaks" value={String(f?.peakCount ?? 0)} />
        <DebugItem
          label="BPM"
          value={String(f?.bpm ?? 0)}
          color={f && f.bpm > 0 ? "#FF4D4D" : "#666"}
        />
        <DebugItem label="Elapsed" value={`${f ? Math.round(f.elapsedMs / 1000) : 0}s`} />
      </View>

      <Text style={s.logTitle}>EVENT LOG</Text>
      <ScrollView style={s.logBox} nestedScrollEnabled>
        {logs.length === 0 ? (
          <Text style={s.logLine}>No events yet</Text>
        ) : (
          logs.map((l, i) => (
            <Text key={`${i}-${l}`} style={s.logLine}>
              {l}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function DebugItem({
  label,
  value,
  color = "#E8F0FF",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={s.item}>
      <Text style={s.itemLabel}>{label}</Text>
      <Text style={[s.itemValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: "#101421",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#24304A",
  },
  title: {
    color: "#8FB3FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  item: {
    width: "48%",
    backgroundColor: "#0B0F19",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1D2740",
  },
  itemLabel: {
    color: "#6C7DA5",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemValue: {
    color: "#E8F0FF",
    fontSize: 16,
    fontWeight: "800",
  },
  logTitle: {
    color: "#8FB3FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  logBox: {
    backgroundColor: "#0B0F19",
    borderRadius: 10,
    padding: 10,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#1D2740",
  },
  logLine: {
    color: "#B7C6E3",
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 3,
  },
});