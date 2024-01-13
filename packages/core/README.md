# @wcferry/core

A node impl of wcferry nanomsg clients

## Install

```
npm i @wcferry/core
```

### Usage

```ts
import { Wcferry } from '@wcferry/core';

const client = new Wcferry({ port: 10086 });
client.start();

const isLogin = client.isLogin();

// start receiving message
const off = client.on((msg) => {
    console.log('received message:', msg);
});

// stop reciving message
off();

// close
client.stop();
```

## Building

Run `nx build core` to build the library.

## Get latest wcferry release (wcf.exe, \*.dll)

Run `nx build:dll core` to download and unzip latest wcferry components into `.binary/`

## Regenerate protobuf files

Run `nx build:proto core` to build latest pb to `src/lib/proto-generated/`

## Running unit tests

Run `nx test core` to execute the unit tests via [Vitest](https://vitest.dev/).
