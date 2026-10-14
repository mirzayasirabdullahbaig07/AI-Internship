const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createDb } = require("./db");
const insecure = require("../lab/insecure/notesApi");
const secure = require("./notesApi");

const PAGE = path.join(__dirname, "..", "demo", "index.html");

/** Demo launcher: both APIs side by side (/insecure/* and /secure/*) plus POST /reset for fresh databases. */
function createDemoServer() {
  const build = () => ({
    insecure: insecure.createNotesHandler(createDb(insecure.md5)),
    secure: secure.createNotesHandler(createDb(secure.hashPassword)),
  });
  let handlers = build();
  return http.createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    if (req.method === "POST" && pathname === "/reset") {
      handlers = build();
      res.statusCode = 204;
      return res.end();
    }
    const side = /^\/(insecure|secure)\//.exec(pathname);
    if (side) {
      req.url = req.url.slice(side[1].length + 1);
      return handlers[side[1]](req, res);
    }
    if (pathname === "/") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.end(fs.readFileSync(PAGE));
    }
    res.statusCode = 404;
    res.end("Not found");
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 4300;
  createDemoServer().listen(port, () =>
    console.log(`Day 15 demo on http://localhost:${port}`),
  );
}

module.exports = { createDemoServer };
