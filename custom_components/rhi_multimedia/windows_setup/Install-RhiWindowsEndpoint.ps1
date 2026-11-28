# Run locally in elevated Windows PowerShell 5.1 on the approved test PC.
# Does not create accounts, change listener/firewall/certificates, install a
# service/agent, or broaden an existing endpoint. Review local configuration first.
# The operator group is for JEA virtual accounts only, not Administrators.
[CmdletBinding(SupportsShouldProcess=$true)]
param(
    [Parameter(Mandatory=$true)][string]$ConfigPath,
    [Parameter(Mandatory=$true)][ValidatePattern('^[A-Za-z0-9_.-]{1,20}$')][string]$RemoteAccount,
    [Parameter(Mandatory=$true)][string]$OperatorGroup,
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$')][string]$Endpoint = 'RhiMultimedia'
)
#requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if ($Endpoint -match '^(Microsoft\.PowerShell|PowerShell\.)') { throw 'Use a dedicated restricted endpoint.' }
if ($PSVersionTable.PSEdition -ne 'Desktop') { throw 'Use Windows PowerShell 5.1.' }
$keys = @('UP','DOWN','LEFT','RIGHT','ENTER','ESC','TAB','SPACE','HOME','END','PAGEUP','PAGEDOWN','BACKSPACE','DELETE') +
    @(0..9 | ForEach-Object { [string]$_ }) + @(1..12 | ForEach-Object { 'F' + $_ }) +
    @('MOUSE_UP','MOUSE_DOWN','MOUSE_LEFT','MOUSE_RIGHT','MOUSE_CLICK','MOUSE_RIGHT_CLICK','PLAY_PAUSE','VOLUME_UP','VOLUME_DOWN','MUTE','DISPLAY_OFF')
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$fields = @($config.PSObject.Properties.Name)
if (@(Compare-Object -ReferenceObject @('interactive_user','applications','keys','allow_shutdown','allow_restart') -DifferenceObject $fields).Count -ne 0) {
    throw 'Configuration requires interactive_user, applications, keys, allow_shutdown, allow_restart only.'
}
if ($config.interactive_user -notmatch '^[^\\]+\\[^\\]+$' -or $config.allow_shutdown -isnot [bool] -or $config.allow_restart -isnot [bool]) {
    throw 'Use an exact interactive DOMAIN\user and explicit boolean power permissions.'
}
# Resolve the actual task principal now, rather than silently registering an alias.
$null = ([System.Security.Principal.NTAccount]::new([string]$config.interactive_user)).Translate([System.Security.Principal.SecurityIdentifier])
if ($config.keys -isnot [array] -or @($config.keys | Select-Object -Unique).Count -ne $config.keys.Count) { throw 'Keys must be a unique array.' }
foreach ($key in $config.keys) { if ($key -isnot [string] -or $keys -cnotcontains $key) { throw 'Unsupported input action.' } }
if ($config.applications -isnot [pscustomobject] -or @($config.applications.PSObject.Properties).Count -gt 24) { throw 'Applications must be a map of at most 24 entries.' }
foreach ($app in $config.applications.PSObject.Properties) {
    if ($app.Name -cnotmatch '^[a-z][a-z0-9_]{0,39}$' -or
        @(Compare-Object -ReferenceObject @('process','executable','arguments') -DifferenceObject @($app.Value.PSObject.Properties.Name)).Count -ne 0 -or
        $app.Value.process -notmatch '^[A-Za-z0-9_. -]{1,80}$' -or
        $app.Value.executable -isnot [string] -or $app.Value.executable -notmatch '^[A-Za-z]:\\' -or
        -not (Test-Path -LiteralPath $app.Value.executable -PathType Leaf) -or
        $app.Value.arguments -isnot [string]) {
        throw 'Each application needs an exact local executable, process name without .exe and arguments string.'
    }
}
$remote = Get-LocalUser -Name $RemoteAccount
$operators = Get-LocalGroup -Name $OperatorGroup
$admins = Get-LocalGroup -SID 'S-1-5-32-544'
if ($operators.SID -eq $admins.SID -or
    @(Get-LocalGroupMember -Group $admins.Name | Where-Object SID -eq $remote.SID).Count -gt 0 -or
    @(Get-LocalGroupMember -Group $operators.Name).Count -gt 0) {
    throw 'Use a non-admin dedicated remote account and an empty, separate local JEA virtual-account group.'
}
$module = Join-Path $env:ProgramFiles 'WindowsPowerShell\Modules\RhiMultimedia'
if ((Test-Path -LiteralPath $module) -or (Get-PSSessionConfiguration -Name $Endpoint -ErrorAction SilentlyContinue)) {
    throw 'An existing Robotix module or endpoint must be reviewed before replacement.'
}
$taskService = New-Object -ComObject 'Schedule.Service'
$taskService.Connect()
$rootFolder = $taskService.GetFolder('\')
$folderName = 'RobotixMultimedia'
if (@($rootFolder.GetFolders(0) | Where-Object Name -eq $folderName).Count -gt 0) {
    throw 'Existing Robotix task folder must be reviewed before replacement.'
}
if (-not $PSCmdlet.ShouldProcess($env:COMPUTERNAME, 'Install restricted JEA role and finite interactive tasks')) { return }
New-Item -ItemType Directory -Path $module | Out-Null
foreach ($name in @('RhiMultimedia.psm1','NativeApi.ps1','Invoke-RhiInteractive.ps1')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $module
}
$config | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $module 'configuration.json') -Encoding UTF8
New-ModuleManifest -Path (Join-Path $module 'RhiMultimedia.psd1') -RootModule 'RhiMultimedia.psm1' -ModuleVersion '1.0.0' -FunctionsToExport @('Get-RhiComputerState','Invoke-RhiComputerAction') -CmdletsToExport @() -VariablesToExport @() -AliasesToExport @()
$roles = New-Item -ItemType Directory -Path (Join-Path $module 'RoleCapabilities')
New-PSRoleCapabilityFile -Path (Join-Path $roles.FullName 'RhiMultimediaOperator.psrc') -ModulesToImport 'RhiMultimedia' -VisibleFunctions @('Get-RhiComputerState','Invoke-RhiComputerAction')

# Preserve existing Task Scheduler ACLs and add only read/execute for the
# dedicated virtual-account group. No write/delete/full-control rights.
$folder = $rootFolder.CreateFolder($folderName,$null)
function Grant-TaskReadExecute($item) {
    $sddl = $item.GetSecurityDescriptor(4)
    $ace = '(A;;GRGX;;;' + $operators.SID.Value + ')'
    if (-not $sddl.Contains($ace)) { $item.SetSecurityDescriptor($sddl + $ace,0) }
}
Grant-TaskReadExecute $folder
$taskPath = '\RobotixMultimedia\'
$principal = New-ScheduledTaskPrincipal -UserId $config.interactive_user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Seconds 30)
$scriptFile = Join-Path $module 'Invoke-RhiInteractive.ps1'
function Register-RhiTask([string]$name,[string]$action,[string]$value) {
    $arguments = '-NoLogo -NoProfile -NonInteractive -File "' + $scriptFile + '" -Action ' + $action + ' -Value ' + $value
    $taskAction = New-ScheduledTaskAction -Execute (Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe') -Argument $arguments
    Register-ScheduledTask -TaskPath $taskPath -TaskName $name -Action $taskAction -Principal $principal -Settings $settings | Out-Null
    Grant-TaskReadExecute ($folder.GetTask($name))
}
foreach ($key in $config.keys) { Register-RhiTask ('Key_' + $key) 'key' $key }
foreach ($app in $config.applications.PSObject.Properties) { Register-RhiTask ('App_' + $app.Name) 'launch' $app.Name }

$roleDefinitions = @{}
$roleDefinitions[$env:COMPUTERNAME + '\' + $RemoteAccount] = @{ RoleCapabilities = 'RhiMultimediaOperator' }
$pssc = Join-Path $module 'RhiMultimedia.pssc'
New-PSSessionConfigurationFile -Path $pssc -SessionType RestrictedRemoteServer -RunAsVirtualAccount -RunAsVirtualAccountGroups @($OperatorGroup) -RoleDefinitions $roleDefinitions
if (-not (Test-PSSessionConfigurationFile -Path $pssc)) { throw 'Restricted session configuration invalid.' }
Register-PSSessionConfiguration -Name $Endpoint -Path $pssc -Force
Write-Output 'Restricted endpoint and on-demand tasks registered. Verify HTTPS-only access, group rights, native readback and negative tests before use.'
