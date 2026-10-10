// ############################################################################
// INTENTIONALLY VULNERABLE - Day 12 lab only. This is PR #104 as first proposed
// (commit 454e0ec). Never import or deploy this file. It exists so the security
// tests and the demo can prove the Review Agent's findings are real.
// ############################################################################
// PR #104 - "Add profile endpoint so LoginForm can show who signed in"
const { authenticate } = require("../../src/auth");

function createProfileHandler(db) {
  return (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (req.method !== "GET" || url.pathname !== "/api/profile") {
      res.statusCode = 404;
      return res.end();
    }

    const callerId = authenticate(req);
    if (callerId === null) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }

    const userId = url.searchParams.get("userId");
    try {
      const rows = db.prepare("SELECT * FROM users WHERE id = " + userId).all();
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(rows));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  };
}

module.exports = { createProfileHandler };
