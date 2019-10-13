const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  database: "tinyapp",
  user: "vagrant",
  password: "123"
});

module.exports = {
  query: (text, params) => {
    return pool.query(text, params);
  }
};
