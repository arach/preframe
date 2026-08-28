#!/usr/bin/env node

const EXPECTED_NODE_VERSION = "22.22.2";
const VERSION_ONLY = process.argv.includes("--version-only");
const CHECK_SQLITE = process.argv.includes("--sqlite");

function fail(message) {
  console.error(`\n[preframe:runtime] ${message}\n`);
  process.exit(1);
}

if (process.versions.node !== EXPECTED_NODE_VERSION) {
  fail(
    `Expected Node ${EXPECTED_NODE_VERSION}, but PATH resolved Node ${process.versions.node}. ` +
      `Activate the version in .node-version before installing or starting Preframe.`,
  );
}

if (VERSION_ONLY && !CHECK_SQLITE) {
  console.log(`[preframe:runtime] Node ${process.versions.node} (ABI ${process.versions.modules})`);
  process.exit(0);
}

if (CHECK_SQLITE) {
  try {
    const { default: Database } = await import("better-sqlite3");
    const database = new Database(":memory:");
    database.prepare("SELECT 1 AS ok").get();
    database.close();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(
      `better-sqlite3 is not compatible with Node ${process.versions.node} ` +
        `(ABI ${process.versions.modules}). Reinstall dependencies with the pinned Node runtime.\n${detail}`,
    );
  }
}

console.log(
  `[preframe:runtime] Node ${process.versions.node} (ABI ${process.versions.modules})` +
    (CHECK_SQLITE ? " · better-sqlite3 ready" : ""),
);
