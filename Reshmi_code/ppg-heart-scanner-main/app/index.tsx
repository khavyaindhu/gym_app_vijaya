import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useScanStore } from "../store/useScanStore";

export default function HomeScreen() {
  const router = useRouter();
  const latest = useScanStore((s) => s.latest);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>PPG Heart Scanner</Text>
        <Text style={s.sub}>Native Camera2 + ImageReader</Text>

        {latest && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Last Scan</Text>
            <Text style={s.cardValue}>{latest.hr} BPM</Text>
            <Text style={s.cardInfo}>
              {latest.samples} samples • {latest.quality} quality •{" "}
              {new Date(latest.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={s.btn}
          onPress={() => router.push("/scan")}
        >
          <Text style={s.btnText}>Start Scan</Text>
        </TouchableOpacity>

        <View style={s.info}>
          <Text style={s.infoTitle}>How it works</Text>
          {[
            "1. Camera opens with torch enabled",
            "2. Place fingertip over rear camera lens",
            "3. Native module reads Y-plane luminance",
            "4. Signal is smoothed and peaks detected",
            "5. Heart rate is estimated from peak intervals",
            "6. Remove finger when done",
          ].map((step, i) => (
            <Text key={i} style={s.infoStep}>{step}</Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1020" },
  container: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 28, fontWeight: "900" },
  sub: { color: "#6C7DA5", fontSize: 12, marginTop: 4, marginBottom: 24 },

  card: {
    width: "100%",
    backgroundColor: "#121A2F",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1F2945",
  },
  cardTitle: { color: "#6C7DA5", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  cardValue: { color: "#FF4081", fontSize: 48, fontWeight: "900" },
  cardInfo: { color: "#8FB3FF", fontSize: 11, marginTop: 8 },

  btn: {
    width: "85%",
    backgroundColor: "#FF4081",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 24,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  info: {
    width: "100%",
    backgroundColor: "#121A2F",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2945",
  },
  infoTitle: { color: "#8FB3FF", fontSize: 12, fontWeight: "800", marginBottom: 10 },
  infoStep: { color: "#9AA8C7", fontSize: 12, lineHeight: 24 },
});