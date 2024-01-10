# Wcferry

[![CI](https://github.com/stkevintan/node-wcferry/actions/workflows/ci.yml/badge.svg)](https://github.com/stkevintan/node-wcferry/actions/workflows/ci.yml) 
[![npm version](https://badge.fury.io/js/@wcferry%2Fcore.svg)](https://badge.fury.io/js/@wcferry%2Fcore)

A node impl of wcferry nanomsg clients:

1. core: the main lib of wcferry
2. ws: a websocket api server (WIP)
3. http: a http api server (WIP)

## Install
```
npm i @wcferry/core
```

### Usage
```ts
import { Wcferry } from '@wcferry/core'

const client = new Wcferry({ port: 10086 });
client.start();

const isLogin = client.isLogin();

// start receiving message
const off = client.on((msg) => {
    console.log("received message:", msg);
});

// stop reciving mmessage
off();

// close
client.stop();
```

### Debug
Debug messages are produced by https://www.npmjs.com/package/debug

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
