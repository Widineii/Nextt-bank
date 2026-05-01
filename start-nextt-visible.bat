@echo off
cd /d "%~dp0"
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
echo Nexttt Bank
echo.
echo Deixe esta janela aberta enquanto usa o site.
echo URL: http://localhost:3000/?v=5
echo.
if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" server.js
) else (
  node server.js
)
pause
