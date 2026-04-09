package com.ppgheartscanner.ppg;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class PPGScannerModule extends ReactContextBaseJavaModule {
    public static final String NAME = "PPGScanner";
    private final PPGScannerManager scannerManager;

    public PPGScannerModule(ReactApplicationContext ctx) {
        super(ctx);
        this.scannerManager = new PPGScannerManager(ctx);
    }

    @Override public String getName() { return NAME; }

    @ReactMethod
    public void isAvailable(Promise p) { p.resolve(true); }

    @ReactMethod
    public void getStatus(Promise p) { p.resolve(scannerManager.isRunning()); }

    @ReactMethod
    public void startScan(ReadableMap o, Promise p) {
        try {
            int w = o.hasKey("width") ? o.getInt("width") : 640;
            int h = o.hasKey("height") ? o.getInt("height") : 480;
            double alpha = o.hasKey("alpha") ? o.getDouble("alpha") : 0.2;
            double onD = o.hasKey("fingerOnDelta") ? o.getDouble("fingerOnDelta") : 15.0;
            double offD = o.hasKey("fingerOffDelta") ? o.getDouble("fingerOffDelta") : 8.0;
            int cal = o.hasKey("calibrationFrames") ? o.getInt("calibrationFrames") : 30;
            int emitN = o.hasKey("emitEveryNthFrame") ? o.getInt("emitEveryNthFrame") : 2;
            long minPeak = o.hasKey("minPeakIntervalMs") ? o.getInt("minPeakIntervalMs") : 500;

            scannerManager.start(w, h, alpha, onD, offD, cal, emitN, minPeak);
            p.resolve(null);
        } catch (Exception e) { p.reject("START_FAIL", e); }
    }

    @ReactMethod
    public void stopScan(Promise p) {
        try { scannerManager.stop(); p.resolve(null); }
        catch (Exception e) { p.reject("STOP_FAIL", e); }
    }
}