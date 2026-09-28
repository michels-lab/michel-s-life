@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo   MICHEL'S LIFE - LOCAL WINDOWS BUILDER
echo   No GitHub Actions. No GitHub billing.
echo ============================================================
echo.

where pwsh.exe >nul 2>nul
if %ERRORLEVEL%==0 (
  pwsh.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\build_windows_local.ps1"
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\build_windows_local.ps1"
)

set "BUILD_EXIT=%ERRORLEVEL%"
echo.
if not "%BUILD_EXIT%"=="0" (
  echo ============================================================
  echo   BUILD FAILED - see the error above.
  echo ============================================================
  pause
  exit /b %BUILD_EXIT%
)

echo ============================================================
echo   BUILD COMPLETE
echo   Open the local-release folder to get the installer.
echo ============================================================
pause
exit /b 0
