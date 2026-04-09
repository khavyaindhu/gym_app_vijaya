package com.khavya.gym_mobile_app.ppg;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.ImageFormat;
import android.hardware.camera2.*;
import android.media.Image;
import android.media.ImageReader;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.nio.ByteBuffer;
import java.util.Arrays;

public class PPGScannerManager {
    private static final String TAG = "PPGScannerManager";

    private final ReactApplicationContext reactContext;
    private final CameraManager cameraManager;

    private CameraDevice cameraDevice;
    private CameraCaptureSession captureSession;
    private ImageReader imageReader;
    private HandlerThread cameraThread;
    private Handler cameraHandler;
    private String cameraId;

    private boolean running = false;
    private int emitEveryNthFrame = 2;
    private int frameCounter = 0;
    private PPGSignalProcessor signalProcessor;
    private int width = 640, height = 480;

    public PPGScannerManager(ReactApplicationContext ctx) {
        this.reactContext = ctx;
        this.cameraManager = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
    }

    public boolean isRunning() { return running; }

    public void start(int w, int h, double alpha, double onD, double offD,
                      int calFrames, int emitN, long minPeak) {
        if (running) { emitError("ALREADY_RUNNING","Already running"); return; }
        this.width = w; this.height = h;
        this.emitEveryNthFrame = Math.max(1, emitN);
        this.frameCounter = 0;

        signalProcessor = new PPGSignalProcessor(alpha, onD, offD, calFrames, minPeak);
        signalProcessor.reset();
        startBackgroundThread();
        openBackCamera();
    }

    public void stop() {
        running = false;
        try { if(captureSession!=null) { captureSession.stopRepeating(); captureSession.abortCaptures(); }} catch(Exception ignored){}
        try { if(captureSession!=null) { captureSession.close(); captureSession=null; }} catch(Exception ignored){}
        try { if(imageReader!=null) { imageReader.close(); imageReader=null; }} catch(Exception ignored){}
        try { if(cameraDevice!=null) { cameraDevice.close(); cameraDevice=null; }} catch(Exception ignored){}
        stopBackgroundThread();
        emitState("stopped",false,false);
    }

    private void startBackgroundThread() {
        cameraThread = new HandlerThread("PPGCameraThread");
        cameraThread.start();
        cameraHandler = new Handler(cameraThread.getLooper());
    }

    private void stopBackgroundThread() {
        if(cameraThread!=null) {
            cameraThread.quitSafely();
            try { cameraThread.join(); } catch(InterruptedException ignored){}
            cameraThread=null; cameraHandler=null;
        }
    }

    private void openBackCamera() {
        emitState("starting",false,false);
        if(ContextCompat.checkSelfPermission(reactContext, Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED) {
            emitError("NO_PERMISSION","Camera permission not granted"); stop(); return;
        }
        try {
            cameraId = findBackCameraId();
            if(cameraId==null) { emitError("NO_BACK_CAMERA","No back camera"); stop(); return; }
            imageReader = ImageReader.newInstance(width, height, ImageFormat.YUV_420_888, 2);
            imageReader.setOnImageAvailableListener(this::analyzeImage, cameraHandler);
            cameraManager.openCamera(cameraId, stateCallback, cameraHandler);
        } catch(Exception e) { emitError("OPEN_FAILED",e.getMessage()); stop(); }
    }

    private String findBackCameraId() throws CameraAccessException {
        for(String id: cameraManager.getCameraIdList()) {
            CameraCharacteristics c = cameraManager.getCameraCharacteristics(id);
            Integer f = c.get(CameraCharacteristics.LENS_FACING);
            if(f!=null && f==CameraCharacteristics.LENS_FACING_BACK) return id;
        }
        return null;
    }

    private final CameraDevice.StateCallback stateCallback = new CameraDevice.StateCallback() {
        @Override public void onOpened(@NonNull CameraDevice cam) { cameraDevice=cam; createSession(); }
        @Override public void onDisconnected(@NonNull CameraDevice cam) { emitError("DISCONNECTED","Camera disconnected"); cam.close(); cameraDevice=null; stop(); }
        @Override public void onError(@NonNull CameraDevice cam, int err) { emitError("CAMERA_ERROR","Error: "+err); cam.close(); cameraDevice=null; stop(); }
    };

    private void createSession() {
        try {
            if(cameraDevice==null||imageReader==null) { emitError("SESSION_NULL","Null device/reader"); stop(); return; }
            final CaptureRequest.Builder b = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
            b.addTarget(imageReader.getSurface());
            b.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH);
            b.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON);
            try { b.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_OFF); } catch(Exception ignored){}

            cameraDevice.createCaptureSession(Arrays.asList(imageReader.getSurface()),
                new CameraCaptureSession.StateCallback() {
                    @Override public void onConfigured(@NonNull CameraCaptureSession s) {
                        captureSession=s;
                        try { s.setRepeatingRequest(b.build(),null,cameraHandler); running=true; emitState("scanning",true,true); }
                        catch(CameraAccessException e) { emitError("REPEAT_FAIL",e.getMessage()); stop(); }
                    }
                    @Override public void onConfigureFailed(@NonNull CameraCaptureSession s) { emitError("CONFIG_FAIL","Session config failed"); stop(); }
                }, cameraHandler);
        } catch(Exception e) { emitError("SESSION_FAIL",e.getMessage()); stop(); }
    }

    private void analyzeImage(ImageReader reader) {
        Image image = null;
        try {
            image = reader.acquireLatestImage();
            if(image==null||!running) return;
            double avgY = computeCenterAverageY(image);
            long now = System.currentTimeMillis();
            PPGSignalProcessor.Result r = signalProcessor.process(avgY, now);
            frameCounter++;
            if(frameCounter % emitEveryNthFrame == 0) emitFrame(r);
        } catch(Exception e) { emitError("ANALYZE_FAIL",e.getMessage()); }
        finally { if(image!=null) image.close(); }
    }

    private double computeCenterAverageY(Image image) {
        int w=image.getWidth(), h=image.getHeight();
        Image.Plane yPlane = image.getPlanes()[0];
        ByteBuffer yBuf = yPlane.getBuffer();
        int rowStride=yPlane.getRowStride(), pixStride=yPlane.getPixelStride();
        int xs=w/4, xe=w*3/4, ys=h/4, ye=h*3/4;
        long sum=0; int count=0;
        for(int row=ys; row<ye; row+=2) {
            for(int col=xs; col<xe; col+=2) {
                int idx = row*rowStride + col*pixStride;
                if(idx>=0 && idx<yBuf.limit()) { sum += (yBuf.get(idx) & 0xFF); count++; }
            }
        }
        return count>0 ? sum/(double)count : 0.0;
    }

    private void emitFrame(PPGSignalProcessor.Result r) {
        WritableMap m = Arguments.createMap();
        m.putDouble("timestamp",(double)r.timestamp);
        m.putDouble("elapsedMs",(double)r.elapsedMs);
        m.putDouble("rawY",r.rawY);
        m.putDouble("filteredY",r.filteredY);
        m.putDouble("baselineY",r.baselineY);
        m.putDouble("delta",r.delta);
        m.putBoolean("fingerDetected",r.fingerDetected);
        m.putInt("sampleCount",r.sampleCount);
        m.putString("quality",r.quality);
        m.putInt("bpm",r.bpm);
        m.putInt("peakCount",r.peakCount);
        sendEvent("PPGFrame",m);
    }

    private void emitState(String state, boolean torch, boolean cam) {
        WritableMap m = Arguments.createMap();
        m.putString("state",state); m.putBoolean("torchOn",torch); m.putBoolean("cameraOpen",cam);
        sendEvent("PPGState",m);
    }

    private void emitError(String code, String msg) {
        Log.e(TAG,code+": "+msg);
        WritableMap m = Arguments.createMap();
        m.putString("code",code); m.putString("message",msg!=null?msg:"Unknown");
        sendEvent("PPGError",m);
    }

    private void sendEvent(String name, WritableMap params) {
        if(reactContext.hasActiveCatalystInstance())
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(name,params);
    }
}
