package com.ppgheartscanner.ppg;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class PPGScannerPackage implements ReactPackage {

    @Override
    @SuppressWarnings("rawtypes")
    public List<ViewManager> createViewManagers(ReactApplicationContext ctx) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext ctx) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new PPGScannerModule(ctx));
        return modules;
    }
}