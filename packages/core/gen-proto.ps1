#Requires -Version 7

$ErrorActionPreference = "stop"

function New-ProtoDir([string]$p) {
    if (!(Test-Path $p)) {
        New-Item -ItemType Directory -Force -Path $p
    }
    return $p | Resolve-Path
}

$PROTO_DIR = New-ProtoDir "$PSScriptRoot/.proto"
$PROTO_GENERATED = New-ProtoDir "$PSScriptRoot/src/lib/proto-generated" 

# if powershell 5 or pwsh with platform Win32NT
if (!$PSVersionTable.Platform -or ($PSVersionTable.Platform -eq "Win32NT")) {
    $ext = ".cmd"
    $eol = "`r`n"
}
else {
    $ext = ""
    $eol = "`n"
}

function Get-Pbs {
    Write-Host Downloading latest pb files
    $PROTO_LINKS = @(
        'https://raw.githubusercontent.com/lich0821/WeChatFerry/master/WeChatFerry/rpc/proto/wcf.proto',
        'https://raw.githubusercontent.com/lich0821/WeChatFerry/master/clients/python/roomdata.proto'
    )

    $PROTO_LINKS | ForEach-Object {
        # Download the content
        $response = Invoke-WebRequest -Uri $_

        # Get the filename from the URL
        $filename = [System.IO.Path]::GetFileName($_)

        $updatedContent = $response.Content -Replace '(uint64.*?);', '${1} [jstype = JS_STRING];'

        # Save the updated content to a file, using the filename from the URL
        $updatedContent | Set-Content -Path "$PROTO_DIR/$filename"
    }
}

function Invoke-ProtoGen {
    Write-Host Compiling pb into ts files
    $PROTOC_GEN_TS_PATH = "$PSScriptRoot/node_modules/.bin/protoc-gen-ts$ext" | Resolve-Path
    $GRPC_TOOLS_NODE_PROTOC_PLUGIN = "$PSScriptRoot/node_modules/.bin/grpc_tools_node_protoc_plugin$ext" | Resolve-Path
    $GRPC_TOOLS_NODE_PROTOC = "$PSScriptRoot/node_modules/.bin/grpc_tools_node_protoc$ext" | Resolve-Path

    # Generate ts codes for each .proto file using the grpc-tools for Node.
    $arguments = @(
        "--plugin=protoc-gen-grpc=$GRPC_TOOLS_NODE_PROTOC_PLUGIN",
        "--plugin=protoc-gen-ts=$PROTOC_GEN_TS_PATH",
        # "--js_out=import_style=commonjs,binary:$PROTO_DIR",
        "--ts_out=$PROTO_GENERATED",
        "--grpc_out=grpc_js:$PROTO_GENERATED",
        "--proto_path=$PROTO_DIR",
        "$PROTO_DIR/*.proto"
    )

    $proc = Start-Process $GRPC_TOOLS_NODE_PROTOC -ArgumentList $arguments -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru
    $proc.WaitForExit()
}

function Set-LintIgnore {
    Write-Host "Prepending eslint-disable and @ts-nocheck"

    # add @ts-nocheck to the generated files
    Get-ChildItem -Path $PROTO_GENERATED -Filter *.ts -Recurse | ForEach-Object {
        # Read the current contents of the file
        $contents = Get-Content $_.FullName -Raw

        # Prepend //@ts-nocheck to the file
        $contents = "/* eslint-disable */ $eol //@ts-nocheck $eol" + $contents
 
        # Write the new contents to the file
        Set-Content -Path $_.FullName -Value $contents
    }
}
Get-Pbs
Invoke-ProtoGen
Set-LintIgnore

Write-Host "Done" -f Green