export type PPGPoint = {
  time: number;
  brightness: number;
};

export type ScanResult = {
  hr: number;
  hrv: number;
  rmssd: number;
  sdnn: number;
  confidence: number;
  timestamp: number;
  samples: number;
  quality: "High" | "Medium" | "Low";
};

export type PPGFrameEvent = {
  timestamp: number;
  elapsedMs: number;
  rawY: number;
  filteredY: number;
  baselineY: number;
  delta: number;
  fingerDetected: boolean;
  sampleCount: number;
  quality: "none" | "weak" | "good" | "strong";
  bpm: number;
  peakCount: number;
};

export type PPGStateEvent = {
  state: "starting" | "scanning" | "stopped";
  torchOn: boolean;
  cameraOpen: boolean;
};

export type PPGErrorEvent = {
  code: string;
  message: string;
};