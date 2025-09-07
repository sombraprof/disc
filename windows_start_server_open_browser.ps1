Param(
  [int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 8080 })
)

$ErrorActionPreference = 'Stop'
$ServeDir = $PSScriptRoot

Write-Host "📦 Instalando/Atualizando dependências..."
Push-Location $ServeDir
if (Test-Path (Join-Path $ServeDir 'package-lock.json')) { npm ci } else { npm install }
Pop-Location

Write-Host "📦 Checando build de CSS (Tailwind)"
$npm = Get-Command npm -ErrorAction SilentlyContinue
if ($npm) {
  # Verifica versão do Node (major)
  $nodeOk = $false
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    try {
      $ver = (& node -v) -replace '^v',''
      $major = [int]($ver.Split('.')[0])
      if ($major -ge 14) { $nodeOk = $true }
    } catch {}
  }
  $cssOut = Join-Path $ServeDir 'css/tailwind.css'
  $cssIn = Join-Path $ServeDir 'src/styles/tailwind.css'
  $twCfg = Join-Path $ServeDir 'tailwind.config.cjs'
  $needBuild = -not (Test-Path $cssOut)
  if (-not $needBuild) {
    $outTime = (Get-Item $cssOut).LastWriteTime
    $inTime = (Get-Item $cssIn).LastWriteTime
    $cfgTime = (Get-Item $twCfg -ErrorAction SilentlyContinue)?.LastWriteTime
    if ($inTime -gt $outTime) { $needBuild = $true }
    if ($cfgTime -and ($cfgTime -gt $outTime)) { $needBuild = $true }
  }
  if ($needBuild -and $nodeOk) {
    Write-Host "▶️  Instalando dependências e buildando CSS"
    Push-Location $ServeDir
    if (Test-Path (Join-Path $ServeDir 'package-lock.json')) { npm ci } else { npm install }
    npm run build
    Pop-Location
  } elseif ($needBuild -and -not $nodeOk) {
    Write-Error "Node muito antigo para buildar Tailwind. Atualize para Node 18/20 (winget install OpenJS.NodeJS.LTS) ou use nvm-windows."
    return
  } else {
    Write-Host "✔️  CSS já está atualizado."
  }
} else {
  Write-Warning "npm não encontrado. Pulando build do CSS. (Instale Node.js para buildar o Tailwind)"
}

function Get-FreePort([int]$StartPort) {
  $p = $StartPort
  for ($i=0; $i -le 10; $i++) {
    $inUse = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if (-not $inUse) { return $p }
    $p++
  }
  return $StartPort
}

$Port = Get-FreePort $Port
Write-Host "🚀 Subindo servidor HTTP estático na porta $Port"

Start-Job -ScriptBlock {
  param($ServeDir, $Port)
  python -m http.server $Port --bind 127.0.0.1 --directory (Join-Path $ServeDir 'dist') --cgi
} -ArgumentList $ServeDir, $Port | Out-Null

Start-Sleep -Seconds 1
$Url = "http://127.0.0.1:$Port/index.html"
Write-Host "🌐 Servindo em: $Url"

try {
    $firefox = Get-Command firefox -ErrorAction SilentlyContinue
    if ($firefox) {
        Start-Process firefox -ArgumentList "-private-window", $Url
    } else {
        Start-Process $Url
    }
} catch {
  Write-Host "Firefox não encontrado e não foi possível abrir o navegador padrão."
  Write-Host "Abra manualmente: $Url"
}

Write-Host "Pressione Ctrl+C para encerrar."
Wait-Job | Out-Null
