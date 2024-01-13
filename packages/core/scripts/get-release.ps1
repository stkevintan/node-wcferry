[CmdletBinding()]
param (
    [Parameter()]
    [string]
    $folder = "$PSScriptRoot\..\.binary"
)

function New-Dir([string]$p) {
    if (!(Test-Path $p)) {
        New-Item -ItemType Directory -Force -Path $p
    }
    return $p | Resolve-Path
}

$folder = New-Dir $folder


$ErrorActionPreference = "stop"

function DownloadLatest() {
    $latest = Invoke-RestMethod -Uri "https://api.github.com/repos/lich0821/WeChatFerry/releases/latest"
    $turl = $latest.assets[0].browser_download_url
    Write-Host Get latest release download link: $turl -f Cyan
    # Get the filename from the URL
    $filename = [System.IO.Path]::GetFileName($turl)
    $output = "$folder\$filename"
    if (Test-Path $output) {
        Write-Host "File already exists." -f Yellow
    }
    else {
        Invoke-WebRequest -Uri $turl -OutFile $output
    }
    Write-Host "Downloaded to $output" -f Cyan
    return $output
}

function Unzip([string] $zip, [string] $dest = $folder) {
    Expand-Archive -Force -Path $zip -DestinationPath $dest
}

$out = DownloadLatest
Unzip $out
Remove-Item -Force $out



