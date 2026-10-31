param(
  [ValidateSet('inspect','stop')][string]$Action = 'inspect',
  [string]$Ports = '5173,3000',
  [int]$TargetPid = 0,
  [string]$Started = '',
  [string]$ProjectRoot = ''
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
function Read-Processes {
  @(Get-CimInstance Win32_Process | ForEach-Object {
    if ($null -eq $_.CreationDate) { return }
    [pscustomobject]@{ id=[int]$_.ProcessId; parent=[int]$_.ParentProcessId; name=$_.Name; started=$_.CreationDate.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.ffffffZ'); command=$_.CommandLine }
  })
}
function Normalize([string]$Value) { ($Value -replace '\\+','/').ToLowerInvariant() }
function Is-Internal($Process) {
  $Process.command -match 'kernel\.js|trusted-worker|cua-repl|artifact-tool|launch_codex|Microsoft VS Code|[\\/]Code\.exe'
}
function Is-Anchor($Process,[string]$Root) {
  if ((Is-Internal $Process) -or $Process.name -notin @('node.exe','powershell.exe','pwsh.exe')) { return $false }
  $prefix = (Normalize $Root).TrimEnd('/') + '/'
  foreach ($match in [regex]::Matches($Process.command,'"([^"]+)"|(\S+)')) {
    $value = if ($match.Groups[1].Success) { $match.Groups[1].Value } else { $match.Groups[2].Value }
    $token = Normalize $value
    if ($token.StartsWith($prefix) -and $token -match '/(vite/bin/vite\.js|typescript/bin/tsc|concurrently/dist/bin/index\.js|scripts/dev-job\.ps1|apps/api/dist/main\.js)$') { return $true }
  }
  return $false
}
$processes = Read-Processes
if ($Action -eq 'inspect') {
  $portNumbers = @($Ports.Split(',') | ForEach-Object { [int]$_ })
  $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in $portNumbers } | ForEach-Object {
    [pscustomobject]@{port=[int]$_.LocalPort; id=[int]$_.OwningProcess; address=$_.LocalAddress}
  })
  [pscustomobject]@{processes=@($processes); listeners=@($listeners)} | ConvertTo-Json -Depth 5 -Compress
  exit 0
}
# Recovery is deliberately explicit: PID + creation time + project anchor, never PID alone.
$resolvedRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$target = $processes | Where-Object id -eq $TargetPid
if (-not $target) { Write-Output 'El proceso seleccionado ya terminó.'; exit 0 }
if ($target.started -ne $Started -or -not (Is-Anchor $target $resolvedRoot)) { throw 'Identidad no verificable; no se detuvo ningún proceso.' }
$ids = [Collections.Generic.HashSet[int]]::new()
[void]$ids.Add($TargetPid)
do {
  $added = $false
  foreach ($item in $processes) {
    $parent = $processes | Where-Object id -eq $item.parent
    if ($ids.Contains($item.parent) -and $parent -and $item.started -ge $parent.started -and $ids.Add($item.id)) { $added = $true }
  }
} while ($added)
if (@($processes | Where-Object { $ids.Contains($_.id) -and ((Is-Internal $_) -or $_.name -notin @('node.exe','cmd.exe','powershell.exe','pwsh.exe','esbuild.exe','rolldown.exe')) }).Count) { throw 'Descendiente inesperado; cierre rechazado.' }
$current = Get-CimInstance Win32_Process -Filter "ProcessId = $TargetPid"
if (-not $current) { exit 0 }
if ($current.CreationDate.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.ffffffZ') -ne $Started -or $current.CommandLine -ne $target.command) { throw 'El PID cambió; cierre rechazado.' }
& "$env:SystemRoot\System32\taskkill.exe" /PID $TargetPid /T /F
if ($LASTEXITCODE -ne 0) { throw 'No se pudo completar el cierre seleccionado.' }
