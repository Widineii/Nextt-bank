$ProjectRoot = $PSScriptRoot
$BundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$NodeExe = if (Test-Path $BundledNode) { $BundledNode } else { "node" }
$Url = "http://localhost:3000/?v=5"

Set-Location -Path $ProjectRoot

Write-Host "Nexttt Bank"
Write-Host "Esta janela precisa ficar aberta."
Write-Host "Servidor: http://localhost:3000"
Write-Host ""

Start-Job -ScriptBlock {
  param($Url)
  Start-Sleep -Seconds 4
  Start-Process $Url
} -ArgumentList $Url | Out-Null

& $NodeExe "server.js"
