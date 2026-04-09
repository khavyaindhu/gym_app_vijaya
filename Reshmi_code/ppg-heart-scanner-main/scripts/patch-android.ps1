# Create target directory (PowerShell equivalent of mkdir -p)
$targetDir = "android\app\src\main\java\com\ppgheartscanner\ppg"

if (!(Test-Path -Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "Created directory: $targetDir" -ForegroundColor Green
}

# Copy native PPG files
$files = @(
    "PPGSignalProcessor.java",
    "PPGScannerManager.java",
    "PPGScannerModule.java",
    "PPGScannerPackage.java"
)

$sourceDir = "native-android"

foreach ($file in $files) {
    $src = Join-Path $sourceDir $file
    $dst = Join-Path $targetDir $file

    if (Test-Path -Path $src) {
        Copy-Item -Path $src -Destination $dst -Force
        Write-Host "Copied: $file" -ForegroundColor Cyan
    } else {
        Write-Host "WARNING: Source not found: $src" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Native PPG files copied!" -ForegroundColor Green
Write-Host ""
Write-Host "REMINDER: Add PPGScannerPackage to MainApplication.java getPackages()" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Open: android\app\src\main\java\com\ppgheartscanner\MainApplication.java" -ForegroundColor Yellow
Write-Host "  2. Add import:  import com.ppgheartscanner.ppg.PPGScannerPackage;" -ForegroundColor Yellow
Write-Host "  3. Add in getPackages():  packages.add(new PPGScannerPackage());" -ForegroundColor Yellow