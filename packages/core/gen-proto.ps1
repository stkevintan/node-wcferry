$ErrorActionPreference = "stop"

function New-ProtoDir([string]$p) {
    if (!(Test-Path $p)) {
        New-Item -ItemType Directory -Force -Path $p
    }
    return $p | Resolve-Path
}

$PROTO_DIR = New-ProtoDir "$PSScriptRoot/proto" 
$PROTO_GENERATED = New-ProtoDir "$PSScriptRoot/src/lib/proto-generated" 

# if powershell 5 or pwsh with platform Win32NT
if (!$PSVersionTable.Platform -or ($PSVersionTable.Platform -eq "Win32NT")) {
    $ext = ".cmd"
    $eol = "`r`n"
}
else {
    $ext = ""
    $eol= "`n"
}

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

Start-Process $GRPC_TOOLS_NODE_PROTOC -ArgumentList $arguments -WorkingDirectory $PSScriptRoot -Wait -NoNewWindow

# add @ts-nocheck to the generated files
Get-ChildItem -Path $PROTO_GENERATED -Filter *.ts -Recurse | ForEach-Object {
    # Read the current contents of the file
    $contents = Get-Content $_.FullName -Raw

    # Prepend //@ts-nocheck to the file
    $contents = "//@ts-nocheck $eol" + $contents
 
    # Write the new contents to the file
    Set-Content -Path $_.FullName -Value $contents
}

Write-Host "Done" -f Green