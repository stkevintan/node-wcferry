import { lstat, rm } from 'fs/promises';
import { createTmpDir, ensureDirSync } from './utils';
import path from 'path';
import { FileRef } from './file-ref';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

describe('file-ref', () => {
    const cacheDir = createTmpDir('wcferry-test');
    const testImagePath = path.join(
        __dirname,
        '../../fixtures/test_image.jpeg'
    );
    const testUrl = `https://avatars.githubusercontent.com/u/5887203`;
    const testBase64 = Buffer.from(`R0lGODlhAQABAAAAACw=`, 'base64');
    beforeEach(() => {
        ensureDirSync(cacheDir);
    });
    afterEach(async () => {
        await rm(cacheDir, { recursive: true, force: true });
    });

    it('save local file', async () => {
        const ref = new FileRef(testImagePath);
        const p = await ref.save(cacheDir);
        const copied = path.join(cacheDir, path.basename(testImagePath));
        expect(p.path).toBe(copied);
        expect(existsSync(copied)).toBeTruthy();
        const stat = await lstat(copied);
        expect(stat.isSymbolicLink()).toBe(true);
        await p.discard();
        const p2 = await ref.save(cacheDir, false);
        expect(p2.path).toBe(copied);
        const stat3 = await lstat(copied);
        expect(stat3.isSymbolicLink()).toBe(false);
    });

    it('save url', async () => {
        const ref = new FileRef(testUrl);
        const p = await ref.save(cacheDir);
        expect(path.dirname(p.path)).toBe(cacheDir);
        expect(path.basename(p.path)).toBe(`5887203.jpeg`);
        expect(existsSync(p.path)).toBeTruthy();
    });

    it('save base64', async () => {
        const ref = new FileRef(testBase64);
        const ref2 = new FileRef(testBase64, {
            name: 'image.gif',
        });
        const p = await ref.save(cacheDir);
        const p2 = await ref2.save(cacheDir);
        expect(path.dirname(p.path)).toBe(cacheDir);
        expect(path.basename(p.path)).toMatch(/.dat$/);
        expect(path.extname(p2.path)).toBe('.gif');
        expect(existsSync(p.path)).toBeTruthy();
    });

    it('can auto resolve conflicts', async () => {
        const name = randomUUID();
        const ref = new FileRef(testBase64, { name });
        const p1 = await ref.save(cacheDir);
        const p2 = await ref.save(cacheDir);
        expect(path.basename(p1.path, '.dat')).toBe(name);
        expect(path.basename(p2.path, '.dat')).toBe(`${name}-1`);
    });

    it('should error when location is invalid', async () => {
        const ref = new FileRef(randomUUID());
        await expect(ref.save(cacheDir)).rejects.toThrow();
        const ref2 = new FileRef(`http://${randomUUID()}`);
        await expect(ref2.save(cacheDir)).rejects.toThrow();
    })
});
