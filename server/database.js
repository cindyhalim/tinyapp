// DATABASE CONNECT //

const { Pool } = require("pg");

const db = new Pool({
  host: "localhost",
  database: "tinyapp",
  user: "vagrant",
  password: "123"
});

// QUERIES //
const getUserByEmail = function(email) {
  const queryString = `SELECT * FROM users WHERE email = $1;`;
  const values = [email];
  return db.query(queryString, values).then(res => res.rows[0]);
};

const addNewUser = function(email, password) {
  const queryString = `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id`;
  const values = [email, password];
  return db.query(queryString, values);
};

const getUserById = function(id) {
  const queryString = `SELECT * FROM users WHERE id = $1;`;
  const values = [id];
  return db.query(queryString, values).then(res => res.rows[0]);
};

const getUrlById = function(userID) {
  const queryString = `SELECT * FROM urls WHERE user_id = $1 ORDER BY id;`;
  const values = [userID];
  return db.query(queryString, values).then(data => data.rows);
};

const getLongUrl = function(shortURL) {
  const queryString = `SELECT * FROM urls WHERE short_url = $1;`;
  const values = [shortURL];
  return db.query(queryString, values).then(data => data.rows[0].long_url);
};

const doesShortURLExist = function(shortURL) {
  let queryString = `SELECT * FROM urls WHERE short_url = $1`;
  let values = [shortURL];
  return db.query(queryString, values).then(data => {
    if (data.rows[0]) {
      return true;
    } else {
      return false;
    }
  });
};

const addNewURL = function(userID, longURL, shortURL) {
  let queryString = `INSERT INTO urls (user_id, long_url, short_url) VALUES ($1, $2, $3)`;
  let values = [userID, longURL, shortURL];
  return db.query(queryString, values).then(data => data.rows[0]);
};

const deleteURL = function(userID, shortURL) {
  let queryString = `DELETE FROM urls WHERE user_id = $1 AND short_url = $2`;
  let values = [userID, shortURL];
  return db.query(queryString, values);
};

const editExistingURL = function(userID, shortURL, newLongURL) {
  let queryString = `UPDATE urls SET long_url = $1 WHERE user_id = $2 AND short_url = $3;`;
  let values = [newLongURL, userID, shortURL];
  return db.query(queryString, values);
};

const getURLId = function(shortURL) {
  let queryString = `SELECT * FROM urls WHERE short_url = $1`;
  let values = [shortURL];
  return db.query(queryString, values);
};
const addVisitor = function(urlID, visitorID) {
  let queryString = `INSERT INTO visits (url_id, visitor_id) VALUES $1, $2`;
  let values = [urlID, visitorID];
  return db.query(queryString, values);
};

const totalVisits = function(shortURL) {
  let queryString = `SELECT COUNT(*) FROM visits
  JOIN urls ON url_id = urls.id 
  WHERE short_url = $1;`;
  let values = [shortURL];
  return db.query(queryString, values);
};

const uniqueVisits = function(shortURL) {
  let queryString = `SELECT COUNT(*) FROM visits WHERE `;
};

module.exports = {
  getUserByEmail,
  addNewUser,
  getUserById,
  getUrlById,
  getLongUrl,
  doesShortURLExist,
  addNewURL,
  deleteURL,
  editExistingURL
};
