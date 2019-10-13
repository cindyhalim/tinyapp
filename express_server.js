const express = require("express");
const { Pool } = require("pg");
const apiRoutes = require("./server/apiRoutes");
const userRoutes = require("./server/userRoutes");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 8080;

//MIDDLEWARE

app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"]
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

//MODULES

const {
  findUserId,
  generateRandomString,
  emailExists,
  urlsForUser
} = require("./helpers.js");

//DATABASE

const db = new Pool({
  host: "localhost",
  database: "tinyapp",
  user: "vagrant",
  password: "123"
});

const urlDatabase = {};

const users = {};

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

// USER
app.get("/login", async (req, res) => {
  const userInfo = await getUserById(req.session.user_id);
  let templateVars = { user: userInfo };
  res.render("urls_login", templateVars);
});

app.get("/register", async (req, res) => {
  const userInfo = await getUserById(req.session.user_id);
  let templateVars = { user: userInfo };
  res.render("urls_register", templateVars);
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const userInfo = await getUserByEmail(email);
  if (
    userInfo &&
    (req.body.password === userInfo.password ||
      bcrypt.compareSync(req.body.password, userInfo.password))
  ) {
    req.session.user_id = userInfo.id;
    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.send(
      `Error ${res.statusCode}: Email and password does not match or your email may not exist`
    );
  }
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const userInfo = await getUserByEmail(email);
  if (email === "" || password === "") {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}: Enter email and/or password`);
  } else if (userInfo.email === email) {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}: Email already exists`);
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    return addNewUser(email, hashedPassword).then(data => {
      req.session.user_id = data.rows[0].id;
      if (data.error) {
        return res.redirect("/register");
      } else {
        res.redirect("/urls");
      }
    });
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//GET

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", async (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      user: await getUserById(req.session.user_id),
      urls: await getUrlById(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/new", async (req, res) => {
  if (req.session.user_id) {
    let templateVars = { user: await getUserById(req.session.user_id) };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

const getUrlById = function(userID) {
  const queryString = `SELECT * FROM urls WHERE user_id = $1;`;
  const values = [userID];
  return db.query(queryString, values).then(data => data.rows);
};

const getLongUrlByIdAndShortURL = function(userID, shortURL) {
  const queryString = `SELECT * FROM urls WHERE user_id = $1 AND short_url = $2;`;
  const values = [userID, shortURL];
  return db.query(queryString, values).then(data => data.rows[0].long_url);
};

app.get("/urls/:shortURL", async (req, res) => {
  if (req.session.user_id) {
    let shortURL = req.params.shortURL;
    let userID = req.session.user_id;

    let templateVars = {
      user: await getUserById(userID),
      shortURL,
      longURL: await getLongUrlByIdAndShortURL(userID, shortURL)
    };
    res.render("urls_show", templateVars);
  } else {
    //if a unique visitor cookie then notify  res.send("Access denied: this URL belongs to another user");
    res.redirect("/login");
  }
});

// app.get("/urls/:shortURL", (req, res) => {
//   if (req.session.user_id) {
//     if (
//       users[req.session.user_id].id === urlDatabase[req.params.shortURL].userID
//     ) {
//       let templateVars = {
//         user: users[req.session.user_id],
//         shortURL: req.params.shortURL,
//         longURL: urlDatabase[req.params.shortURL].longURL
//       };
//       res.render("urls_show", templateVars);
//     } else {
//       res.send("Access denied: this URL belongs to another user");
//     }
//   } else {
//     res.redirect("/login");
//   }
// });

app.get("/u/:shortURL", async (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send("This URL does not exist");
  }
});

//POST
const addNewURL = function(userID, longURL, shortURL) {
  let queryString = `INSERT INTO urls (user_id, long_url, short_url) VALUES ($1, $2, $3)`;
  let values = [userID, longURL, shortURL];
  db.query(queryString, values).then(data => data.rows[0]);
};

app.post("/urls", async (req, res) => {
  const newShortURL = generateRandomString();
  await addNewURL(req.session.user_id, req.body.longURL, newShortURL);
  res.redirect(`/urls/${newShortURL}`);
});

// app.post("/urls", (req, res) => {
//   urlDatabase[generateRandomString()] = {
//     longURL: req.body.longURL,
//     userID: users[req.session.user_id].id
//   };
//   let generatedStr = Object.keys(urlDatabase).find(
//     key => urlDatabase[key].longURL === req.body.longURL
//   );
//   res.redirect(`/urls/${generatedStr}`);
// });

const deleteURL = function(userID, shortURL) {
  let queryString = `DELETE FROM urls WHERE user_id = $1 AND short_url = $2`;
  let values = [userID, shortURL];
  return db.query(queryString, values);
};

app.post("/urls/:shortURL/delete", async (req, res) => {
  const userInfo = await getUserById(req.session.user_id);
  if (req.session.user_id === userInfo.id) {
    await deleteURL(req.session.user_id, req.params.shortURL);
  } else {
    res.send(`Error: Cannot remove someone else's URL`);
  }
});
// app.post("/urls/:shortURL/delete", (req, res) => {
//   if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
//     delete urlDatabase[req.params.shortURL];
//     res.redirect("/urls");
//   } else {
//     res.send(`Error: Cannot remove someone else's URL`);
//   }
// });

const editExistingURL = function(userID, shortURL, newLongURL) {
  let queryString = `UPDATE urls SET long_url = $1 WHERE user_id = $2 AND short_url = $3;`;
  let values = [newLongURL, userID, shortURL];
  return db.query(queryString, values);
};

app.post("/urls/:shortURL", async (req, res) => {
  const userInfo = await getUserById(req.session.user_id);
  if (req.session.user_id === userInfo.id) {
    await editExistingURL(
      req.session.user_id,
      req.params.shortURL,
      req.body.longURL
    );
    res.redirect("/urls");
  } else {
    res.send(`Error: Cannot edit someone else's URL`);
  }
});
// app.post("/urls/:shortURL", (req, res) => {
//   if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
//     urlDatabase[req.params.shortURL].longURL = req.body.longURL;
//     res.redirect("/urls");
//   } else {
//     res.send(`Error: Cannot edit someone else's URL`);
//   }
// });

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
