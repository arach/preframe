import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

export function cacheClear(outDir: string, key: string): void {
	const p = join(outDir, `.cache-${key}.json`);
	try {
		if (existsSync(p)) unlinkSync(p);
	} catch {
		/* ignore */
	}
}

export function cacheGet<T>(outDir: string, key: string): T | null {
	const path = join(outDir, `.cache-${key}.json`);
	if (existsSync(path)) {
		try {
			return JSON.parse(readFileSync(path, "utf-8"));
		} catch {}
	}
	return null;
}

export function cacheSet(outDir: string, key: string, data: unknown): void {
	writeFileSync(join(outDir, `.cache-${key}.json`), JSON.stringify(data, null, 2));
}
