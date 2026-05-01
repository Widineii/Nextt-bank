@echo off
cd /d "%~dp0"
echo Iniciando Nexttt Bank em http://localhost:3000/?v=5
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" server.js
) else (
  node server.js
)
pause
