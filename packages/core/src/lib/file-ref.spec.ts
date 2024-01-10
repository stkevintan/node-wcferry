import { lstat, rm } from "fs/promises";
import { createTmpDir, ensureDirSync } from "./utils";
import path from "path";
import { FileRef } from "./file-ref";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

describe("file-ref", () => {
    const cacheDir = createTmpDir("wcferry-test");
    const testImagePath = path.join(
        __dirname,
        "../../fixtures/test_image.jpeg"
    );
    const testUrl = `https://avatars.githubusercontent.com/u/5887203`;
    const testBase64 = `data:image/gif;base64,R0lGODlhAQABAAAAACw=`;
    beforeEach(() => {
        ensureDirSync(cacheDir);
    });
    afterEach(async () => {
        await rm(cacheDir, { recursive: true, force: true });
    });

    it("local file", async () => {
        const ref = new FileRef(testImagePath, cacheDir);
        const p = await ref.save();
        const copied = path.join(cacheDir, path.basename(testImagePath));
        expect(p).toBe(copied);
        expect(existsSync(copied)).toBeTruthy();
        const stat = await lstat(copied);
        expect(stat.isSymbolicLink()).toBe(true);
        // duplicated call won't change any thing.
        const p2 = await ref.save(false);
        expect(p2).toBe(copied);
        const stat2 = await lstat(copied);
        expect(stat2.isSymbolicLink()).toBe(true);
        // we have to delete it.
        await ref.del();
        expect(existsSync(copied)).toBeFalsy();
        const p3 = await ref.save(false);
        expect(p3).toBe(copied);
        const stat3 = await lstat(copied);
        expect(stat3.isSymbolicLink()).toBe(false);
    });

    it("url file", async () => {
        const ref = new FileRef(testUrl, cacheDir);
        const p = await ref.save();
        expect(path.dirname(p)).toBe(cacheDir);
        expect(path.basename(p)).toBe(`5887203.jpeg`);
        expect(existsSync(p)).toBeTruthy();
    });

    it("base64 file", async () => {
        const ref = new FileRef(testBase64, cacheDir);
        const p = await ref.save();
        expect(path.dirname(p)).toBe(cacheDir);
        expect(path.basename(p)).toMatch(/.gif$/);
        expect(existsSync(p)).toBeTruthy();
    });

    it("can auto resolve conflicts", async () => {
        const name = randomUUID();
        const ref1 = new FileRef(testBase64, cacheDir, { name });
        const ref2 = new FileRef(testBase64, cacheDir, { name });
        const p1 = await ref1.save();
        const p2 = await ref2.save();
        expect(path.basename(p1)).toBe(`${name}.gif`);
        expect(path.basename(p2)).toBe(`${name}-1.gif`);
    });
});
