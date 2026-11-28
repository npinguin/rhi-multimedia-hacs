# Only these two functions are visible through the restricted JEA role.
# All configuration is local, administrator-owned and never remotely writable.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot 'NativeApi.ps1')
$script:Config = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'configuration.json') -Raw | ConvertFrom-Json
$script:TaskPath = '\RobotixMultimedia\'

function Get-RhiReadyTask {
    param([string]$Name)
    $task = Get-ScheduledTask -TaskPath $script:TaskPath -TaskName $Name -ErrorAction SilentlyContinue
    return ($null -ne $task -and $task.State -eq 'Ready')
}

function Get-RhiState {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
    $session = [RhiMultimedia.NativeApi]::Session($script:Config.interactive_user)
    $sessionId = [RhiMultimedia.NativeApi]::ConsoleSession()
    $processes = @{}
    $actions = @()
    $keys = @()
    $launchApps = @()
    if ($script:Config.allow_shutdown) { $actions += 'shutdown' }
    if ($script:Config.allow_restart) { $actions += 'restart' }
    if ($session -in @('locked','unlocked')) {
        $currentProcesses = @(Get-Process -ErrorAction Stop | Where-Object { $_.SessionId -eq $sessionId })
        foreach ($app in $script:Config.applications.PSObject.Properties) {
            $matching = @($currentProcesses | Where-Object { $_.ProcessName -eq $app.Value.process })
            $processes[$app.Name] = [int]$matching.Count
        }
    }
    if ($session -eq 'unlocked') {
        foreach ($app in $script:Config.applications.PSObject.Properties) {
            if ($processes.ContainsKey($app.Name) -and (Get-RhiReadyTask ('App_' + $app.Name))) {
                $launchApps += $app.Name
            }
        }
        foreach ($key in $script:Config.keys) {
            if (Get-RhiReadyTask ('Key_' + $key)) { $keys += $key }
        }
        if ($launchApps.Count -gt 0) { $actions += 'launch' }
        if ($keys.Count -gt 0) { $actions += 'key' }
    }
    return @{
        computer_name = [string]$os.CSName
        boot_id = $os.LastBootUpTime.ToUniversalTime().ToString('o')
        session = $session
        processes = $processes
        actions = @($actions)
        keys = @($keys)
        launch_apps = @($launchApps)
    }
}

function Get-RhiComputerState {
    [CmdletBinding()]param()
    $state = Get-RhiState
    return ($state | ConvertTo-Json -Depth 4 -Compress)
}

function Invoke-RhiComputerAction {
    [CmdletBinding()]param(
        [Parameter(Mandatory=$true)][ValidateSet('shutdown','restart','launch','key')][string]$Action,
        [ValidatePattern('^[A-Za-z0-9_]{1,40}$')][string]$Value
    )
    $state = Get-RhiState
    if ($state.actions -cnotcontains $Action) { throw 'Native action is not currently offered.' }
    switch ($Action) {
        'shutdown' {
            if ($PSBoundParameters.ContainsKey('Value')) { throw 'Unexpected value.' }
            # Native non-forced shutdown, delayed to let the response reach HA.
            $os = Get-CimInstance -ClassName Win32_OperatingSystem
            $result = Invoke-CimMethod -InputObject $os -MethodName Win32ShutdownTracker -Arguments @{Timeout=[uint32]10;Comment='Robotix Multimedia';ReasonCode=[uint32]0;Flags=[int32]1}
            if ($result.ReturnValue -ne 0) { throw 'Windows denied shutdown.' }
        }
        'restart' {
            if ($PSBoundParameters.ContainsKey('Value')) { throw 'Unexpected value.' }
            $os = Get-CimInstance -ClassName Win32_OperatingSystem
            $result = Invoke-CimMethod -InputObject $os -MethodName Win32ShutdownTracker -Arguments @{Timeout=[uint32]10;Comment='Robotix Multimedia';ReasonCode=[uint32]0;Flags=[int32]2}
            if ($result.ReturnValue -ne 0) { throw 'Windows denied restart.' }
        }
        'launch' {
            if ($state.session -ne 'unlocked' -or $state.launch_apps -cnotcontains $Value -or -not (Get-RhiReadyTask ('App_' + $Value))) { throw 'Application or console session unavailable.' }
            Start-ScheduledTask -TaskPath $script:TaskPath -TaskName ('App_' + $Value)
        }
        'key' {
            if ($state.session -ne 'unlocked' -or $state.keys -cnotcontains $Value -or -not (Get-RhiReadyTask ('Key_' + $Value))) { throw 'Input or console session unavailable.' }
            Start-ScheduledTask -TaskPath $script:TaskPath -TaskName ('Key_' + $Value)
        }
    }
    # Task start / native method accepted is not independent effect readback.
    return 'submitted'
}
Export-ModuleMember -Function Get-RhiComputerState,Invoke-RhiComputerAction
