[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [ValidateSet('start', 'stop')]
    [string]
    $Verb,
    [Parameter(Mandatory = $false)]
    [int]
    $Port = 10086
)

$ErrorActionPreference = "stop"

$Debug = ""
if ($env:DEBUG) {
    $Debug = "debug"
}

Write-Host "Checking existence of wcf.exe ..." -f Cyan
$binary = "$PSScriptRoot\..\.binary\wcf.exe"
$dir = Split-Path $binary

if (!(Test-Path $binary)) {
    Write-Host $dir
    & "$PSScriptRoot\get-release.ps1" $dir
}

$dir = $dir | Resolve-Path
$binary = $binary | Resolve-Path

Write-Host "wcf.exe is located in $binary" -f Green

if ($Verb -eq 'start') {
    $arguments = "start", "$Port"
    if (-not [string]::IsNullOrEmpty($Debug)) {
        $arguments += "$Debug"
    }
}
else {
    $arguments = "stop"
}

Write-Host "try to $Verb wcf.exe as administrator" -f Cyan
$proc = Start-Process -FilePath "$binary" -ArgumentList $arguments -Verb RunAs -Wait -PassThru -WorkingDirectory $dir -WindowStyle Hidden

if ( $proc.ExitCode -ne 0) {
    Write-Host "wcferry.exe exited abnormally" -f Red
    exit $proc.ExitCode
}