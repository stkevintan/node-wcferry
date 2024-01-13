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


Write-Host "Checking existence of wcf.exe ..." -f Cyan
$binary = "$PWD\wcf.exe"
if (!(Test-Path $binary)) {
    & "$PSScriptRoot\get-release.ps1" $PWD
}

if ($Verb -eq 'start') {
    $arguments = @("start", "$Port")
    if ($env:DEBUG) {
        $arguments += "debug"
    }
}
else {
    $arguments = @("stop")
}

Write-Host "try to $Verb $binary as administrator" -f Cyan
$proc = Start-Process -FilePath "$binary" -ArgumentList $arguments -Verb RunAs -Wait -PassThru

if ( $proc.ExitCode -ne 0) {
    Write-Host "wcferry.exe exited abnormally" -f Red
    exit $proc.ExitCode
}
exit 0