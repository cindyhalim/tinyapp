--URLS TABLE--
CREATE TABLE urls
(
  id SERIAL PRIMARY KEY NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  long_url VARCHAR(255) NOT NULL,
  short_url VARCHAR(50) NOT NULL
);