import { randomUUID } from "crypto";
import { cp, rm, symlink, writeFile } from "fs/promises";
import mime from "mime";
import path from "path";
import { URL } from "url";
import { ensureDirSync } from "./utils";
import { createWriteStream, existsSync } from "fs";
import assert from "assert";
import type { OutgoingHttpHeaders } from "http";

const headers = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
};

const base64pattern = /^data:(.*);base64,(.*)/;

export interface VirtualFileRef {
    save(): Promise<string>;
    del(): Promise<void>;
}

export class FileRef implements VirtualFileRef {
    /**
     * @param location location of the resource. can be a local path, a link starts with `http(s)://` a base64 string starts with `data:<mimetype>;base64,xxxxx` or another instance of VirtualFileRef
     */
    constructor(
        private readonly location: string | VirtualFileRef,
        private readonly saveDir: string,
        private readonly options: {
            name?: string;
            headers?: OutgoingHttpHeaders;
        } = {}
    ) {
        ensureDirSync(saveDir);
    }

    private isUrl(loc: string) {
        return /^https?:\/\//.test(loc);
    }
    private saved?: string;

    /**
     * save the file into saveDir with name and extension inferred
     * @param useSymLink use symlink instead of copy when location points to a local file.
     * @returns
     */
    async save(useSymLink = true): Promise<string> {
        if (typeof this.location === "object") {
            return await this.location.save();
        }

        if (this.saved) {
            return this.saved;
        }
        if (this.isUrl(this.location)) {
            return await this.saveFromUrl(new URL(this.location));
        }

        const match = this.location.match(base64pattern);
        if (match) {
            return await this.saveFromBase64(match[1], match[2]);
        }

        return await this.saveFromFile(useSymLink);
    }

    async del(): Promise<void> {
        if (typeof this.location === "object") {
            return await this.location.del();
        }
        if (this.saved) {
            await rm(this.saved, { force: true });
            this.saved = undefined;
        }
    }

    private getName(opt?: { mimeType?: string; inferredName?: string }) {
        const basename = this.options.name ?? opt?.inferredName ?? randomUUID();
        let ext = path.extname(basename);
        if (ext) {
            return basename;
        }
        ext = "dat";
        if (opt?.mimeType) {
            ext = mime.getExtension(opt.mimeType) ?? ext;
        }
        return `${basename}.${ext}`;
    }

    private getSavingPath(name: string): string {
        const extname = path.extname(name);
        const basename = path.basename(name, extname);
        for (let i = 0; ; i++) {
            const suffix = i === 0 ? "" : `-${i}`;
            const p = path.join(this.saveDir, `${basename}${suffix}${extname}`);
            if (!existsSync(p)) {
                return p;
            }
        }
    }

    private async saveFromBase64(
        mimeType: string,
        content: string
    ): Promise<string> {
        const binary = Buffer.from(content, "base64").toString("binary");
        const name = this.getName({ mimeType });
        const fullpath = this.getSavingPath(name);
        await writeFile(fullpath, binary, "binary");
        return (this.saved = fullpath);
    }

    private async saveFromUrl(url: URL): Promise<string> {
        const basename = path.basename(url.pathname);
        let fullpath: string | undefined;
        const http =
            url.protocol === "https:"
                ? await import("https")
                : await import("http");
        return await new Promise<string>((resolve, reject) => {
            http.get(url, { headers }, (response) => {
                const probeName =
                    response.headers["content-disposition"]?.match(
                        /attachment; filename="?(.+[^"])"?$/i
                    )?.[1] ?? basename;

                const mimeType = response.headers["content-type"];
                const name = this.getName({
                    mimeType,
                    inferredName: probeName,
                });
                fullpath = this.getSavingPath(name);
                const file = createWriteStream(fullpath);
                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    resolve((this.saved = fullpath!));
                });
            }).on("error", (error) => {
                if (fullpath) {
                    rm(fullpath, { force: true }).finally(() => {
                        reject(error.message);
                    });
                } else {
                    reject(error.message);
                }
            });
        });
    }

    private async saveFromFile(useSymLink = true): Promise<string> {
        assert(typeof this.location === "string", "impossible");
        const name = this.getName({
            inferredName: path.basename(this.location),
        });
        const saved = this.getSavingPath(name);

        if (useSymLink) {
            await symlink(this.location, saved);
            return (this.saved = saved);
        } else {
            await cp(this.location, saved, { force: true });
            return (this.saved = saved);
        }
    }
}
