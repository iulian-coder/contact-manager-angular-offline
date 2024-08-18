const db = require('../sqlite-db');

const createContactsTable = () => {
  const sqlQuery = `
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT,
    email TEXT,
    phone TEXT,
    cell TEXT,
    registration_date TEXT,
    age INTEGER,
    profile_picture TEXT
  )
  `;

  return db.run(sqlQuery);
};

module.exports = { createContactsTable };
