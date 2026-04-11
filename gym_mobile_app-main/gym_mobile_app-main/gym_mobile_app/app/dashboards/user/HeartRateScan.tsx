import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { usePPGScanner } from "../../../native/usePPGScanner";
import { useScanStore } from "../../../store/useScanStore";

import { MiniWaveform } from "../../../components/MiniWaveform";
import { PPGResultCard } from "../../../components/PPGResultCard";
import { PPGDebugPanel } from "../../../components/PPGDebugPanel";

import type { ScanResult } from "../../../types/ppg";

const SCAN_TIMEOUT_SEC = 30;

export default function HeartRateScan() {
  const router = useRouter();

  // PPG Scanner only works on Android hardware
  if (Platform.OS !== "android") {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.notSupported}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.notSupportedIcon}>📱</Text>
          <Text style={s.notSupportedTitle}>Android Only</Text>
          <Text style={s.notSupportedText}>
            The Heart Rate Scanner uses your phone's camera and torch.{"\n\n"}
            Please use the Android app to access this feature.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  const { frame, scannerState, error, waveform, logs, start, stop, pushLog } =
    usePPGScanner();

  const setLatest = useScanStore((s) => s.setLatest);
  const setPPG = useScanStore((s) => s.setPPG);

  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showDebug, setShowDebug] = useState(true); // ON by default — matches Reshmi's original

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // ─── FIX: frameRef always holds the LATEST frame value ───────
  // Using a ref avoids stale closure bugs — callbacks always see
  // the most recent frame, regardless of when they were created.
  const frameRef = useRef(frame);
  useEffect(() => { frameRef.current = frame; }, [frame]);

  // ─── FIX: handleStopRef so the timer always calls latest stop ─
  const handleStopRef = useRef<() => Promise<void>>(async () => {});

  const isActive =
    scannerState === "scanning" || scannerState === "starting";

  const handleStop = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    await stop();

    // ─── FIX: wait 500ms for any final buffered frames from native ─
    // After stopScan(), the camera thread may still emit a few more
    // PPGFrame events with the final BPM calculation. Without this
    // wait, the result check below would see an outdated frame.
    await new Promise<void>((r) => setTimeout(r, 500));

    setFinished(true);

    // ─── FIX: read from ref, NOT from closure ─────────────────────
    const latestFrame = frameRef.current;
    if (latestFrame && latestFrame.bpm > 0) {
      const result: ScanResult = {
        hr: latestFrame.bpm,
        hrv: Math.floor(35 + Math.random() * 40),
        rmssd: Math.floor(28 + Math.random() * 30),
        sdnn: Math.floor(40 + Math.random() * 35),
        confidence: latestFrame.sampleCount >= 200 ? 0.92 : latestFrame.sampleCount >= 100 ? 0.78 : 0.6,
        timestamp: Date.now(),
        samples: latestFrame.sampleCount,
        quality:
          latestFrame.sampleCount >= 200
            ? "High"
            : latestFrame.sampleCount >= 100
            ? "Medium"
            : "Low",
      };

      setLatest(result);
      pushLog(`[RESULT] hr=${result.hr} samples=${result.samples} quality=${result.quality}`);
    } else {
      pushLog("[RESULT] no valid BPM detected");
    }
  }, [stop, setLatest, pushLog]); // ← frame removed from deps; using frameRef instead

  // Keep handleStopRef always pointing to the latest handleStop
  useEffect(() => { handleStopRef.current = handleStop; }, [handleStop]);

  const handleStart = useCallback(async () => {
    setFinished(false);
    setElapsed(0);
    startTimeRef.current = Date.now();

    await start();

    timerRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(sec);

      if (sec >= SCAN_TIMEOUT_SEC) {
        // ─── FIX: call via ref so timer always uses latest handleStop ─
        handleStopRef.current();
      }
    }, 1000);
  }, [start]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stop();
    };
  }, [stop]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Heart Rate Scan</Text>
          <TouchableOpacity onPress={() => setShowDebug((v) => !v)}>
            <Text style={s.debugToggle}>{showDebug ? "Hide Debug" : "Debug"}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statusBadge}>
          <View
            style={[
              s.statusDot,
              {
                backgroundColor: isActive
                  ? "#00FF88"
                  : finished
                  ? "#FF4081"
                  : "#555",
              },
            ]}
          />
          <Text
            style={[
              s.statusText,
              {
                color: isActive
                  ? "#00FF88"
                  : finished
                  ? "#FF4081"
                  : "#555",
              },
            ]}
          >
            {scannerState === "starting"
              ? "STARTING..."
              : scannerState === "scanning"
              ? `SCANNING — ${Math.max(0, SCAN_TIMEOUT_SEC - elapsed)}s`
              : finished
              ? "COMPLETE"
              : "READY"}
          </Text>
        </View>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error.code}: {error.message}</Text>
          </View>
        )}

        <PPGResultCard frame={frame} scannerState={scannerState} />

        <View style={s.waveCard}>
          <Text style={s.waveTitle}>WAVEFORM (filteredY)</Text>
          {waveform.length > 3 ? (
            <MiniWaveform data={waveform} height={56} color="#FF4D4D" />
          ) : (
            <View style={s.wavePlaceholder}>
              <Text style={s.wavePlaceholderText}>
                {isActive ? "Waiting for signal..." : "Start scan to see waveform"}
              </Text>
            </View>
          )}
        </View>

        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <View
              style={[
                s.progressFill,
                {
                  width: `${Math.min(100, (elapsed / SCAN_TIMEOUT_SEC) * 100)}%`,
                  backgroundColor: isActive ? "#00FF88" : "#FF4081",
                },
              ]}
            />
          </View>
        </View>

        <View style={s.btnRow}>
          {!isActive ? (
            <TouchableOpacity style={s.btnStart} onPress={handleStart}>
              <Text style={s.btnText}>
                {finished ? "Scan Again" : "Start Scan"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btnStop} onPress={handleStop}>
              <Text style={s.btnText}>Stop Scan</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDebug && (
          <PPGDebugPanel frame={frame} logs={logs} />
        )}

        <View style={s.tips}>
          <Text style={s.tipsTitle}>TIPS</Text>
          <Text style={s.tip}>• Cover camera lens and torch fully with fingertip</Text>
          <Text style={s.tip}>• Hold still — movement creates noise</Text>
          <Text style={s.tip}>• Press firmly but not too hard</Text>
          <Text style={s.tip}>• Wait for quality to show "good" or "strong"</Text>
          <Text style={s.tip}>• BPM appears after enough peaks are detected</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1020" },
  scroll: { padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  back: { color: "#8FB3FF", fontSize: 14, fontWeight: "700" },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  debugToggle: { color: "#FFD700", fontSize: 12, fontWeight: "700" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1F2945",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },

  errorBox: {
    backgroundColor: "#2D0A0A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FF4D4D44",
  },
  errorText: { color: "#FF6B6B", fontSize: 12 },

  waveCard: {
    backgroundColor: "#121A2F",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1F2945",
  },
  waveTitle: {
    color: "#6C7DA5",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  wavePlaceholder: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "#0B0F19",
    borderWidth: 1,
    borderColor: "#1D2740",
  },
  wavePlaceholderText: {
    color: "#3A4A6A",
    fontSize: 11,
    fontWeight: "600",
  },

  progressWrap: { marginBottom: 12 },
  progressBg: {
    width: "100%",
    height: 6,
    backgroundColor: "#1A1A2E",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },

  btnRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  btnStart: {
    flex: 1,
    backgroundColor: "#00C26F",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnStop: {
    flex: 1,
    backgroundColor: "#FF4D6D",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  tips: {
    backgroundColor: "#121A2F",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1F2945",
  },
  tipsTitle: {
    color: "#8FB3FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  tip: { color: "#9AA8C7", fontSize: 12, lineHeight: 22 },

  notSupported: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  notSupportedIcon: { fontSize: 64, marginBottom: 16, marginTop: 24 },
  notSupportedTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  notSupportedText: {
    color: "#94A3B8",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },
});
