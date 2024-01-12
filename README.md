# Wcferry

[![CI](https://github.com/stkevintan/node-wcferry/actions/workflows/ci.yml/badge.svg)](https://github.com/stkevintan/node-wcferry/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@wcferry%2Fcore.svg)](https://badge.fury.io/js/@wcferry%2Fcore)

## Packages

1. [@wcferry/core](./packages/core): The native wcferry RPC client
2. [@wcferry/ws](./packages/ws): A tiny websocket server built upon the core lib

### Debug

Debuging is provided by https://www.npmjs.com/package/debug

Set environment `DEBUG` to `wcferry:*` to enable debugging logs

## Running tasks

To execute tasks with Nx use the following syntax:

```
nx <target> <project> <...options>
```

You can also run multiple targets:

```
nx run-many -t <target1> <target2>
```

..or add `-p` to filter specific projects

```
nx run-many -t <target1> <target2> -p <proj1> <proj2>
```

Targets can be defined in the `package.json` or `projects.json`. Learn more [in the docs](https://nx.dev/core-features/run-tasks).

## Regenerate protobuf files

Run `nx build:proto core` to build latest pb to `src/lib/proto-generated/`
