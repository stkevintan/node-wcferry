import { mkdirSync } from "fs";
import { tmpdir } from "os";
import path from "path";

export function sleep(ms = 1000) {
    return new Promise<void>((res) => setTimeout(() => res(), ms));
}

export function ensureDirSync(dir: string) {
    try {
        mkdirSync(dir, { recursive: true });
    } catch {
        // noop
    }
}

export function createTmpDir(name = "wcferry") {
    return path.join(tmpdir(), name);
}

export function uint8Array2str(arr: Uint8Array) {
    return Buffer.from(arr).toString();
}
