const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createDb } = require("./db");
const { createProfileHandler: createFixed } = require("./profileRoutes");
const {
  createProfileHandler: createVulnerable,
} = require("../lab/vulnerable/profileRoutes.v1");

const DEMO_DIR = path.join(__dirname, "..", "demo");
const FILES = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/loginform.html": ["loginform.html", "text/html; charset=utf-8"],
  "/dist/loginform.js": ["dist/loginform.js", "text/javascript; charset=utf-8"],
};

/**
 * Demo launcher: serves the demo pages and mounts BOTH implementations side by side
 * (each with its own seeded in-memory DB):  /vuln/*  = PR #104 as proposed,  /fixed/* = after the fix.
 */
function createDemoServer() {
  const vulnerable = createVulnerable(createDb());
  const fixed = createFixed(createDb());
  return http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname.startsWith("/vuln/") || pathname.startsWith("/fixed/")) {
      const mount = pathname.startsWith("/vuln/") ? vulnerable : fixed;
      req.url = req.url.slice(req.url.indexOf("/", 1));
      return mount(req, res);
    }
    const file = FILES[pathname];
    if (!file) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    try {
      res.setHeader("content-type", file[1]);
      res.end(fs.readFileSync(path.join(DEMO_DIR, file[0])));
    } catch {
      res.statusCode = 500;
      res.end("Demo file missing - run: npm run demo:day12");
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 4100;
  createDemoServer().listen(port, () =>
    console.log(`Day 12 demo on http://localhost:${port}`),
  );
}

module.exports = { createDemoServer };
