/**
 * Expo Config Plugin — PPG Heart Rate Scanner (Reshmi's code)
 *
 * This plugin runs automatically during `npx expo prebuild` and:
 *   1. Adds CAMERA permission to AndroidManifest.xml
 *   2. Copies the 4 Java source files into the Android project
 *   3. Registers PPGScannerPackage inside MainApplication.kt
 */

const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// ─── Step 1: Add CAMERA permission ────────────────────────────────────────────
const withCameraPermission = (config) => {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const CAMERA = 'android.permission.CAMERA';
    const already = manifest['uses-permission'].some(
      (p) => p.$ && p.$['android:name'] === CAMERA
    );

    if (!already) {
      manifest['uses-permission'].push({ $: { 'android:name': CAMERA } });
    }

    return cfg;
  });
};

// ─── Step 2: Copy Java files into the Android project ─────────────────────────
const withPPGFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;

      // Destination: android/app/src/main/java/com/khavya/gym_mobile_app/ppg/
      const destDir = path.join(
        platformRoot,
        'app', 'src', 'main', 'java',
        'com', 'khavya', 'gym_mobile_app', 'ppg'
      );
      fs.mkdirSync(destDir, { recursive: true });

      // Source: android-native/ppg/  (in the project root)
      const srcDir = path.join(projectRoot, 'android-native', 'ppg');

      if (!fs.existsSync(srcDir)) {
        console.warn(
          `[withPPGScanner] Source directory not found: ${srcDir}\n` +
          'Make sure android-native/ppg/ exists in your project root.'
        );
        return cfg;
      }

      const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.java'));
      files.forEach((file) => {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
        console.log(`[withPPGScanner] Copied ${file} → ${destDir}`);
      });

      return cfg;
    },
  ]);
};

// ─── Step 3: Register PPGScannerPackage in MainApplication.kt ─────────────────
const withPPGPackage = (config) => {
  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;

    const importLine = 'import com.khavya.gym_mobile_app.ppg.PPGScannerPackage';

    // --- Add import if missing ---
    if (!contents.includes(importLine)) {
      // Insert right before the "class MainApplication" declaration
      contents = contents.replace(
        /(^class MainApplication)/m,
        `${importLine}\n\n$1`
      );
    }

    // --- Register package inside getPackages() if missing ---
    if (!contents.includes('PPGScannerPackage()')) {
      // Pattern 1: val packages = PackageList(this).packages  (most common)
      if (contents.includes('val packages = PackageList(this).packages')) {
        contents = contents.replace(
          'val packages = PackageList(this).packages',
          'val packages = PackageList(this).packages\n            packages.add(PPGScannerPackage())'
        );
      }
      // Pattern 2: PackageList(this).packages.apply { ... }
      else if (contents.includes('PackageList(this).packages.apply {')) {
        contents = contents.replace(
          'PackageList(this).packages.apply {',
          'PackageList(this).packages.apply {\n              add(PPGScannerPackage())'
        );
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};

// ─── Export composed plugin ───────────────────────────────────────────────────
module.exports = (config) => {
  config = withCameraPermission(config);
  config = withPPGFiles(config);
  config = withPPGPackage(config);
  return config;
};
