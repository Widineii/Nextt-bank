@echo off
echo Encerrando servidores locais do Nexttt Bank na porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F
)
echo Pronto.
pause
