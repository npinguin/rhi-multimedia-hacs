# Finite native task, run as the explicitly configured interactive user.
# The JEA endpoint cannot supply an executable, script, path or arguments.
param(
    [Parameter(Mandatory=$true)][ValidateSet('launch','key')][string]$Action,
    [Parameter(Mandatory=$true)][ValidatePattern('^[A-Za-z0-9_]{1,40}$')][string]$Value
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot 'NativeApi.ps1')
$config = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'configuration.json') -Raw | ConvertFrom-Json
if (-not [RhiMultimedia.NativeApi]::InteractiveDesktop($config.interactive_user)) {
    throw 'The configured user is not on an unlocked console desktop.'
}
if ($Action -eq 'key') {
    if ($config.keys -cnotcontains $Value) { throw 'Input action not configured.' }
    if (-not [RhiMultimedia.NativeApi]::Key($Value, $config.interactive_user)) {
        throw 'Windows did not accept the native input request.'
    }
} else {
    $app = $config.applications.PSObject.Properties[$Value]
    if ($null -eq $app) { throw 'Application not configured.' }
    $existing = @(Get-Process -Name $app.Value.process -ErrorAction SilentlyContinue |
        Where-Object { $_.SessionId -eq [RhiMultimedia.NativeApi]::ConsoleSession() })
    if ($existing.Count -gt 0) { exit 0 }
    # Local administrator-defined path/arguments only. Never interpolate
    # remote command text or invoke a shell.
    if (-not [RhiMultimedia.NativeApi]::InteractiveDesktop($config.interactive_user)) {
        throw 'Interactive desktop changed.'
    }
    if ([string]::IsNullOrEmpty($app.Value.arguments)) {
        Start-Process -FilePath $app.Value.executable
    } else {
        Start-Process -FilePath $app.Value.executable -ArgumentList $app.Value.arguments
    }
}
