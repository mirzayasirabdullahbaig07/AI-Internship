const { DatabaseSync } = require("node:sqlite");

/** In-memory DB with FAKE lab data. `hash` decides how passwords are stored (insecure: md5, secure: scrypt). */
function createDb(hash) {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
                        role TEXT NOT NULL DEFAULT 'user', password_hash TEXT NOT NULL);
    CREATE TABLE notes (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL,
                        title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '');
  `);
  const user = db.prepare(
    "INSERT INTO users (id, name, email, role, password_hash) VALUES (?, ?, ?, ?, ?)",
  );
  user.run(
    1,
    "Mirza Yasir Abdullah Baig",
    "mirzayasirabdullahbaig07@users.noreply.github.com",
    "user",
    hash("lab-pass-yasir-1"),
  );
  user.run(
    2,
    "Ayesha Khan",
    "ayesha.khan@example.test",
    "user",
    hash("lab-pass-ayesha-2"),
  );
  user.run(
    3,
    "Internship Admin",
    "admin@example.test",
    "admin",
    hash("lab-pass-admin-3"),
  );
  const note = db.prepare("INSERT INTO notes (owner_id, title, body) VALUES (?, ?, ?)");
  note.run(1, "Private: interview prep", "Fake lab note owned by Yasir.");
  note.run(2, "Shopping list", "Fake lab note owned by Ayesha.");
  note.run(3, "Release checklist", "Fake lab note owned by the admin.");
  return db;
}

/** Credentials of the three FAKE lab users. */
const LAB_USERS = {
  yasir: {
    id: 1,
    email: "mirzayasirabdullahbaig07@users.noreply.github.com",
    password: "lab-pass-yasir-1",
    name: "Mirza Yasir Abdullah Baig",
  },
  ayesha: {
    id: 2,
    email: "ayesha.khan@example.test",
    password: "lab-pass-ayesha-2",
    name: "Ayesha Khan",
  },
  admin: {
    id: 3,
    email: "admin@example.test",
    password: "lab-pass-admin-3",
    name: "Internship Admin",
  },
};

module.exports = { createDb, LAB_USERS };
