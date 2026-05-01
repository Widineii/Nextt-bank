$ProjectRoot = $PSScriptRoot
$BundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$NodeCommand = "node"

Set-Location -Path $ProjectRoot

if (Test-Path $BundledNode) {
  Write-Host "Usando Node empacotado: $BundledNode"
  & $BundledNode server.js
} else {
  Write-Host "Usando Node do sistema"
  & $NodeCommand server.js
}
