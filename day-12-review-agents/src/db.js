const { DatabaseSync } = require("node:sqlite");

/** In-memory database seeded with FAKE lab data only (no real credentials). */
function createDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    password_hash TEXT NOT NULL,
    api_key TEXT NOT NULL
  )`);
  const insert = db.prepare(
    "INSERT INTO users (id, name, email, role, password_hash, api_key) VALUES (?, ?, ?, ?, ?, ?)",
  );
  insert.run(
    1,
    "Mirza Yasir Abdullah Baig",
    "mirzayasirabdullahbaig07@users.noreply.github.com",
    "user",
    "$2b$10$FAKE-HASH-FOR-LAB-ONLY-yasir",
    "sk_test_FAKE_yasir_0001",
  );
  insert.run(
    2,
    "Ayesha Khan",
    "ayesha.khan@example.test",
    "user",
    "$2b$10$FAKE-HASH-FOR-LAB-ONLY-ayesha",
    "sk_test_FAKE_ayesha_0002",
  );
  insert.run(
    3,
    "Internship Admin",
    "admin@example.test",
    "admin",
    "$2b$10$FAKE-HASH-FOR-LAB-ONLY-admin",
    "sk_test_FAKE_admin_0003",
  );
  return db;
}

module.exports = { createDb };
