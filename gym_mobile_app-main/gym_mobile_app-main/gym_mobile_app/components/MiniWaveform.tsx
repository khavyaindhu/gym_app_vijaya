import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

type Props = {
  data: number[];
  height?: number;
  color?: string;
};

export function MiniWaveform({ data, height = 48, color = "#FF4D4D" }: Props) {
  const bars = useMemo(() => {
    if (data.length < 2) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    return data.map((v) => ({
      ratio: (v - min) / range,
    }));
  }, [data]);

  return (
    <View style={[styles.row, { height }]}>
      {bars.map((b, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: Math.max(2, b.ratio * height),
              backgroundColor: color,
              opacity: 0.4 + b.ratio * 0.6,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1,
  },
  bar: {
    flex: 1,
    minWidth: 2,
    borderRadius: 1,
  },
});
