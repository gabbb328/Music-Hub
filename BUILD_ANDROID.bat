@echo off
echo ============================================
echo  Music Hub - Android Build ^& Studio
echo ============================================
echo.

echo [1/5] Building production bundle...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/5] Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [3/5] Copying assets...
call npx cap copy android

echo.
echo [4/5] Updating Android project...
call npx cap update android

echo.
echo [5/5] Opening Android Studio...
call npx cap open android

echo.
echo ============================================
echo  Android Studio should open now!
echo  Build APK: Build ^> Build Bundle/APK ^> Build APK
echo ============================================
pause
