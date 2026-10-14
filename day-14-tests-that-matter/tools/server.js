// Tiny server for the browser journey: the LoginForm page, a bundle chosen by the caller,
// and the REAL fixed Day 12 API mounted under /fixed (fresh seeded in-memory DB per server).
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createDb } = require("../../day-12-review-agents/src/db");
const { createProfileHandler } = require("../../day-12-review-agents/src/profileRoutes");

const PAGE = path.join(
  __dirname,
  "..",
  "..",
  "day-12-review-agents",
  "demo",
  "loginform.html",
);

function createServer(bundlePath) {
  const api = createProfileHandler(createDb());
  return http.createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname.startsWith("/fixed/")) {
      req.url = req.url.slice("/fixed".length);
      return api(req, res);
    }
    if (pathname === "/loginform.html") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.end(fs.readFileSync(PAGE));
    }
    if (pathname === "/dist/loginform.js") {
      res.setHeader("content-type", "text/javascript; charset=utf-8");
      return res.end(fs.readFileSync(bundlePath));
    }
    res.statusCode = 404;
    res.end("Not found");
  });
}

module.exports = { createServer };
