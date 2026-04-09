import { useEffect, useRef, useState, useCallback } from "react";
import { NativeEventSubscription, PermissionsAndroid, Platform } from "react-native";
import {
  PPGScanner,
  ppgEmitter,
  ensurePPGAvailable,
  DEFAULT_OPTIONS,
  PPGStartOptions,
} from "./PPGScanner";
import type { PPGFrameEvent, PPGStateEvent, PPGErrorEvent } from "../types";

export function usePPGScanner() {
  const [frame, setFrame] = useState<PPGFrameEvent | null>(null);
  const [scannerState, setScannerState] = useState<string>("idle");
  const [error, setError] = useState<PPGErrorEvent | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const activeRef = useRef(false);

  const pushLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-29), `${ts} ${msg}`]);
  }, []);

  useEffect(() => {
    ensurePPGAvailable();
    if (!ppgEmitter) return;

    const subs: NativeEventSubscription[] = [];

    subs.push(
      ppgEmitter.addListener("PPGState", (e: PPGStateEvent) => {
        setScannerState(e.state);
        pushLog(`[STATE] ${e.state} torch=${e.torchOn}`);
        if (e.state === "stopped") {
          activeRef.current = false;
        }
      })
    );

    subs.push(
      ppgEmitter.addListener("PPGFrame", (e: PPGFrameEvent) => {
        setFrame(e);
        setWaveform((prev) => [...prev.slice(-99), e.filteredY]);
      })
    );

    subs.push(
      ppgEmitter.addListener("PPGError", (e: PPGErrorEvent) => {
        setError(e);
        pushLog(`[ERROR] ${e.code}: ${e.message}`);
      })
    );

    return () => {
      subs.forEach((s) => s.remove());
    };
  }, [pushLog]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "android") return false;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "PPG Scanner needs camera access to measure heart rate",
          buttonPositive: "Grant",
          buttonNegative: "Deny",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }, []);

  const start = useCallback(async (options?: Partial<PPGStartOptions>) => {
    if (activeRef.current) {
      pushLog("[WARN] already running");
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      pushLog("[ERROR] camera permission denied");
      setError({ code: "PERMISSION_DENIED", message: "Camera permission denied" });
      return;
    }

    setError(null);
    setWaveform([]);
    setFrame(null);

    const opts = { ...DEFAULT_OPTIONS, ...options };
    activeRef.current = true;

    pushLog(`[START] options=${JSON.stringify(opts)}`);

    try {
      await PPGScanner.startScan(opts);
    } catch (e: any) {
      pushLog(`[START_FAIL] ${String(e?.message || e)}`);
      activeRef.current = false;
    }
  }, [pushLog, requestCameraPermission]);

  const stop = useCallback(async () => {
    pushLog("[STOP] stopping...");
    try {
      await PPGScanner.stopScan();
    } catch (e: any) {
      pushLog(`[STOP_FAIL] ${String(e?.message || e)}`);
    } finally {
      activeRef.current = false;
    }
  }, [pushLog]);

  return {
    frame,
    scannerState,
    error,
    waveform,
    logs,
    start,
    stop,
    pushLog,
    isActive: activeRef.current,
  };
}