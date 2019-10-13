const express = require("express");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");

const app = express();
const PORT = 8080;

const {
  findUserId,
  generateRandomString,
  emailExists,
  urlsForUser
} = require("./helpers.js");

//DATABASE
const urlDatabase = {};

const users = {};

require("dotenv").config();
const db = new Pool({
  host: "localhost",
  port: "5432",
  database: "tinyapp"
});

db.connect();

//MIDDLEWARE

app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"]
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

//LOGIN/REG

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let queryString = `SELECT * FROM users WHERE email = $1;`;
  const values = [req.body.email];
  db.query(queryString, values)
    .then(data => data.rows[0])
    .then(user => {
      // bcrypt.compareSync(req.body.password, user.password)
      if (req.body.password === user.password) {
        req.session.user_id = user.email;
        return res.redirect("/");
      } else {
        res.redirect("/login");
      }
    });

  // if (
  //   emailExists(email, users) &&
  //   bcrypt.compareSync(
  //     req.body.password,
  //     users[findUserId(email, users)].password
  //   )
  // ) {
  //   req.session.user_id = findUserId(email, users);
  //   res.redirect("/urls");
  // } else {
  //   res.statusCode = 403;
  //   res.send(
  //     `Error ${res.statusCode}: Email and password does not match or your email may not exist`
  //   );
  // }
});

app.post("/register", (req, res) => {
  // const queryString = `INSERT INTO users VALUES (email, password) VALUES ($1, $2) RETURNING id;`;
  // const values = [req.body.email, bcrypt.hashSync(req.body.password, 10)];
  // // console.log(values);
  // db.query(queryString, values)
  //   .then(data => {
  //     console.log(data);
  //     // req.session.user_id = data.rows[0].id;
  //     // res.redirect("/urls");
  //   })
  //   .catch(err => {
  //     if (req.body.email === "" || req.body.password === "") {
  //       res.statusCode = 400;
  //       res.send(`Error ${res.statusCode}: Invalid email and/or password`);
  //     } else if (emailExists(req.body.email, users)) {
  //       res.statusCode = 400;
  //       res.send(`Error ${res.statusCode}: Email already exists`);
  //     }
  //   });
  if (req.body.email === "" || req.body.password === "") {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}: Invalid email and/or password`);
  } else if (emailExists(req.body.email, users)) {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}: Email already exists`);
  } else {
    let userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = users[userID].id;
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//GET

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  if (users[req.session.user_id]) {
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id, urlDatabase, users)
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id]) {
    let templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id]) {
    if (
      users[req.session.user_id].id === urlDatabase[req.params.shortURL].userID
    ) {
      let templateVars = {
        user: users[req.session.user_id],
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL
      };
      res.render("urls_show", templateVars);
    } else {
      res.send("Access denied: this URL belongs to another user");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send("This URL does not exist");
  }
});

//POST

app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = {
    longURL: req.body.longURL,
    userID: users[req.session.user_id].id
  };
  let generatedStr = Object.keys(urlDatabase).find(
    key => urlDatabase[key].longURL === req.body.longURL
  );
  res.redirect(`/urls/${generatedStr}`);
});

app.delete("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send(`Error: Cannot remove someone else's URL`);
  }
});

app.put("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.send(`Error: Cannot edit someone else's URL`);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
