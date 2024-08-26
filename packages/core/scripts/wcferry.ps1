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

$Debug = $false
if ($env:DEBUG) {
  $Debug = $true
}

Write-Host "Checking existence of sdk.dll ..." -f Cyan
$binary = "$PSScriptRoot\..\.binary\sdk.dll"
$dir = Split-Path $binary

if (!(Test-Path $binary)) {
  Write-Host $dir
  & "$PSScriptRoot\get-release.ps1" $dir
}

$dir = $dir | Resolve-Path
$binary = $binary | Resolve-Path

Write-Host "sdk.dll is located in $binary" -f Green

Write-Host "try to $Verb wcf.exe as administrator" -f Cyan
$escapedBinary = $binary -replace '\\', '\\'

if (-not [System.Management.Automation.PSTypeName]'WcfSdk'.Type) {
  Add-Type @"
  using System;
  using System.Runtime.InteropServices;

  public class WcfSdk {
      [DllImport("$escapedBinary", CallingConvention = CallingConvention.StdCall)]
      public static extern int WxInitSDK(bool initValue, int someInt);

      [DllImport("$escapedBinary", CallingConvention = CallingConvention.StdCall)]
      public static extern void WxDestroySDK();
  }
"@
}
else {
  Write-Host "WcfSdk type already exists, reusing it."
}

if ($Verb -eq 'start') {
  [WcfSdk]::WxInitSDK($Debug, 10086)
}
else {
  [WcfSdk]::WxDestroySDK()
}
