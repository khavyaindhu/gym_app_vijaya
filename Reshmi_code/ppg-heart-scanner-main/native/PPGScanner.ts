import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import type { PPGFrameEvent, PPGStateEvent, PPGErrorEvent } from "../types";

const NativePPG = NativeModules.PPGScanner;

if (Platform.OS === "android" && !NativePPG) {
  console.warn(
    "PPGScanner native module not found. " +
    "Did you run expo prebuild and rebuild the app?"
  );
}

export const PPGScanner = NativePPG;

export const ppgEmitter = NativePPG
  ? new NativeEventEmitter(NativePPG)
  : null;

export function ensurePPGAvailable(): void {
  if (Platform.OS !== "android") {
    throw new Error("PPGScanner is Android-only");
  }
  if (!NativePPG) {
    throw new Error(
      "PPGScanner native module not found. " +
      "Run: npx expo prebuild --clean && npx expo run:android"
    );
  }
}

export type PPGStartOptions = {
  width?: number;
  height?: number;
  alpha?: number;
  fingerOnDelta?: number;
  fingerOffDelta?: number;
  calibrationFrames?: number;
  emitEveryNthFrame?: number;
  minPeakIntervalMs?: number;
};

export const DEFAULT_OPTIONS: PPGStartOptions = {
  width: 640,
  height: 480,
  alpha: 0.2,
  fingerOnDelta: 12,
  fingerOffDelta: 6,
  calibrationFrames: 30,
  emitEveryNthFrame: 2,
  minPeakIntervalMs: 500,
};

export { PPGFrameEvent, PPGStateEvent, PPGErrorEvent };