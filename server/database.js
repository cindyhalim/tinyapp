// queries export as functions
const db = require("./db/index.js");

const getUserWithEmail = function(email) {
  const queryString = `SELECT * FROM users WHERE email = $1;`;
  const values = [email];
  return db
    .query(queryString, values)
    .then(res => res.rows[0])
    .catch(err => console.log("query error", err.stack));
};

exports.getUserWithEmail = getUserWithEmail;
