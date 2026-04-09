package com.ppgheartscanner.ppg;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class PPGSignalProcessor {

    public static class Result {
        public long timestamp;
        public long elapsedMs;
        public double rawY;
        public double filteredY;
        public double baselineY;
        public double delta;
        public boolean fingerDetected;
        public int sampleCount;
        public String quality;
        public int bpm;
        public int peakCount;
    }

    private final double alpha;
    private final double fingerOnDelta;
    private final double fingerOffDelta;
    private final int calibrationFrames;
    private final long minPeakIntervalMs;

    private Double filteredValue = null;
    private Double baselineValue = null;
    private boolean fingerDetected = false;
    private long startTime = 0L;
    private int sampleCount = 0;

    private final List<Double> calibration = new ArrayList<>();
    private final Deque<Double> recentValues = new ArrayDeque<>();
    private final Deque<SignalPoint> recentPoints = new ArrayDeque<>();
    private final List<Long> peakTimestamps = new ArrayList<>();

    private int bpm = 0;

    private static class SignalPoint {
        long timestamp;
        double value;
        SignalPoint(long t, double v) { this.timestamp = t; this.value = v; }
    }

    public PPGSignalProcessor(
        double alpha, double fingerOnDelta, double fingerOffDelta,
        int calibrationFrames, long minPeakIntervalMs
    ) {
        this.alpha = alpha;
        this.fingerOnDelta = fingerOnDelta;
        this.fingerOffDelta = fingerOffDelta;
        this.calibrationFrames = calibrationFrames;
        this.minPeakIntervalMs = minPeakIntervalMs;
    }

    public void reset() {
        filteredValue = null;
        baselineValue = null;
        fingerDetected = false;
        startTime = System.currentTimeMillis();
        sampleCount = 0;
        calibration.clear();
        recentValues.clear();
        recentPoints.clear();
        peakTimestamps.clear();
        bpm = 0;
    }

    public Result process(double rawY, long timestamp) {
        if (startTime == 0L) startTime = timestamp;

        if (filteredValue == null) filteredValue = rawY;
        else filteredValue = alpha * rawY + (1.0 - alpha) * filteredValue;

        if (baselineValue == null || calibration.size() < calibrationFrames) {
            calibration.add(filteredValue);
            baselineValue = avg(calibration);
        }

        double baseline = baselineValue != null ? baselineValue : filteredValue;
        double delta = filteredValue - baseline;

        if (fingerDetected) fingerDetected = filteredValue >= baseline + fingerOffDelta;
        else fingerDetected = filteredValue >= baseline + fingerOnDelta;

        if (fingerDetected) {
            sampleCount++;
            recentValues.addLast(filteredValue);
            if (recentValues.size() > 30) recentValues.removeFirst();

            double centered = filteredValue - baseline;
            recentPoints.addLast(new SignalPoint(timestamp, centered));
            if (recentPoints.size() > 7) recentPoints.removeFirst();

            detectPeak();
            bpm = computeBpm(timestamp);
        } else {
            recentValues.clear();
            recentPoints.clear();
            peakTimestamps.clear();
            bpm = 0;
        }

        Result r = new Result();
        r.timestamp = timestamp;
        r.elapsedMs = timestamp - startTime;
        r.rawY = rawY;
        r.filteredY = filteredValue;
        r.baselineY = baseline;
        r.delta = delta;
        r.fingerDetected = fingerDetected;
        r.sampleCount = sampleCount;
        r.quality = estimateQuality();
        r.bpm = bpm;
        r.peakCount = peakTimestamps.size();
        return r;
    }

    private void detectPeak() {
        if (recentPoints.size() < 5) return;
        SignalPoint[] a = recentPoints.toArray(new SignalPoint[0]);
        int len = a.length;
        SignalPoint p0=a[len-5], p1=a[len-4], p2=a[len-3], p3=a[len-2], p4=a[len-1];

        double range = recentRange();
        boolean isPeak = p2.value > p1.value && p2.value > p0.value
                && p2.value > p3.value && p2.value > p4.value
                && p2.value > range * 0.2;

        if (!isPeak) return;
        long pt = p2.timestamp;
        if (peakTimestamps.isEmpty()) { peakTimestamps.add(pt); return; }
        if (pt - peakTimestamps.get(peakTimestamps.size()-1) >= minPeakIntervalMs)
            peakTimestamps.add(pt);

        long cutoff = pt - 10_000L;
        while (!peakTimestamps.isEmpty() && peakTimestamps.get(0) < cutoff)
            peakTimestamps.remove(0);
    }

    private int computeBpm(long now) {
        while (peakTimestamps.size()>1 && now - peakTimestamps.get(0) > 10_000L)
            peakTimestamps.remove(0);
        if (peakTimestamps.size()<2) return 0;

        List<Long> intervals = new ArrayList<>();
        for (int i=1; i<peakTimestamps.size(); i++) {
            long d = peakTimestamps.get(i) - peakTimestamps.get(i-1);
            if (d >= minPeakIntervalMs) intervals.add(d);
        }
        if (intervals.isEmpty()) return 0;
        intervals.sort(Long::compare);
        int n = intervals.size();
        long median = n%2==0 ? (intervals.get(n/2-1)+intervals.get(n/2))/2 : intervals.get(n/2);
        int c = (int)Math.round(60000.0/median);
        return (c>=45 && c<=180) ? c : 0;
    }

    private double recentRange() {
        if (recentPoints.isEmpty()) return 0;
        double min=Double.MAX_VALUE, max=-Double.MAX_VALUE;
        for (SignalPoint p: recentPoints) { if(p.value<min) min=p.value; if(p.value>max) max=p.value; }
        return max-min;
    }

    private String estimateQuality() {
        if (!fingerDetected || recentValues.size()<5) return "none";
        double mean=0; for(Double v:recentValues) mean+=v; mean/=recentValues.size();
        double var=0; for(Double v:recentValues) { double d=v-mean; var+=d*d; } var/=recentValues.size();
        double sd=Math.sqrt(var);
        if(sd<0.8) return "weak"; if(sd<3.0) return "good"; return "strong";
    }

    private double avg(List<Double> v) {
        if(v.isEmpty()) return 0; double s=0; for(Double x:v) s+=x; return s/v.size();
    }
}