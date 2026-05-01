@echo off
cd /d "%~dp0"
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "URL=http://localhost:3000/?v=5"

echo ===============================================
echo Nexttt Bank
echo ===============================================
echo.
echo 1. Esta janela precisa ficar aberta.
echo 2. Aguarde aparecer: Nexttt Bank rodando em http://localhost:3000
echo 3. Se o navegador nao abrir, acesse manualmente:
echo    %URL%
echo.

start "" cmd /c "timeout /t 4 /nobreak >nul && start "" "%URL%""

if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" server.js
) else (
  node server.js
)

echo.
echo O servidor foi encerrado.
echo Se apareceu algum erro acima, envie uma captura dessa janela.
pause
