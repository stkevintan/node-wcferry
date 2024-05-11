[CmdletBinding()]
param (
    [Parameter()]
    [string]
    $folder = "$PSScriptRoot\..\.binary"
)

# 检查文件夹是否存在
if (-not (Test-Path $folder)) {
    # 如果不存在，则创建文件夹
    $null = New-Item -Path $folder -ItemType Directory
}


$ErrorActionPreference = "stop"

function DownloadLatest() {
    $latest = Invoke-RestMethod -Uri "https://api.github.com/repos/lich0821/WeChatFerry/releases/latest"
    $repourl = $latest.assets[0].browser_download_url
    $turl = "https://ghproxy.org/$repourl"
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



