param(
    [Parameter(Mandatory = $true)]
    [string]$ExePath,

    [int]$MinimumAliveSeconds = 8,

    [int]$WindowTimeoutSeconds = 20,

    [string]$EvidencePath = ""
)

$ErrorActionPreference = 'Stop'

$exe = (Resolve-Path $ExePath).Path
$exeName = [System.IO.Path]::GetFileName($exe)
$started = Get-Date
$process = $null

function Write-StartupEvidence {
    param(
        [string]$Reason,
        [System.Diagnostics.Process]$Process
    )

    Write-Host "---- Windows startup evidence ----"
    Write-Host "Executable: $exe"
    Write-Host "Reason: $Reason"
    Write-Host "Started: $($started.ToString('o'))"

    if ($null -ne $Process) {
        try {
            $Process.Refresh()
            Write-Host "HasExited: $($Process.HasExited)"
            if ($Process.HasExited) {
                Write-Host "ExitCode: $($Process.ExitCode)"
            } else {
                Write-Host "ProcessId: $($Process.Id)"
                Write-Host "MainWindowHandle: $($Process.MainWindowHandle)"
            }
        } catch {
            Write-Host "Process evidence unavailable: $($_.Exception.Message)"
        }
    }

    try {
        $events = Get-WinEvent -FilterHashtable @{
            LogName = 'Application'
            StartTime = $started.AddSeconds(-3)
        } -ErrorAction SilentlyContinue |
            Where-Object {
                $_.ProviderName -in @('Application Error', '.NET Runtime', 'Windows Error Reporting') -or
                ($_.Message -and $_.Message -match [regex]::Escape($exeName))
            } |
            Select-Object -First 20

        if ($events) {
            Write-Host "---- Relevant Windows Application events ----"
            $events | Format-List TimeCreated, ProviderName, Id, LevelDisplayName, Message
        } else {
            Write-Host "No matching Windows Application/.NET crash events were found."
        }
    } catch {
        Write-Host "Windows Event Log query failed: $($_.Exception.Message)"
    }

    Write-Host "----------------------------------"
}

try {
    Write-Host "Launching $exe"
    $process = Start-Process -FilePath $exe -PassThru

    $windowDeadline = (Get-Date).AddSeconds($WindowTimeoutSeconds)
    $windowSeen = $false

    while ((Get-Date) -lt $windowDeadline) {
        Start-Sleep -Milliseconds 500
        $process.Refresh()

        if ($process.HasExited) {
            Write-StartupEvidence -Reason "Process exited before startup validation completed." -Process $process
            throw "$exeName exited during startup with code $($process.ExitCode)."
        }

        if ($process.MainWindowHandle -ne 0) {
            $windowSeen = $true
            break
        }
    }

    if (-not $windowSeen) {
        Write-StartupEvidence -Reason "No top-level window appeared within $WindowTimeoutSeconds seconds." -Process $process
        throw "$exeName stayed alive but never exposed a real top-level window."
    }

    $elapsed = ((Get-Date) - $started).TotalSeconds
    if ($elapsed -lt $MinimumAliveSeconds) {
        Start-Sleep -Milliseconds ([int](($MinimumAliveSeconds - $elapsed) * 1000))
    }

    $process.Refresh()
    if ($process.HasExited) {
        Write-StartupEvidence -Reason "Process exited before minimum alive interval completed." -Process $process
        throw "$exeName exited during the minimum alive interval with code $($process.ExitCode)."
    }

    # Owner regression: minimizing used to hide the form and relaunching
    # the EXE created another process/document. Exercise the actual HWND.
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MlvWindowSmoke {
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hwnd, int cmd);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
}
'@
    $originalHandle = $process.MainWindowHandle
    $originalId = $process.Id
    [void][MlvWindowSmoke]::ShowWindow($originalHandle, 6)
    Start-Sleep -Milliseconds 700
    $process.Refresh()
    if ($process.HasExited -or -not [MlvWindowSmoke]::IsIconic($originalHandle) -or -not [MlvWindowSmoke]::IsWindowVisible($originalHandle)) {
        throw "Minimize regression: original window exited or was hidden from taskbar."
    }
    $second = Start-Process -FilePath $exe -PassThru
    try {
        if (-not $second.WaitForExit(12000)) { throw "Relaunch created a second persistent instance." }
        if ($second.ExitCode -ne 0) { throw "Second launcher exited with code $($second.ExitCode)." }
        $restoreDeadline = (Get-Date).AddSeconds(12)
        do {
            Start-Sleep -Milliseconds 300
            $process.Refresh()
            if ($process.HasExited) { throw "Original process exited during restore." }
            $restored = (-not [MlvWindowSmoke]::IsIconic($originalHandle)) -and [MlvWindowSmoke]::IsWindowVisible($originalHandle)
        } until ($restored -or (Get-Date) -ge $restoreDeadline)
        if (-not $restored -or $process.Id -ne $originalId -or $process.MainWindowHandle -ne $originalHandle) {
            throw "Relaunch did not restore the exact original window/process."
        }
    } finally {
        if (-not $second.HasExited) { $second.Kill($true); $second.WaitForExit(5000) | Out-Null }
        $second.Dispose()
    }
    $restoreEvidence = "MINIMIZE/RELAUNCH PASS: original PID=$originalId HWND=$originalHandle restored without second persistent process."
    Write-Host $restoreEvidence

    $message = "LAUNCH PASS: $exeName remained alive for at least $MinimumAliveSeconds seconds and exposed MainWindowHandle=$($process.MainWindowHandle)."
    Write-Host $message

    if (-not [string]::IsNullOrWhiteSpace($EvidencePath)) {
        $parent = Split-Path -Parent $EvidencePath
        if (-not [string]::IsNullOrWhiteSpace($parent)) {
            New-Item -ItemType Directory -Force $parent | Out-Null
        }
        @(
            $message
            $restoreEvidence
            "Executable: $exe"
            "ValidatedAt: $((Get-Date).ToString('o'))"
            "ProcessId: $($process.Id)"
            "MainWindowHandle: $($process.MainWindowHandle)"
        ) | Set-Content -Path $EvidencePath -Encoding utf8
    }
}
finally {
    if ($null -ne $process) {
        try {
            $process.Refresh()
            if (-not $process.HasExited) {
                try { [void]$process.CloseMainWindow() } catch {}
                try { $process.WaitForExit(3000) | Out-Null } catch {}
                $process.Refresh()
                if (-not $process.HasExited) {
                    $process.Kill($true)
                    $process.WaitForExit(5000) | Out-Null
                }
            }
        } catch {
            Write-Host "Process cleanup warning: $($_.Exception.Message)"
        }
        $process.Dispose()
    }
}
